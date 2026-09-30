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
    "transitions/trans_20.jpg",
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
  window.doTransition = function(done){
    const tr = document.getElementById("blackTransition");
    const slot = document.getElementById("animSlot");
    let img = document.getElementById("transImg");
    if (!tr) { if (typeof done==="function") done(); return; }
    if (!img) {
      img = document.createElement("img");
      img.id = "transImg";
      img.alt = "";
      img.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000;opacity:0;pointer-events:none;transition:opacity .12s ease";
      tr.style.overflow = "hidden";
      tr.insertBefore(img, tr.firstChild);
    }
    tr.style.display = "flex";
    if (slot) slot.style.opacity = "0";
    img.style.opacity = "0";
    img.removeAttribute("src");
    setTimeout(function(){
      const list = window.TRANS_IMAGES || [];
      const srcPath = list.length ? list[window.transIdx % list.length] : "";
      if (srcPath) {
        window.transIdx++;
        img.onload = function(){ img.style.opacity = "1"; };
        img.onerror = function(){
          if (slot) { slot.style.display="block"; slot.style.opacity="1"; slot.textContent="[ TRANSITION ]"; }
        };
        img.src = srcPath;
      } else if (slot) {
        slot.style.display="block";
        slot.style.opacity="1";
        slot.textContent="[ TRANSITION ]";
      }
      setTimeout(function(){
        img.style.opacity = "0";
        if (slot) slot.style.opacity = "0";
        setTimeout(function(){
          tr.style.display = "none";
          if (typeof done === "function") done();
        }, 200);
      }, 1700);
    }, 220);
  };
})();
