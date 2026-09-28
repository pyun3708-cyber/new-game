(function(){
  window.TRANS_IMAGES = window.TRANS_IMAGES || ["transitions/trans_01.jpg"];
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
      }, 700);
    }, 220);
  };
})();
