(function () {
  "use strict";
  var API_BASE = "https://school-auth.pyun3708.workers.dev";
  var Q20_VIDEO_SRC = (typeof window !== "undefined" && window.Q20_VIDEO_SRC) ? window.Q20_VIDEO_SRC : "media/q20-trans.mp4";
  var SEX_NOISE_SRC = "media/sex-noise.mp3";

  function ensureUI() {
    if (!document.getElementById("loginGate")) {
      var gate = document.createElement("div");
      gate.id = "loginGate";
      gate.style.cssText = "position:fixed;inset:0;z-index:10000;background:#000;display:none;align-items:center;justify-content:center;flex-direction:column;color:#c8ced1;font-family:Microsoft YaHei,monospace;padding:20px;text-align:center";
      gate.innerHTML = '<div style="max-width:420px"><div style="letter-spacing:3px;margin-bottom:12px">需要登录</div><p style="font-size:14px;color:#889;line-height:1.6">请先在学校官网登录<strong>学生账号</strong>后再参加教师资格证考试。</p><a href="login.html" style="display:inline-block;margin-top:16px;padding:10px 18px;border:1px solid #4c565b;color:#c8ced1;text-decoration:none">前往登录</a><div style="margin-top:10px"><a href="school.html" style="color:#889;font-size:13px">返回学校官网</a></div></div>';
      document.body.appendChild(gate);
    }
    var resultPanel = document.querySelector("#resultScreen .panel");
    if (resultPanel && !document.getElementById("resultExtra")) {
      var extra = document.createElement("div");
      extra.id = "resultExtra";
      extra.style.cssText = "max-width:100%;margin:16px auto 0;color:#c8ced1;font:14px/1.7 Microsoft YaHei,sans-serif;text-align:left";
      resultPanel.appendChild(extra);
    }
  }

  var SEX_ATTRS = window.SEX_ATTRS || ["媚黑", "淫荡", "绿帽", "S属性", "M属性", "阳具崇拜"];
  var SEX_ATTRS_LABEL = window.SEX_ATTRS_LABEL || "媚黑+淫荡+绿帽+S+M+阳具崇拜";
  var VIRTUE_ATTRS = ["宽容", "善良", "热心", "公正", "纯洁"];
  var PERSON_ATTRS = ["自信", "自卑", "严厉", "责任心"];

  function sumAttrs(list) {
    return list.reduce(function (s, k) { return s + ((typeof totalScore !== "undefined" && totalScore[k]) || 0); }, 0);
  }

  function buildResultExtra() {
    ensureUI();
    var box = document.getElementById("resultExtra");
    if (!box) {
      var rs = document.getElementById("resultScreen");
      if (rs) {
        box = document.createElement("div");
        box.id = "resultExtra";
        box.style.cssText = "max-width:100%;margin:16px auto;color:#c8ced1;font:14px/1.7 Microsoft YaHei,sans-serif;text-align:left;padding:0 12px 24px";
        var panel = rs.querySelector(".panel");
        if (panel) panel.appendChild(box); else rs.appendChild(box);
      } else return;
    }
    SEX_ATTRS = window.SEX_ATTRS || SEX_ATTRS;
    SEX_ATTRS_LABEL = window.SEX_ATTRS_LABEL || SEX_ATTRS_LABEL;
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
      html += '<p style="font-size:13px;color:#99a">请填写课程。通过后生成<strong>仅绑定本账号</strong>的教师编号（如 202600001）。</p>';
      html += '<label>主要负责的课程</label><input id="certCourse" maxlength="40" placeholder="例如：反差婊洗脑课程" style="width:100%;box-sizing:border-box;margin:6px 0;padding:8px;background:#0b0f11;border:1px solid #3c454a;color:#d8dde0">';
      html += '<label>自我介绍</label><textarea id="certBio" maxlength="120" placeholder="写在证书上" style="width:100%;box-sizing:border-box;margin:6px 0;padding:8px;min-height:64px;background:#0b0f11;border:1px solid #3c454a;color:#d8dde0;font:inherit"></textarea>';
      html += '<label>上传教师资格证头像</label><input id="certPhoto" type="file" accept="image/*" style="width:100%;margin:6px 0;color:#d8dde0">';
      html += '<label style="display:flex;align-items:center;gap:8px;margin-top:8px"><input type="checkbox" id="certPublic"> 愿意展示在学校官网「老师介绍」</label>';
      html += '<div><button type="button" id="btnIssueCert" style="margin:8px 6px 8px 0;padding:10px 14px;border:1px solid #4c565b;background:#c45c7a;color:#fff;cursor:pointer">生成教师资格证</button></div>';
      html += '<canvas id="certCanvas" width="784" height="1168" style="display:none"></canvas>';
      html += '<img id="certPreview" alt="预览" style="display:none;max-width:100%;margin-top:12px;border:1px solid #3c454a">';
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
        img.onerror = function () { reject(new Error("图片读取失败")); };
        img.src = reader.result;
      };
      reader.onerror = function () { reject(new Error("文件读取失败")); };
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
    try {
      if (fileInput && fileInput.files && fileInput.files[0]) {
        photoData = await compressImageFile(fileInput.files[0], 320, 0.72);
      }
    } catch (e) {
      if (msg) msg.textContent = "头像处理失败：" + (e.message || e);
      return;
    }
    var profile = { name: "考生", gender: "", age: "" };
    try {
      var saved = JSON.parse(sessionStorage.getItem("teacherExamInfo") || "null");
      if (saved) {
        if (saved.name) profile.name = saved.name;
        if (saved.gender) profile.gender = saved.gender;
        if (saved.age) profile.age = String(saved.age);
      }
    } catch (e0) {}
    try {
      var me = await fetch(API_BASE + "/auth/me", { headers: { Authorization: "Bearer " + token } }).then(function (r) { return r.json(); });
      if (me && me.user) {
        if (!profile.name || profile.name === "考生") profile.name = me.user.display_name || me.user.username || profile.name;
        if (!profile.gender) profile.gender = me.user.gender || "";
      }
    } catch (e1) {}
    var teacherId = "";
    try {
      var res = await fetch(API_BASE + "/teacher/cert/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          course: course.trim(),
          public_display: pub,
          scores: typeof totalScore !== "undefined" ? totalScore : {},
          name: profile.name,
          gender: profile.gender,
          bio: bio.trim()
        })
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || "发证失败");
      teacherId = data.teacher_id || data.cert_no;
      if (!teacherId) throw new Error("服务器未返回教师编号");
    } catch (e) {
      if (msg) msg.textContent = "发证失败：" + (e.message || e) + "。请确认已登录后重试。";
      return;
    }
    if (msg) msg.textContent = "编号 " + teacherId + " 已下发，正在生成证书图…";
    try {
      var dataUrl = await drawTeacherCert({
        name: profile.name,
        gender: profile.gender || "—",
        age: profile.age || "—",
        course: course.trim(),
        teacherId: teacherId,
        photoData: photoData,
        bio: bio.trim()
      });
      if (dataUrl) {
        var preview = document.getElementById("certPreview");
        if (preview) { preview.src = dataUrl; preview.style.display = "block"; }
        // upload cert image for public display
        try {
          await fetch(API_BASE + "/teacher/cert/issue", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
            body: JSON.stringify({
              course: course.trim(),
              public_display: pub,
              cert_image: dataUrl,
              name: profile.name,
              gender: profile.gender
            })
          });
        } catch (e3) {}
        if (msg) msg.textContent = "教师编号 " + teacherId + " 已生成，长按/保存下方证书图即可。";
      } else {
        if (msg) msg.textContent = "编号 " + teacherId + " 已下发，但证书图生成失败（请确认 media/jszgz.png 存在）。";
      }
    } catch (e2) {
      if (msg) msg.textContent = "编号 " + teacherId + " 已下发，证书绘制出错：" + (e2.message || e2);
    }
  }

  function drawTeacherCert(info) {
    return new Promise(function (resolve) {
      var canvas = document.getElementById("certCanvas");
      var preview = document.getElementById("certPreview");
      if (!canvas) { resolve(""); return; }
      var ctx = canvas.getContext("2d");
      var bg = new Image();
      bg.crossOrigin = "anonymous";
      bg.onload = function () {
        canvas.width = bg.width;
        canvas.height = bg.height;
        ctx.drawImage(bg, 0, 0);
        function fillText() {
          ctx.fillStyle = "#2c1a1f";
          ctx.textAlign = "left";
          ctx.font = "bold 28px Microsoft YaHei,sans-serif";
          ctx.fillText(info.name || "", 320, 280);
          ctx.font = "22px Microsoft YaHei,sans-serif";
          ctx.fillText(info.gender || "", 320, 340);
          ctx.fillText(info.age || "", 320, 400);
          ctx.fillText(info.course || "", 320, 480);
          ctx.fillText(info.teacherId || "", 320, 560);
          if (info.bio) {
            ctx.font = "18px Microsoft YaHei,sans-serif";
            ctx.fillText(String(info.bio).slice(0, 40), 80, canvas.height - 120);
          }
          ctx.font = "18px Microsoft YaHei,sans-serif";
          ctx.fillText(info.name || "", 80, canvas.height - 60);
          ctx.fillText("草莓酱老师审批通过", canvas.width - 280, canvas.height - 60);
        }
        function finish() {
          var url = canvas.toDataURL("image/png");
          if (preview) { preview.src = url; preview.style.display = "block"; }
          canvas.style.display = "none";
          resolve(url);
        }
        if (info.photoData) {
          var p = new Image();
          p.onload = function () {
            var ax = 90, ay = 240, aw = 160, ah = 200;
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
        } else {
          fillText();
          finish();
        }
      };
      bg.onerror = function () {
        // fallback blank cert
        canvas.width = 784;
        canvas.height = 1168;
        ctx.fillStyle = "#fffef8";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#8b2040";
        ctx.font = "bold 32px Microsoft YaHei,sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("教师资格证", canvas.width / 2, 80);
        ctx.textAlign = "left";
        ctx.fillStyle = "#2c1a1f";
        ctx.font = "22px Microsoft YaHei,sans-serif";
        ctx.fillText("姓名：" + (info.name || ""), 60, 200);
        ctx.fillText("性别：" + (info.gender || ""), 60, 250);
        ctx.fillText("年龄：" + (info.age || ""), 60, 300);
        ctx.fillText("课程：" + (info.course || ""), 60, 350);
        ctx.fillText("编号：" + (info.teacherId || ""), 60, 400);
        ctx.fillText("草莓酱老师审批通过", 60, 500);
        var url = canvas.toDataURL("image/png");
        if (preview) { preview.src = url; preview.style.display = "block"; }
        resolve(url);
      };
      bg.src = "media/jszgz.png";
    });
  }

  function stopSexNoise() {
    var au = document.getElementById("sexNoiseAudio");
    if (au) try { au.pause(); } catch (e) {}
  }

  function installShowRadar() {
    if (typeof window.showRadar !== "function") return;
    if (window.showRadar._extrasCore) return;
    var orig = window.showRadar;
    window.showRadar = function () {
      try {
        if (typeof totalScore === "object" && totalScore && (window.SEX_ATTRS || []).indexOf("雌竞") >= 0) {
          ["媚黑", "淫荡", "雌竞", "阳具崇拜"].forEach(function (k) {
            if ((totalScore[k] || 0) < 100) totalScore[k] = 100;
          });
        }
      } catch (e0) {}
      try {
        document.documentElement.style.overflow = "auto";
        document.body.style.overflow = "auto";
        document.body.style.height = "auto";
      } catch (e1) {}
      orig.apply(this, arguments);
      stopSexNoise();
      buildResultExtra();
      try {
        var box = document.getElementById("resultExtra");
        if (box) setTimeout(function () { box.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 200);
      } catch (e2) {}
    };
    window.showRadar._extrasCore = true;
  }

  function boot() {
    ensureUI();
    installShowRadar();
    setTimeout(installShowRadar, 500);
    setTimeout(installShowRadar, 2000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  window.addEventListener("load", function () { installShowRadar(); });
})();
