(function () {
  "use strict";
  var API_BASE = "https://school-auth.pyun3708.workers.dev";

  function ensureUI() {
    if (!document.getElementById("loginGate")) {
      var gate = document.createElement("div");
      gate.id = "loginGate";
      gate.style.cssText =
        "position:fixed;inset:0;z-index:10000;background:#000;display:none;align-items:center;justify-content:center;flex-direction:column;color:#c8ced1;font-family:Microsoft YaHei,monospace;padding:20px;text-align:center";
      gate.innerHTML =
        '<div style="max-width:420px"><div style="letter-spacing:3px;margin-bottom:12px">需要登录</div><p style="font-size:14px;color:#889;line-height:1.6">请先在学校官网登录<strong>学生账号</strong>后再参加教师资格证考试。</p><a href="login.html" style="display:inline-block;margin-top:16px;padding:10px 18px;border:1px solid #4c565b;color:#c8ced1;text-decoration:none">前往登录</a><div style="margin-top:10px"><a href="school.html" style="color:#889;font-size:13px">返回学校官网</a></div></div>';
      document.body.appendChild(gate);
    }
    if (!document.getElementById("transVideoWrap")) {
      var wrap = document.createElement("div");
      wrap.id = "transVideoWrap";
      wrap.style.cssText =
        "position:fixed;inset:0;z-index:120;background:#000;display:none;align-items:center;justify-content:center";
      wrap.innerHTML =
        '<video id="transVideo" playsinline webkit-playsinline style="max-width:100%;max-height:100%;object-fit:contain;background:#000"></video>';
      document.body.appendChild(wrap);
    }
    if (!document.getElementById("sexNoiseBtn")) {
      var btn = document.createElement("button");
      btn.id = "sexNoiseBtn";
      btn.type = "button";
      btn.textContent = "性噪声：开";
      btn.style.cssText =
        "position:fixed;right:12px;bottom:12px;z-index:200;padding:8px 12px;border:1px solid #c06090;background:rgba(20,10,16,.85);color:#f5d0e0;font:12px/1.2 Microsoft YaHei,sans-serif;border-radius:6px;cursor:pointer;display:none;letter-spacing:.05em";
      btn.onclick = toggleSexNoise;
      document.body.appendChild(btn);
    }
    var resultPanel = document.querySelector("#resultScreen .panel");
    if (resultPanel && !document.getElementById("resultExtra")) {
      var extra = document.createElement("div");
      extra.id = "resultExtra";
      extra.style.cssText =
        "max-width:720px;margin:16px auto 0;color:#c8ced1;font:14px/1.7 Microsoft YaHei,sans-serif;text-align:left";
      resultPanel.appendChild(extra);
    }
  }

  var sexNoiseAudio = null;
  var sexNoiseOn = true;
  window.startSexNoise = function startSexNoise() {
    var btn = document.getElementById("sexNoiseBtn");
    if (btn) btn.style.display = "block";
    if (!sexNoiseAudio) {
      sexNoiseAudio = new Audio("media/sex-noise.mp3");
      sexNoiseAudio.loop = true;
      sexNoiseAudio.volume = 0.55;
    }
    if (sexNoiseOn) sexNoiseAudio.play().catch(function () {});
  };
  window.stopSexNoise = function stopSexNoise() {
    if (sexNoiseAudio) {
      try {
        sexNoiseAudio.pause();
        sexNoiseAudio.currentTime = 0;
      } catch (e) {}
    }
    var btn = document.getElementById("sexNoiseBtn");
    if (btn) btn.style.display = "none";
  };
  function toggleSexNoise() {
    sexNoiseOn = !sexNoiseOn;
    var btn = document.getElementById("sexNoiseBtn");
    if (btn) btn.textContent = sexNoiseOn ? "性噪声：开" : "性噪声：关";
    if (!sexNoiseAudio) return;
    if (sexNoiseOn) sexNoiseAudio.play().catch(function () {});
    else sexNoiseAudio.pause();
  }

  /** 视频占一个转场位，与图片序号对齐 */
  function advanceTransIdx() {
    try {
      if (typeof window.transIdx === "number") window.transIdx++;
      else window.transIdx = 1;
    } catch (e) {}
  }

  window.playQ20VideoTransition = function playQ20VideoTransition(done) {
    var wrap = document.getElementById("transVideoWrap");
    var vid = document.getElementById("transVideo");
    var finished = false;

    function finish(useImageFallback) {
      if (finished) return;
      finished = true;
      if (wrap) wrap.style.display = "none";
      if (vid) {
        try {
          vid.onended = null;
          vid.onerror = null;
          vid.pause();
          vid.removeAttribute("src");
          vid.load();
        } catch (e) {}
      }
      if (useImageFallback && typeof doTransition === "function") {
        // 失败时走普通转场（内部会 +1 transIdx）
        doTransition(done);
      } else {
        // 视频成功：补一次序号，避免后面图片整体错位
        advanceTransIdx();
        if (typeof done === "function") done();
      }
    }

    if (!wrap || !vid) {
      finish(true);
      return;
    }

    wrap.style.display = "flex";
    vid.setAttribute("playsinline", "");
    vid.setAttribute("webkit-playsinline", "");
    // 用户刚点过「下一题」，一般允许有声；若被拦再静音重试
    vid.muted = false;
    vid.playsInline = true;
    vid.src = "media/q20-trans.mp4";
    vid.currentTime = 0;

    vid.onended = function () {
      finish(false);
    };
    vid.onerror = function () {
      finish(true);
    };

    var p = vid.play();
    if (p && p.catch) {
      p.catch(function () {
        // 自动播放被拦：静音再试一次
        try {
          vid.muted = true;
          var p2 = vid.play();
          if (p2 && p2.catch) {
            p2.catch(function () {
              finish(true);
            });
          }
        } catch (e) {
          finish(true);
        }
      });
    }

    // 安全超时（视频约 7～8 秒，给足余量）
    setTimeout(function () {
      if (!finished) finish(false);
    }, 12000);
  };

  function installNextQuiz() {
    if (typeof window.nextQuiz !== "function") return;
    window.nextQuiz = function nextQuiz() {
      var selected = [...document.querySelectorAll("#qOptions .option.selected")].map(function (x) {
        return x.textContent;
      });
      answers[qIdx] = selected;
      addScores(quiz[qIdx], selected);
      var finishedQ20 = qIdx === 19;
      var goNext = function () {
        if (qIdx < quiz.length - 1) {
          qIdx++;
          renderQuiz();
        } else {
          document.getElementById("quizScreen").classList.add("hidden");
          if (typeof applyPinkPhase === "function") applyPinkPhase();
          document.getElementById("interviewScreen").style.display = "flex";
          dialogueStep = 0;
          showDialogue();
        }
      };
      if (finishedQ20) {
        startSexNoise();
        playQ20VideoTransition(goNext);
      } else {
        doTransition(goNext);
      }
    };
  }

  function installRenderQuiz() {
    if (typeof window.renderQuiz !== "function") return;
    var orig = window.renderQuiz;
    window.renderQuiz = function () {
      orig.apply(this, arguments);
      if (typeof qIdx !== "undefined" && qIdx >= 19) startSexNoise();
    };
  }

  var SEX_ATTRS = ["媚黑", "淫荡", "绿帽", "S属性", "M属性", "阳具崇拜"];
  var VIRTUE_ATTRS = ["宽容", "善良", "热心", "公正", "纯洁"];
  var PERSON_ATTRS = ["自信", "自卑", "严厉", "责任心"];

  function sumAttrs(list) {
    return list.reduce(function (s, k) {
      return s + (totalScore[k] || 0);
    }, 0);
  }

  function buildResultExtra() {
    var box = document.getElementById("resultExtra");
    if (!box) return;
    var sex = sumAttrs(SEX_ATTRS);
    var virtue = sumAttrs(VIRTUE_ATTRS);
    var person = sumAttrs(PERSON_ATTRS);
    var passed = sex >= 500 && virtue >= 100 && person >= 100;

    var html = "<h2 style='font-size:16px;letter-spacing:.08em;margin:12px 0 6px;color:#e8a0d0'>属性汇总</h2>";
    html +=
      '<div style="margin:4px 0">色色属性（媚黑+淫荡+绿帽+S+M+阳具崇拜）：<b>' +
      sex +
      "</b> " +
      (sex >= 500 ? "✓" : "（需≥500）") +
      "</div>";
    html +=
      '<div style="margin:4px 0">美德属性（宽容+善良+热心+公正+纯洁）：<b>' +
      virtue +
      "</b> " +
      (virtue >= 100 ? "✓" : "（需≥100）") +
      "</div>";
    html +=
      '<div style="margin:4px 0">人格属性（自信+自卑+严厉+责任心）：<b>' +
      person +
      "</b> " +
      (person >= 100 ? "✓" : "（需≥100）") +
      "</div>";

    if (passed) {
      html +=
        '<p style="color:#7dcea0;font-weight:700">恭喜您通过了反媚黑高校教师资格证考试♠，欢迎成为反媚黑事业的高贵战士的一员❤</p>';
      html += "<h2 style='font-size:16px;color:#e8a0d0;margin:12px 0 6px'>领取教师资格证</h2>";
      html +=
        '<p style="font-size:13px;color:#99a">请填写主要负责的课程。通过后将生成<strong>仅绑定本账号</strong>的九位教师编号（前四位为年份，如 202600001），用于注册教师账号，他人无法使用。</p>';
      html +=
        '<label>主要负责的课程</label><input id="certCourse" maxlength="40" placeholder="例如：反差婊洗脑课程" style="width:100%;box-sizing:border-box;margin:6px 0;padding:8px;background:#0b0f11;border:1px solid #3c454a;color:#d8dde0">';
      html +=
        '<label>上传教师资格证头像</label><input id="certPhoto" type="file" accept="image/*" style="width:100%;margin:6px 0;color:#d8dde0">';
      html +=
        '<label style="display:flex;align-items:center;gap:8px;margin-top:8px"><input type="checkbox" id="certPublic"> 愿意将教师资格证展示在学校官网「教师介绍」</label>';
      html +=
        '<div><button type="button" id="btnIssueCert" style="margin:8px 6px 8px 0;padding:10px 14px;border:1px solid #4c565b;background:#0a0d0f;color:#c8ced1;cursor:pointer">生成教师资格证</button></div>';
      html += '<canvas id="certCanvas" width="900" height="1273" style="display:none"></canvas>';
      html += '<img id="certPreview" alt="教师资格证预览" style="display:none;max-width:100%;margin-top:12px;border:1px solid #3c454a">';
      html += '<div id="certMsg" style="margin-top:8px;font-size:13px;color:#e8a0d0"></div>';
    } else {
      html += '<p style="color:#e74c3c;font-weight:700">很遗憾，你未能通过本次教师资格证考试。请再接再厉。</p>';
    }
    html +=
      '<div style="margin-top:18px"><a href="school.html" style="display:inline-block;padding:10px 16px;border:1px solid #4c565b;color:#c8ced1;text-decoration:none">返回学校官网</a></div>';
    box.innerHTML = html;
    var b = document.getElementById("btnIssueCert");
    if (b) b.onclick = issueTeacherCert;
  }

  function compressImageFile(file, maxW, quality) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var scale = Math.min(1, maxW / img.width);
          var c = document.createElement("canvas");
          c.width = Math.round(img.width * scale);
          c.height = Math.round(img.height * scale);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function issueTeacherCert() {
    var course = (document.getElementById("certCourse") || {}).value || "";
    var fileInput = document.getElementById("certPhoto");
    var pub = !!(document.getElementById("certPublic") || {}).checked;
    var msg = document.getElementById("certMsg");
    if (!course.trim()) {
      if (msg) msg.textContent = "请填写主要负责的课程";
      return;
    }
    if (msg) msg.textContent = "生成中…";
    var photoData = "";
    if (fileInput && fileInput.files && fileInput.files[0]) {
      photoData = await compressImageFile(fileInput.files[0], 320, 0.72);
    }
    var token = localStorage.getItem("school_token") || sessionStorage.getItem("school_token") || "";
    var teacherId = "";
    var profile = { name: typeof candidateName !== "undefined" && candidateName ? candidateName : "考生", gender: "", age: "" };
    try {
      if (token) {
        var me = await fetch(API_BASE + "/auth/me", { headers: { Authorization: "Bearer " + token } }).then(function (r) {
          return r.json();
        });
        if (me && me.user) {
          profile.name = me.user.display_name || me.user.username || profile.name;
          profile.gender = me.user.gender || "";
        }
      }
      var res = await fetch(API_BASE + "/teacher/cert/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          course: course.trim(),
          public_display: pub,
          scores: totalScore,
          name: profile.name,
          gender: profile.gender,
        }),
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || "发证失败");
      teacherId = data.teacher_id;
      if (msg) msg.textContent = "";
    } catch (e) {
      teacherId = "2026" + String(Math.floor(Math.random() * 90000) + 10000);
      if (msg)
        msg.textContent =
          "提示：" + (e.message || e) + "；已生成本地预览编号 " + teacherId + "（请部署 Worker 发证接口后重试以正式绑定）";
    }
    await drawTeacherCert({
      name: profile.name,
      gender: profile.gender || "—",
      age: profile.age || "—",
      course: course.trim(),
      teacherId: teacherId,
      photoData: photoData,
    });
    if (msg && msg.textContent.indexOf("提示") < 0)
      msg.textContent = "教师编号 " + teacherId + " 已绑定本账号，请妥善保存。此编号是注册教师账号的唯一凭证。";
  }

  function drawTeacherCert(info) {
    return new Promise(function (resolve) {
      var canvas = document.getElementById("certCanvas");
      var preview = document.getElementById("certPreview");
      if (!canvas) {
        resolve();
        return;
      }
      var ctx = canvas.getContext("2d");
      var bg = new Image();
      bg.onload = function () {
        canvas.width = bg.width;
        canvas.height = bg.height;
        ctx.drawImage(bg, 0, 0);
        var ax = bg.width * 0.08,
          ay = bg.height * 0.22,
          aw = bg.width * 0.28,
          ah = bg.height * 0.32;
        function fillText() {
          var w = bg.width,
            h = bg.height;
          ctx.fillStyle = "#1a1020";
          ctx.font = "bold " + Math.round(h * 0.028) + "px Microsoft YaHei,sans-serif";
          ctx.textAlign = "left";
          var tx = w * 0.42,
            ty = h * 0.26,
            lh = h * 0.055;
          [
            "姓名：" + (info.name || ""),
            "性别：" + (info.gender || ""),
            "年龄：" + (info.age || ""),
            "主要负责的课程：" + (info.course || ""),
            "教师编号：" + (info.teacherId || ""),
          ].forEach(function (t, i) {
            ctx.fillText(t, tx, ty + i * lh);
          });
          ctx.font = Math.round(h * 0.025) + "px 'Segoe Script','Brush Script MT',cursive,Microsoft YaHei";
          ctx.fillStyle = "#2a1520";
          ctx.fillText(info.name || "", w * 0.1, h * 0.78);
          ctx.font = Math.round(h * 0.022) + "px Microsoft YaHei,sans-serif";
          ctx.fillStyle = "#8b2252";
          ctx.textAlign = "right";
          ctx.fillText("草莓酱老师审批通过", w * 0.92, h * 0.88);
        }
        function finish() {
          canvas.style.display = "none";
          if (preview) {
            preview.src = canvas.toDataURL("image/png");
            preview.style.display = "block";
          }
          resolve();
        }
        if (info.photoData) {
          var p = new Image();
          p.onload = function () {
            ctx.save();
            ctx.beginPath();
            ctx.rect(ax, ay, aw, ah);
            ctx.clip();
            var s = Math.max(aw / p.width, ah / p.height);
            var pw = p.width * s,
              ph = p.height * s;
            ctx.drawImage(p, ax + (aw - pw) / 2, ay + (ah - ph) / 2, pw, ph);
            ctx.restore();
            fillText();
            finish();
          };
          p.src = info.photoData;
        } else {
          fillText();
          finish();
        }
      };
      bg.onerror = function () {
        if (preview) {
          preview.alt = "模板加载失败，请确认 media/jszgz.png 已上传";
          preview.style.display = "block";
        }
        resolve();
      };
      bg.src = "media/jszgz.png";
    });
  }

  function installShowRadar() {
    if (typeof window.showRadar !== "function") return;
    var orig = window.showRadar;
    window.showRadar = function () {
      orig.apply(this, arguments);
      stopSexNoise();
      buildResultExtra();
    };
  }

  async function checkLoginGate() {
    var gate = document.getElementById("loginGate");
    var token = localStorage.getItem("school_token") || sessionStorage.getItem("school_token") || "";
    if (!token) {
      if (gate) gate.style.display = "flex";
      return;
    }
    try {
      var res = await fetch(API_BASE + "/auth/me", { headers: { Authorization: "Bearer " + token } });
      if (!res.ok) {
        if (gate) gate.style.display = "flex";
        return;
      }
      var data = await res.json();
      if (!data || !data.user) {
        if (gate) gate.style.display = "flex";
        return;
      }
      if (gate) gate.style.display = "none";
      if (data.user.display_name || data.user.username) {
        try {
          candidateName = data.user.display_name || data.user.username;
        } catch (e) {}
      }
    } catch (e) {
      if (gate) gate.style.display = "flex";
    }
  }

  function boot() {
    ensureUI();
    installNextQuiz();
    installRenderQuiz();
    installShowRadar();
    checkLoginGate();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  window.addEventListener("load", function () {
    ensureUI();
    installNextQuiz();
    installRenderQuiz();
    installShowRadar();
  });
})();
