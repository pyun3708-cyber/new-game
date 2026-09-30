(function(){
  window.TRANS_IMAGES = window.TRANS_IMAGES || [
    "transitions/trans_01.jpg",
    "transitions/trans_02.jpg",
    "transitions/trans_03.jpg",
    "transitions/trans_04.jpg",
    "transitions/trans_05.jpg",
    "transitions/trans_06.jpg",
    "transitions/trans_07.jpg",
    "transitions/trans_08.jpg",
    "transitions/trans_09.jpg",
    "transitions/trans_10.jpg",
    "transitions/trans_11.jpg",
    "transitions/trans_12.jpg",
    "transitions/trans_13.jpg",
    "transitions/trans_14.jpg",
    "transitions/trans_15.jpg",
    "transitions/trans_16.jpg",
    "transitions/trans_17.jpg",
    "transitions/trans_18.jpg",
    "transitions/trans_19.jpg",
    // 第20题用视频，无 trans_20.jpg
    "transitions/trans_21.jpg",
    "transitions/trans_22.jpg",
    "transitions/trans_23.jpg",
    "transitions/trans_24.jpg",
    "transitions/trans_25.jpg",
    "transitions/trans_26.jpg",
    "transitions/trans_27.jpg",
    "transitions/trans_28.jpg",
    "transitions/trans_29.png",
    "transitions/trans_30.png",
    "transitions/trans_31.jpg",
    "transitions/trans_32.jpg",
    "transitions/trans_33.jpg",
    "transitions/trans_34.jpg",
    "transitions/trans_35.jpg",
    "transitions/trans_36.png",
    "transitions/trans_37.png",
    "transitions/trans_38.png",
    "transitions/trans_39.png",
    "transitions/trans_40.jpg",
    "transitions/trans_41.jpg",
    "transitions/trans_42.jpg",
    "transitions/trans_43.jpg",
    "transitions/trans_44.jpg",
    "transitions/trans_45.jpg",
    "transitions/trans_46.jpg",
    "transitions/trans_47.jpg",
    "transitions/trans_48.jpg",
    "transitions/trans_49.jpg",
    "transitions/trans_50.jpg",
    "transitions/trans_51.jpg"
  ];
  window.transIdx = window.transIdx || 0;

  var _cache = Object.create(null);

  function preloadOne(src) {
    if (!src || _cache[src]) return _cache[src];
    var im = new Image();
    im.decoding = "async";
    im.src = src;
    _cache[src] = im;
    return im;
  }

  function preloadAll() {
    var list = window.TRANS_IMAGES || [];
    // 优先前 15 张（开场几题马上用到）
    for (var i = 0; i < list.length; i++) preloadOne(list[i]);
  }

  // 尽早开始：脚本执行时 + DOM + load 各一次
  preloadAll();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", preloadAll);
  }
  window.addEventListener("load", preloadAll);

  window.doTransition = function(done) {
    var tr = document.getElementById("blackTransition");
    var slot = document.getElementById("animSlot");
    var img = document.getElementById("transImg");
    if (!tr) {
      if (typeof done === "function") done();
      return;
    }
    if (!img) {
      img = document.createElement("img");
      img.id = "transImg";
      img.alt = "";
      img.style.cssText =
        "position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000;opacity:0;pointer-events:none;transition:opacity .12s ease";
      tr.style.overflow = "hidden";
      tr.insertBefore(img, tr.firstChild);
    }
    tr.style.display = "flex";
    if (slot) slot.style.opacity = "0";
    img.style.opacity = "0";

    var list = window.TRANS_IMAGES || [];
    var srcPath = list.length ? list[window.transIdx % list.length] : "";
    if (srcPath) window.transIdx++;

    // 顺带预加载后面几张
    for (var k = 0; k < 3; k++) {
      var ni = (window.transIdx + k) % (list.length || 1);
      if (list[ni]) preloadOne(list[ni]);
    }

    function showAndFinish() {
      setTimeout(function () {
        img.style.opacity = "0";
        if (slot) slot.style.opacity = "0";
        setTimeout(function () {
          tr.style.display = "none";
          if (typeof done === "function") done();
        }, 200);
      }, 1700);
    }

    function reveal() {
      img.style.opacity = "1";
      showAndFinish();
    }

    setTimeout(function () {
      if (!srcPath) {
        if (slot) {
          slot.style.display = "block";
          slot.style.opacity = "1";
          slot.textContent = "[ TRANSITION ]";
        }
        showAndFinish();
        return;
      }

      var cached = _cache[srcPath] || preloadOne(srcPath);

      // 已缓存完成：立刻显示，再计时
      if (cached && cached.complete && cached.naturalWidth > 0) {
        img.src = srcPath;
        reveal();
        return;
      }

      // 未完成：等加载好再显示并开始计时（避免前几题黑屏）
      var settled = false;
      function onReady(ok) {
        if (settled) return;
        settled = true;
        if (ok) {
          img.src = srcPath;
          reveal();
        } else {
          if (slot) {
            slot.style.display = "block";
            slot.style.opacity = "1";
            slot.textContent = "[ TRANSITION ]";
          }
          showAndFinish();
        }
      }

      if (cached) {
        cached.onload = function () {
          onReady(true);
        };
        cached.onerror = function () {
          onReady(false);
        };
        // 可能在绑定前就已完成
        if (cached.complete && cached.naturalWidth > 0) onReady(true);
        if (cached.complete && cached.naturalWidth === 0) onReady(false);
      }

      img.onload = function () {
        onReady(true);
      };
      img.onerror = function () {
        onReady(false);
      };
      img.src = srcPath;

      // 最长等 2.5 秒，仍没有就继续（避免卡死）
      setTimeout(function () {
        if (!settled) {
          if (img.complete && img.naturalWidth > 0) onReady(true);
          else onReady(false);
        }
      }, 2500);
    }, 80);
  };
})();
