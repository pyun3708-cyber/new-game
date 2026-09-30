(function () {
  "use strict";
  var API_BASE = "https://school-auth.pyun3708.workers.dev";
  var Q20_VIDEO_SRC = "media/q20-trans.mp4";
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
      pv.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px";
      document.body.appendChild(pv);
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

  function preloadQ20Video() {
    var pv = document.getElementById("q20PreloadVideo");
    if (pv && !pv.src) {
      pv.src = Q20_VIDEO_SRC;
      try { pv.load(); } catch (e) {}
    }
    if (q20BlobUrl || q20Ready) return;
    fetch(Q20_VIDEO_SRC)
      .then(function (r) {
        if (!r.ok) throw new Error("video http " + r.status);
        return r.blob();
      })
      .then(function (blob) {
        q20BlobUrl = URL.createObjectURL(blob);
        q20Ready = true;
        if (pv) {
          pv.src = q20BlobUrl;
          try { pv.load(); } catch (e) {}
        }
        var main = document.getElementById("transVideo");
        if (main) {
          main.src = q20BlobUrl;
          main.preload = "auto";
          try { main.load(); } catch (e) {}
        }
        console.log("[exam] Q20 video preloaded", Math.round(blob.size / 1024) + "KB");
      })
      .catch(function (err) {
        console.warn("[exam] Q20 video preload failed", err);
        var main = document.getElementById("transVideo");
        if (main) {
          main.src = Q20_VIDEO_SRC;
          main.preload = "auto";
          try { main.load(); } catch (e) {}
        }
      });
  }

  function preloadSexNoise() {
    try {
      var a = new Audio();
      a.preload = "auto";
      a.src = SEX_NOISE_SRC;
      a.load();
    } catch (e) {}
  }

  var sexNoiseAudio = null;
  var sexNoiseOn = true;
  window.startSexNoise = function startSexNoise() {
    var btn = document.getElementById("sexNoiseBtn");
    if (btn) btn.style.display = "block";
    if (!sexNoiseAudio) {
      sexNoiseAudio = new Audio(SEX_NOISE_SRC);
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

  window.playQ20VideoTransition = function playQ20VideoTransition(done) {
    var wrap = document.getElementById("transVideoWrap");
    var vid = document.getElementById("transVideo");
    var finished = false;
    function finish(useImageFallback) {
      if (finished) return;
      finished = true;
      if (wrap) wrap.style.display = "none";
      var tr = document.getElementById("blackTransition");
      if (tr) tr.style.display = "none";
      if (vid) {
        try {
          vid.onended = null;
          vid.onerror = null;
          vid.pause();
          vid.currentTime = 0;
        } catch (e) {}
      }
      if (useImageFallback && typeof doTransition === "function") doTransition(done);
      else if (typeof done === "function") done();
    }
    if (!wrap || !vid) { finish(true); return; }
    var src = q20BlobUrl || Q20_VIDEO_SRC;
    wrap.style.zIndex = "9999";
    wrap.style.display = "flex";
    var tr = document.getElementById("blackTransition");
    if (tr) tr.style.display = "none";
    vid.setAttribute("playsinline", "");
    vid.setAttribute("webkit-playsinline", "");
    vid.playsInline = true;
    vid.muted = true;
    vid.src = src;
    try { vid.load(); } catch (e) {}
    try { vid.currentTime = 0; } catch (e) {}
    vid.onended = function () { console.log("[exam] Q20 video ended"); finish(false); };
    vid.onerror = function () { finish(true); };
    function tryPlay() {
      var p = vid.play();
      if (p && p.then) {
        p.then(function () { try { vid.muted = false; } catch (e) {}; }).catch(function () {
          vid.muted = true;
          var p2 = vid.play();
          if (p2 && p2.catch) p2.catch(function () { finish(true); });
        });
      }
    }
    if (vid.readyState >= 2) tryPlay();
    else {
      var onReady = function () { vid.removeEventListener("canplay", onReady); tryPlay(); };
      vid.addEventListener("canplay", onReady);
      setTimeout(function () { if (!finished && vid.paused) tryPlay(); }, 800);
    }
    setTimeout(function () { if (!finished) finish(false); }, 10000);
  };

  function installNextQuiz() {
    if (typeof window.nextQuiz !== "function") return;
    window.nextQuiz = function nextQuiz() {
      var selected = [...document.querySelectorAll("#qOptions .option.selected")].map(function (x) { return x.textContent; });
      answers[qIdx] = selected;
      addScores(quiz[qIdx], selected);
      var finishedQ20 = qIdx === 19;
      var goNext = function () {
        if (qIdx < quiz.length - 1) { qIdx++; renderQuiz(); }
        else {
          document.getElementById("quizScreen").classList.add("hidden");
          if (typeof applyPinkPhase === "function") applyPinkPhase();
          document.getElementById("interviewScreen").style.display = "flex";
          dialogueStep = 0;
          showDialogue();
        }
      };
      if (finishedQ20) { startSexNoise(); playQ20VideoTransition(goNext); }
      else doTransition(goNext);
    };
  }

  function installRenderQuiz() {
    if (typeof window.renderQuiz !== "function") return;
    var orig = window.renderQuiz;
    window.renderQuiz = function () {
      orig.apply(this, arguments);
      if (typeof qIdx !== "undefined" && qIdx >= 19) startSexNoise();
      if (typeof qIdx !== "undefined" && qIdx >= 15) preloadQ20Video();
    };
  }

  var SEX_ATTRS = ["媚黑", "淫荡", "绿帽", "S属性", "M属性", "阳具崇拜"];
  var VIRTUE_ATTRS = ["宽容", "善良", "热心", "公正", "纯洁"];
  var PERSON_ATTRS = ["自信", "自卑", "严厉", "责任心"];
  function sumAttrs(list) {
    return list.reduce(function (s, k) { return s + (totalScore[k] || 0); }, 0);
  }

  function buildResultExtra() {
    var box = document.getElementById("resultExtra");
    if (!box) return;
    var sex = sumAttrs(SEX_ATTRS);
    var virtue = sumAttrs(VIRTUE_ATTRS);
    var person = sumAttrs(PERSON_ATTRS);
    var passed = sex >= 500 && virtue >= 100 && person >= 100;
    var html = "<h2 style='font-size:16px;letter-spacing:.08em;margin:12px 0 6px;color:#e8a0d0'>属性汇总</h2>";
    html += '<div style="margin:4px 0">色色属性（媚黑+淫荡+绿帽+S+M+阳具崇拜）：<b>' + sex + "</b> " + (sex >= 500 ? "✓" : "（需≥500）") + "</div>";
    html += '<div style="margin:4px 0">美德属性（宽容+善良+热心+公正+纯洁）：<b>' + virtue + "</b> " + (virtue >= 100 ? "✓" : "（需≥100）") + "</div>";
    html += '<div style="margin:4px 0">人格属性（自信+自卑+严厉+责任心）：<b>' + person + "</b> " + (person >= 100 ? "✓" : "（需≥100）") + "</div>";
    if (passed) {
      html += '<p style="color:#7dcea0;font-weight:700">恭喜您通过了反媚黑高校教师资格证考试♠，欢迎成为反媚黑事业的高贵战士的一员❤</p>';
      html += "<h2 style='font-size:16px;color:#e8a0d0;margin:12px 0 6px'>领取教师资格证</h2>";
      html += '<p style="font-size:13px;color:#99a">请填写课程与自我介绍。通过后生成<strong>仅绑定本账号</strong>的九位教师编号（如 202600001）。</p>';
      html += '<label>主要负责的课程</label><input id="certCourse" maxlength="40" placeholder="例如：反差婊洗脑课程" style="width:100%;box-sizing:border-box;margin:6px 0;padding:8px;background:#0b0f11;border:1px solid #3c454a;color:#d8dde0">';
      html += '<label>自我介绍</label><textarea id="certBio" maxlength="120" placeholder="写在证书「自我介绍」栏" style="width:100%;box-sizing:border-box;margin:6px 0;padding:8px;min-height:64px;background:#0b0f11;border:1px solid #3c454a;color:#d8dde0;font:inherit"></textarea>';
      html += '<label>上传教师资格证头像</label><input id="certPhoto" type="file" accept="image/*" style="width:100%;margin:6px 0;color:#d8dde0">';
      html += '<label style="display:flex;align-items:center;gap:8px;margin-top:8px"><input type="checkbox" id="certPublic"> 愿意将教师资格证展示在学校官网「老师介绍」</label>';
      html += '<div><button type="button" id="btnIssueCert" style="margin:8px 6px 8px 0;padding:10px 14px;border:1px solid #4c565b;background:#0a0d0f;color:#c8ced1;cursor:pointer">生成教师资格证</button></div>';
      html += '<canvas id="certCanvas" width="784" height="1168" style="display:none"></canvas>';
      html += '<img id="certPreview" alt="教师资格证预览" style="display:none;max-width:100%;margin-top:12px;border:1px solid #3c454a">';
      html += '<div id="certMsg" style="margin-top:8px;font-size:13px;color:#e8a0d0"></div>';
    } else {
      html += '<p style="color:#e74c3c;font-weight:700">很遗憾，你未能通过本次教师资格证考试。请再接再厉。</p>';
    }
    html += '<div style="margin-top:18px"><a href="school.html" style="display:inline-block;padding:10px 16px;border:1px solid #4c565b;color:#c8ced1;text-decoration:none">返回学校官网</a></div>';
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
    var bio = (document.getElementById("certBio") || {}).value || "";
    var fileInput = document.getElementById("certPhoto");
    var pub = !!(document.getElementById("certPublic") || {}).checked;
    var msg = document.getElementById("certMsg");
    if (!course.trim()) { if (msg) msg.textContent = "请填写主要负责的课程"; return; }
    var token = localStorage.getItem("school_token") || sessionStorage.getItem("school_token") || "";
    if (!token) { if (msg) msg.textContent = "请先登录学生账号后再领取教师编号"; return; }
    if (msg) msg.textContent = "正在向校方申请教师编号…";
    var photoData = "";
    if (fileInput && fileInput.files && fileInput.files[0]) {
      photoData = await compressImageFile(fileInput.files[0], 320, 0.72);
    }
    var profile = { name: typeof candidateName !== "undefined" && candidateName ? candidateName : "考生", gender: "", age: "" };
    try {
      var saved = JSON.parse(sessionStorage.getItem("teacherExamInfo") || "null");
      if (saved) {
        if (saved.name) profile.name = saved.name;
        if (saved.gender) profile.gender = saved.gender;
        if (saved.age) profile.age = String(saved.age);
      }
    } catch (e0) {}
    var teacherId = "";
    try {
      var me = await fetch(API_BASE + "/auth/me", { headers: { Authorization: "Bearer " + token } }).then(function (r) { return r.json(); });
      if (me && me.user) {
        if (!profile.name || profile.name === "考生")
          profile.name = me.user.display_name || me.user.username || profile.name;
        if (!profile.gender) profile.gender = me.user.gender || "";
      }
      var res = await fetch(API_BASE + "/teacher/cert/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ course: course.trim(), public_display: pub, scores: typeof totalScore !== "undefined" ? totalScore : {}, name: profile.name, gender: profile.gender, bio: bio.trim() }),
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || "发证失败");
      teacherId = data.teacher_id;
      if (!teacherId) throw new Error("服务器未返回教师编号");
    } catch (e) {
      if (msg) msg.textContent = "发证失败：" + (e.message || e) + "。请确认已登录且 Worker 已部署后重试（不会使用随机编号）。";
      return;
    }
    if (msg) msg.textContent = "编号 " + teacherId + " 已下发，正在生成证书图…";
    var dataUrl = await drawTeacherCert({ name: profile.name, gender: profile.gender || "—", age: profile.age || "—", course: course.trim(), teacherId: teacherId, photoData: photoData, bio: bio.trim() });
    if (dataUrl) {
      try {
        await fetch(API_BASE + "/teacher/cert/issue", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
          body: JSON.stringify({ course: course.trim(), public_display: pub, cert_image: dataUrl, name: profile.name, gender: profile.gender }),
        });
      } catch (e2) {}
    }
    if (msg) msg.textContent = "教师编号 " + teacherId + " 已绑定本账号，请长按/右键保存证书图。此编号是注册教师账号的唯一凭证。";
  }

  function drawTeacherCert(info) {
    return new Promise(function (resolve) {
      var canvas = document.getElementById("certCanvas");
      var preview = document.getElementById("certPreview");
      if (!canvas) { resolve(""); return; }
      var ctx = canvas.getContext("2d");
      var bg = new Image();
      bg.onload = function () {
        var w = bg.width, h = bg.height;
        canvas.width = w; canvas.height = h;
        ctx.drawImage(bg, 0, 0);
        var ax = w * 0.072, ay = h * 0.205, aw = w * 0.315, ah = h * 0.385;
        function fillText() {
          ctx.fillStyle = "#1a1020";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          var fontMain = "bold " + Math.round(h * 0.025) + "px Microsoft YaHei,sans-serif";
          var fontSmall = Math.round(h * 0.021) + "px Microsoft YaHei,sans-serif";
          ctx.font = fontMain;
          ctx.fillText(String(info.name || "").slice(0, 12), w * 0.545, h * 0.238);
          ctx.fillText(String(info.gender || "—").slice(0, 8), w * 0.545, h * 0.288);
          ctx.fillText(String(info.age || "—").slice(0, 12), w * 0.545, h * 0.338);
          ctx.font = fontSmall;
          var course = String(info.course || "");
          var maxW = w * 0.44;
          var cx = w * 0.42;
          var cy = h * 0.455;
          if (ctx.measureText(course).width <= maxW) ctx.fillText(course, cx, cy);
          else {
            var line1 = course;
            while (ctx.measureText(line1).width > maxW && line1.length > 1) line1 = line1.slice(0, -1);
            ctx.fillText(line1, cx, cy);
            ctx.fillText(course.slice(line1.length).slice(0, 24), cx, cy + h * 0.03);
          }
          ctx.font = "bold " + Math.round(h * 0.03) + "px Microsoft YaHei,sans-serif";
          ctx.fillStyle = "#8b2252";
          ctx.fillText(String(info.teacherId || ""), w * 0.42, h * 0.60);
          ctx.fillStyle = "#1a1020";
          ctx.font = fontSmall;
          var bio = String(info.bio || "");
          var bioX = w * 0.12, bioY = h * 0.78, bioMax = w * 0.76;
          if (bio) {
            var chars = bio.split(""), line = "", lines = [];
            for (var i = 0; i < chars.length; i++) {
              var test = line + chars[i];
              if (ctx.measureText(test).width > bioMax) { lines.push(line); line = chars[i]; if (lines.length >= 3) break; }
              else line = test;
            }
            if (line && lines.length < 3) lines.push(line);
            lines.forEach(function (ln, idx) { ctx.fillText(ln, bioX, bioY + idx * (h * 0.032)); });
          }
          ctx.font = Math.round(h * 0.024) + "px 'Segoe Script','Brush Script MT',cursive,Microsoft YaHei";
          ctx.fillStyle = "#2a1520";
          ctx.fillText(String(info.name || ""), w * 0.12, h * 0.72);
          ctx.font = Math.round(h * 0.02) + "px Microsoft YaHei,sans-serif";
          ctx.fillStyle = "#8b2252";
          ctx.textAlign = "right";
          ctx.fillText("草莓酱老师审批通过", w * 0.92, h * 0.88);
          ctx.textAlign = "left";
        }
        function finish() {
          var url = canvas.toDataURL("image/png");
          canvas.style.display = "none";
          if (preview) { preview.src = url; preview.style.display = "block"; }
          resolve(url);
        }
        if (info.photoData) {
          var p = new Image();
          p.onload = function () {
            ctx.save();
            ctx.beginPath();
            ctx.rect(ax, ay, aw, ah);
            ctx.clip();
            var sc = Math.max(aw / p.width, ah / p.height);
            var pw = p.width * sc, ph = p.height * sc;
            ctx.drawImage(p, ax + (aw - pw) / 2, ay + (ah - ph) / 2, pw, ph);
            ctx.restore();
            fillText();
            finish();
          };
          p.onerror = function () { fillText(); finish(); };
          p.src = info.photoData;
        } else { fillText(); finish(); }
      };
      bg.onerror = function () {
        if (preview) { preview.alt = "模板加载失败，请确认 media/jszgz.png 已上传"; preview.style.display = "block"; }
        resolve("");
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
    if (!token) { if (gate) gate.style.display = "flex"; return; }
    try {
      var res = await fetch(API_BASE + "/auth/me", { headers: { Authorization: "Bearer " + token } });
      if (!res.ok) { if (gate) gate.style.display = "flex"; return; }
      var data = await res.json();
      if (!data || !data.user) { if (gate) gate.style.display = "flex"; return; }
      if (gate) gate.style.display = "none";
      if (data.user.display_name || data.user.username) {
        try { candidateName = data.user.display_name || data.user.username; } catch (e) {}
      }
    } catch (e) { if (gate) gate.style.display = "flex"; }
  }

  function boot() {
    ensureUI();
    installNextQuiz();
    installRenderQuiz();
    installShowRadar();
    checkLoginGate();
    preloadQ20Video();
    preloadSexNoise();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  window.addEventListener("load", function () {
    ensureUI();
    installNextQuiz();
    installRenderQuiz();
    installShowRadar();
    preloadQ20Video();
    preloadSexNoise();
  });
})();
