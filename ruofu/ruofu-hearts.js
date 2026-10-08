(function () {
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
