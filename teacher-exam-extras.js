(function(){
  // 粉色浮现字：抬高层级 + 提亮颜色（男女卷通用）
  if (!document.getElementById("float-word-fix")) {
    var st = document.createElement("style");
    st.id = "float-word-fix";
    st.textContent =
      "#floatWords{position:fixed!important;inset:0!important;pointer-events:none!important;" +
      "z-index:180!important;overflow:hidden!important}" +
      ".float-word{color:rgba(255,105,180,.92)!important;" +
      "text-shadow:0 0 16px rgba(255,80,160,.65),0 0 4px rgba(255,120,180,.8)!important}" +
      ".video-float-word{color:rgba(255,105,180,.95)!important;" +
      "text-shadow:0 0 14px rgba(255,80,160,.7)!important;z-index:190!important}" +
      "body.pink-phase .float-word{color:rgba(180,30,90,.85)!important;" +
      "text-shadow:0 0 12px rgba(255,80,140,.45)!important}";
    (document.head || document.documentElement).appendChild(st);
  }

  // 若 floatWords 容器不存在则补一个
  function ensureBox() {
    if (!document.getElementById("floatWords")) {
      var box = document.createElement("div");
      box.id = "floatWords";
      document.body.appendChild(box);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureBox);
  } else {
    ensureBox();
  }

  var s = document.createElement("script");
  s.src = "teacher-exam-extras-core.js?v=20261014float1";
  s.async = false;
  document.head.appendChild(s);
})();
