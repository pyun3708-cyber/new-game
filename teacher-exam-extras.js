(function () {
  "use strict";
  var API_BASE = "https://school-auth.pyun3708.workers.dev";
  var Q20_VIDEO_SRC = (typeof window !== "undefined" && window.Q20_VIDEO_SRC) ? window.Q20_VIDEO_SRC : "media/q20-trans.mp4";
  var SEX_NOISE_SRC = "media/sex-noise.mp3";
  var q20BlobUrl = null;
  var q20Ready = false;

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
        "position:fixed;inset:0;z-index:9999;background:#000;display:none;align-items:center;justify-content:center";
      wrap.innerHTML =
        '<video id="transVideo" playsinline webkit-playsinline preload="auto" style="max-width:100%;max-height:100%;object-fit:contain;background:#000"></video>';
      document.body.appendChild(wrap);
    }
    if (!document.getElementById("q20PreloadVideo")) {
      var pv = document.createElement("video");
      pv.id = "q20PreloadVideo";
      pv.preload = "auto";
      pv.muted = true;
      pv.playsInline = true;
      pv.setAttribute("playsinline", "");
      pv.setAttribute("webkit-playsinline", "");
      pv.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px";
      document.body.appendChild(pv);
    }
    if (!document.getElementById("sexNoiseAudio")) {
      var au = document.createElement("audio");
      au.id = "sexNoiseAudio";
      au.loop = true;
      au.preload = "auto";
      au.style.display = "none";
      document.body.appendChild(au);
    }
    if (!document.getElementById("sexNoiseToggle")) {
      var btn = document.createElement("button");
      btn.id = "sexNoiseToggle";
      btn.type = "button";
      btn.textContent = "性噪声: 开";
      btn.style.cssText =
        "display:none;position:fixed;right:12px;bottom:12px;z-index:10001;padding:8px 12px;border:1px solid #4c565b;background:#0a0d0f;color:#c8ced1;border-radius:8px;font:12px Microsoft YaHei,sans-serif;cursor:pointer";
      document.body.appendChild(btn);
    }
    if (!document.getElementById("resultExtra")) {
      var extra = document.createElement("div");
      extra.id = "resultExtra";
      extra.style.cssText =
        "max-width:720px;margin:16px auto 0;color:#c8ced1;font:14px/1.7 Microsoft YaHei,sans-serif;padding:0 12px 24px";
      var rs = document.getElementById("resultScreen");
      if (rs) rs.appendChild(extra);
      else document.body.appendChild(extra);
    }
  }

  function token() {
    return localStorage.getItem("school_token") || "";
  }
  function me() {
    try {
      return JSON.parse(localStorage.getItem("school_user") || "null");
    } catch (e) {
      return null;
    }
  }
  async function api(path, opts) {
    opts = opts || {};
    var headers = { "Content-Type": "application/json" };
    if (token()) headers.Authorization = "Bearer " + token();
    var res = await fetch(API_BASE + path, {
      method: opts.method || "GET",
      headers: headers,
      body: opts.body,
    });
    var data = await res.json().catch(function () {
      return {};
    });
    if (!res.ok) throw new Error(data.error || "HTTP " + res.status);
    return data;
  }

  function preloadQ20Video() {
    var vid = document.getElementById("q20PreloadVideo");
    if (!vid) return;
    var src = Q20_VIDEO_SRC;
    if (typeof resolveMediaSrc === "function") src = resolveMediaSrc(src);
    if (vid.dataset.src === src && q20Ready) return;
    vid.dataset.src = src;
    vid.src = src;
    vid.load();
    var mark = function () {
      q20Ready = true;
      try {
        if (!q20BlobUrl && vid.captureStream) {
          /* keep element src */
        }
      } catch (e) {}
    };
    vid.addEventListener("canplaythrough", mark, { once: true });
    vid.addEventListener("loadeddata", mark, { once: true });
  }

  function playQ20Transition(done) {
    ensureUI();
    var wrap = document.getElementById("transVideoWrap");
    var vid = document.getElementById("transVideo");
    if (!wrap || !vid) {
      if (done) done();
      return;
    }
    var src = Q20_VIDEO_SRC;
    if (typeof resolveMediaSrc === "function") src = resolveMediaSrc(src);
    var finished = false;
    var finish = function () {
      if (finished) return;
      finished = true;
      try {
        vid.pause();
      } catch (e) {}
      wrap.style.display = "none";
      if (done) done();
    };
    wrap.style.display = "flex";
    vid.onended = finish;
    vid.onerror = finish;
    vid.src = src;
    vid.currentTime = 0;
    var tryPlay = function () {
      var p = vid.play();
      if (p && p.catch) p.catch(function () {
        finish();
      });
    };
    if (vid.readyState >= 2) tryPlay();
    else {
      var onReady = function () {
        vid.removeEventListener("canplay", onReady);
        tryPlay();
      };
      vid.addEventListener("canplay", onReady);
      setTimeout(function () {
        if (!finished && vid.paused) tryPlay();
      }, 800);
    }
    setTimeout(function () {
      if (!finished) finish();
    }, 120000);
  }

  var sexNoiseOn = true;
  var sexNoiseStarted = false;
  function startSexNoise() {
    ensureUI();
    var au = document.getElementById("sexNoiseAudio");
    var btn = document.getElementById("sexNoiseToggle");
    if (!au) return;
    if (!sexNoiseStarted) {
      var src = SEX_NOISE_SRC;
      if (typeof resolveMediaSrc === "function") src = resolveMediaSrc(src);
      au.src = src;
      sexNoiseStarted = true;
    }
    if (btn) btn.style.display = "block";
    if (!sexNoiseOn) return;
    au.volume = 0.55;
    var p = au.play();
    if (p && p.catch) p.catch(function () {});
  }
  function stopSexNoise() {
    var au = document.getElementById("sexNoiseAudio");
    if (au) {
      try {
        au.pause();
        au.currentTime = 0;
      } catch (e) {}
    }
    var btn = document.getElementById("sexNoiseToggle");
    if (btn) btn.style.display = "none";
  }
  function bindSexNoiseToggle() {
    var btn = document.getElementById("sexNoiseToggle");
    var au = document.getElementById("sexNoiseAudio");
    if (!btn || btn._bound) return;
    btn._bound = true;
    btn.onclick = function () {
      sexNoiseOn = !sexNoiseOn;
      btn.textContent = sexNoiseOn ? "性噪声: 开" : "性噪声: 关";
      if (!au) return;
      if (sexNoiseOn) {
        var p = au.play();
        if (p && p.catch) p.catch(function () {});
      } else {
        try {
          au.pause();
        } catch (e) {}
      }
    };
  }

  // 女版可在页面里预设 window.SEX_ATTRS / window.SEX_ATTRS_LABEL（绿帽→雌竞）
  var SEX_ATTRS = window.SEX_ATTRS || ["媚黑", "淫荡", "绿帽", "S属性", "M属性", "阳具崇拜"];
  var SEX_ATTRS_LABEL = window.SEX_ATTRS_LABEL || "媚黑+淫荡+绿帽+S+M+阳具崇拜";
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
    html += '<div style="margin:4px 0">色色属性（' + SEX_ATTRS_LABEL + '）：<b>' + sex + "</b> " + (sex >= 500 ? "✓" : "（需≥500）") + "</div>";
    html += '<div style="margin:4px 0">美德属性（宽容+善良+热心+公正+纯洁）：<b>' + virtue + "</b> " + (virtue >= 100 ? "✓" : "（需≥100）") + "</div>";
    html += '<div style="margin:4px 0">人格属性（自信+自卑+严厉+责任心）：<b>' + person + "</b> " + (person >= 100 ? "✓" : "（需≥100）") + "</div>";
    if (passed) {
      html += '<p style="color:#7dcea0;font-weight:700">恭喜您通过了反媚黑高校教师资格证考试♠，欢迎成为反媚黑事业的高贵战士的一员❤</p>';
      html += "<h2 style='font-size:16px;color:#e8a0d0;margin:12px 0 6px'>领取教师资格证</h2>";
      html += '<p style="font-size:13px;color:#99a">请填写课程与自我介绍。通过后生成<strong>仅绑定本账号</strong>的九位教师编号（如 202600001）。</p>';
      html += '<label>主要负责的课程</label><input id="certCourse" maxlength="40" placeholder="例如：反媚黑洗脑课程" style="width:100%;padding:8px;margin:6px 0;background:#0a0d0f;border:1px solid #3c454a;color:#c8ced1">';
      html += '<label>自我介绍（可选）</label><textarea id="certBio" maxlength="200" placeholder="一句话介绍自己" style="width:100%;min-height:64px;padding:8px;margin:6px 0;background:#0a0d0f;border:1px solid #3c454a;color:#c8ced1"></textarea>';
      html += '<label>教师资格证头像</label><input id="certAvatar" type="file" accept="image/*" style="margin:6px 0;color:#c8ced1">';
      html += '<label><input id="certPublic" type="checkbox"> 愿意将教师资格证展示在学校官网「老师介绍」</label>';
      html += '<div style="margin-top:10px"><button type="button" id="btnIssueCert" style="padding:10px 16px;border:none;border-radius:8px;background:#c45c7a;color:#fff;cursor:pointer">生成教师资格证</button></div>';
      html += '<div id="certMsg" style="margin-top:8px;font-size:13px;color:#99a"></div>';
      html += '<canvas id="certCanvas" width="900" height="560" style="max-width:100%;margin-top:12px;display:none;border:1px solid #3c454a"></canvas>';
      html += '<div id="certActions" style="display:none;margin-top:8px;gap:8px"><button type="button" id="btnDlCert" style="padding:8px 12px;border:1px solid #4c565b;background:#0a0d0f;color:#c8ced1;cursor:pointer">下载资格证</button></div>';
    } else {
      html += '<p style="color:#e74c3c">很遗憾尚未达到通过标准，请再接再厉。</p>';
    }
    html += '<p style="margin-top:16px"><a href="school.html" style="color:#e8a0d0">返回学校官网</a></p>';
    box.innerHTML = html;
    if (passed) bindCertUI();
  }

  function bindCertUI() {
    var btn = document.getElementById("btnIssueCert");
    if (!btn || btn._bound) return;
    btn._bound = true;
    btn.onclick = async function () {
      var msg = document.getElementById("certMsg");
      msg.textContent = "";
      var course = (document.getElementById("certCourse").value || "").trim();
      var bio = (document.getElementById("certBio").value || "").trim();
      var pub = document.getElementById("certPublic").checked;
      if (!course) {
        msg.textContent = "请填写主要负责的课程";
        return;
      }
      var file = document.getElementById("certAvatar").files && document.getElementById("certAvatar").files[0];
      var avatarData = "";
      if (file) {
        try {
          avatarData = await compressImage(file, 400, 0.72);
        } catch (e) {
          msg.textContent = e.message || "头像读取失败";
          return;
        }
      }
      try {
        msg.textContent = "生成中…";
        var info = {};
        try {
          info = JSON.parse(sessionStorage.getItem("teacherExamInfo") || "{}");
        } catch (e) {}
        var data = await api("/teachers/issue", {
          method: "POST",
          body: JSON.stringify({
            course: course,
            bio: bio,
            public_display: pub ? 1 : 0,
            avatar: avatarData,
            name: info.name || "",
            gender: info.gender || "",
            age: info.age || "",
          }),
        });
        msg.textContent = "已生成教师编号：" + (data.cert_no || "") + "（请妥善保管，用于注册教师账号）";
        await drawCert(data, info, avatarData, course);
      } catch (e) {
        msg.textContent = e.message || "生成失败";
      }
    };
  }

  function compressImage(file, maxSide, quality) {
    return new Promise(function (resolve, reject) {
      if (!file || !file.type.startsWith("image/")) return reject(new Error("请选择图片"));
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var w = img.width,
          h = img.height;
        var scale = Math.min(1, maxSide / Math.max(w, h));
        w = Math.round(w * scale);
        h = Math.round(h * scale);
        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("图片读取失败"));
      };
      img.src = url;
    });
  }

  async function drawCert(data, info, avatarData, course) {
    var canvas = document.getElementById("certCanvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var W = canvas.width,
      H = canvas.height;
    var tpl = new Image();
    tpl.crossOrigin = "anonymous";
    await new Promise(function (resolve) {
      tpl.onload = resolve;
      tpl.onerror = resolve;
      tpl.src = "jszgz.png";
    });
    ctx.clearRect(0, 0, W, H);
    if (tpl.complete && tpl.naturalWidth) ctx.drawImage(tpl, 0, 0, W, H);
    else {
      ctx.fillStyle = "#1a1020";
      ctx.fillRect(0, 0, W, H);
    }
    // avatar box approximate
    if (avatarData) {
      var av = new Image();
      await new Promise(function (resolve) {
        av.onload = resolve;
        av.onerror = resolve;
        av.src = avatarData;
      });
      if (av.naturalWidth) ctx.drawImage(av, 118, 168, 168, 210);
    }
    ctx.fillStyle = "#2c1a1f";
    ctx.font = "22px Microsoft YaHei,sans-serif";
    ctx.textAlign = "left";
    var name = (info && info.name) || (me() && me().username) || "";
    ctx.fillText(name, 420, 210);
    ctx.fillText((info && info.gender) || "", 420, 255);
    ctx.fillText(String((info && info.age) || ""), 420, 300);
    ctx.fillText(course || "", 420, 360);
    ctx.font = "20px Microsoft YaHei,sans-serif";
    ctx.fillText(data.cert_no || "", 420, 430);
    ctx.font = "18px Microsoft YaHei,sans-serif";
    ctx.fillText(name, 80, 520);
    ctx.fillText("草莓酱老师审批通过", 620, 520);
    canvas.style.display = "block";
    var actions = document.getElementById("certActions");
    if (actions) actions.style.display = "flex";
    var dl = document.getElementById("btnDlCert");
    if (dl && !dl._bound) {
      dl._bound = true;
      dl.onclick = function () {
        var a = document.createElement("a");
        a.download = "教师资格证_" + (data.cert_no || "cert") + ".png";
        a.href = canvas.toDataURL("image/png");
        a.click();
      };
    }
  }

  function hookTransitions() {
    if (typeof window.doTransition === "function" && !window.doTransition._extrasHooked) {
      var orig = window.doTransition;
      window.doTransition = function (nextIdx) {
        // Q20 special video
        if (typeof qIdx !== "undefined" && qIdx === 19) {
          playQ20Transition(function () {
            if (typeof showQuestion === "function") showQuestion(nextIdx);
            else orig(nextIdx);
          });
          return;
        }
        if (typeof qIdx !== "undefined" && qIdx >= 19) startSexNoise();
        return orig.apply(this, arguments);
      };
      window.doTransition._extrasHooked = true;
    }
    if (typeof window.showQuestion === "function" && !window.showQuestion._extrasHooked) {
      var origShow = window.showQuestion;
      window.showQuestion = function (idx) {
        origShow.apply(this, arguments);
        if (typeof idx !== "undefined" && idx >= 19) startSexNoise();
        if (typeof qIdx !== "undefined" && qIdx >= 15) preloadQ20Video();
      };
      window.showQuestion._extrasHooked = true;
    }
  }

  function hookShowRadar() {
    if (typeof window.showRadar !== "function") return;
    var orig = window.showRadar;
    window.showRadar = function () {
      // 女版（含雌竞）保底：关键色色属性不足 100 则补到 100，避免无法通过
      try {
        if (typeof totalScore === "object" && totalScore && SEX_ATTRS.indexOf("雌竞") >= 0) {
          ["媚黑", "淫荡", "雌竞", "阳具崇拜"].forEach(function (k) {
            if ((totalScore[k] || 0) < 100) totalScore[k] = 100;
          });
        }
      } catch (e) {}
      orig.apply(this, arguments);
      stopSexNoise();
      buildResultExtra();
    };
  }

  async function checkLoginGate() {
    var gate = document.getElementById("loginGate");
    if (!gate) return;
    if (!token() || !me()) {
      gate.style.display = "flex";
      return;
    }
    gate.style.display = "none";
  }

  function boot() {
    ensureUI();
    bindSexNoiseToggle();
    hookTransitions();
    hookShowRadar();
    checkLoginGate();
    // re-hook if showRadar defined later
    setTimeout(hookShowRadar, 500);
    setTimeout(hookShowRadar, 2000);
    preloadQ20Video();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
