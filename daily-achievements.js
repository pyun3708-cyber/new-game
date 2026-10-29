(function(){
  const API_BASE = "https://school-auth.pyun3708.workers.dev";
  const ACH_ALL = "all_possibilities";
  function schoolToken(){ try{ return localStorage.getItem("school_token")||""; }catch(e){ return ""; } }
  window.tryUnlockAllPossibilities = async function tryUnlockAllPossibilities(){
    if(typeof allLotIds !== "function" || typeof state === "undefined") return;
    const maleIds = allLotIds("male");
    const femaleIds = allLotIds("female");
    const maleGot = (state.collected && state.collected.male) || {};
    const femaleGot = (state.collected && state.collected.female) || {};
    let maleCount = 0, femaleCount = 0;
    maleIds.forEach(id=>{ if(maleGot[id]) maleCount++; });
    femaleIds.forEach(id=>{ if(femaleGot[id]) femaleCount++; });
    if(maleCount < 15 && femaleCount < 15) return;
    try{ if(localStorage.getItem("ach_all_possibilities_done")==="1") return; }catch(e){}
    const token = schoolToken();
    if(!token){
      try{ localStorage.setItem("ach_all_possibilities_pending","1"); }catch(e){}
      const st = document.getElementById("statusLine");
      if(st) st.textContent = (st.textContent||"") + " · 已集齐！登录账号可点亮成就「所有的可能」";
      return;
    }
    try{
      const res = await fetch(API_BASE + "/achievements/unlock", {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization: "Bearer "+token },
        body: JSON.stringify({ achievementId: ACH_ALL })
      });
      const data = await res.json().catch(()=>({}));
      if(res.ok){
        try{
          localStorage.setItem("ach_all_possibilities_done","1");
          localStorage.removeItem("ach_all_possibilities_pending");
        }catch(e){}
        const st = document.getElementById("statusLine");
        if(st && data.newly) st.textContent = "成就点亮：所有的可能";
      }
    }catch(e){}
  };
  window.syncPendingAchievement = function(){ return window.tryUnlockAllPossibilities(); };
})();
