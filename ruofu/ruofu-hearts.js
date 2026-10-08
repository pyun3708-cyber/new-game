(function () {
  // 注入紫色渐变背景 CSS
  if (!document.getElementById("ruofu-purple-theme")) {
    var style = document.createElement("style");
    style.id = "ruofu-purple-theme";
    style.textContent =
      "html,body{margin:0!important;min-height:100%!important;" +
      "background:linear-gradient(180deg,#f3e8ff 0%,#e0c4f7 25%,#b48de0 55%,#6b3fa0 80%,#2d1450 100%)!important;" +
      "background-attachment:fixed!important;background-color:#2d1450!important}" +
      "tw-story,tw-passage,tw-sidebar{background:transparent!important}" +
      "tw-story{position:relative;z-index:2}" +
      "#ruofu-hearts{position:fixed;inset:0;pointer-events:none;z-index:1;overflow:hidden}" +
      ".ruofu-heart{position:absolute;bottom:-5vh;text-shadow:0 0 8px rgba(255,150,200,.25);" +
      "animation-name:ruofu-float;animation-timing-function:linear;animation-iteration-count:1;" +
      "user-select:none;line-height:1}" +
      "@keyframes ruofu-float{" +
      "0%{transform:translateY(0) translateX(0) scale(.7) rotate(0);opacity:0}" +
      "8%{opacity:.55}" +
      "50%{transform:translateY(-50vh) translateX(12px) scale(1) rotate(12deg);opacity:.4}" +
      "100%{transform:translateY(-110vh) translateX(-8px) scale(1.15) rotate(-8deg);opacity:0}}";
    (document.head || document.documentElement).appendChild(style);
  }

  function spawnHeart(layer) {
    var h = document.createElement("span");
    h.className = "ruofu-heart";
    h.textContent = Math.random() > 0.3 ? "\u2764" : "\u2665";
    h.style.left = Math.random() * 100 + "vw";
    var dur = 10 + Math.random() * 12;
    h.style.animationDuration = dur + "s";
    h.style.fontSize = 12 + Math.random() * 20 + "px";
    h.style.color =
      "rgba(255," +
      (160 + Math.floor(Math.random() * 60)) +
      "," +
      (200 + Math.floor(Math.random() * 40)) +
      "," +
      (0.25 + Math.random() * 0.35) +
      ")";
    layer.appendChild(h);
    setTimeout(function () {
      if (h.parentNode) h.parentNode.removeChild(h);
    }, (dur + 1) * 1000);
  }

  function init() {
    if (document.getElementById("ruofu-hearts")) return;
    var layer = document.createElement("div");
    layer.id = "ruofu-hearts";
    document.body.appendChild(layer);
    for (var i = 0; i < 10; i++) {
      (function (n) {
        setTimeout(function () {
          spawnHeart(layer);
        }, n * 350);
      })(i);
    }
    setInterval(function () {
      spawnHeart(layer);
    }, 700);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
