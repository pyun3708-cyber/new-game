// ===== 被入侵洗脑：剧情 + 配对（整合 match_only_test） =====
const BATCH_A = ["媚黑成瘾","性爱成瘾","高潮喷卵","嗦屌吞精","舔蛋含龟","撑开子宫","掰开淫穴"];
const BATCH_B = ["打开双腿","抚摸阴蒂","阳具崇拜","拱屄喷卵","发情丧智","黑人崇拜","黑爹万岁"];
const MATCH_PHASE2 = [
  "媚黑万岁","黑爹万岁","媚黑光荣","自愿献身成为媚黑母畜","母畜淫穴自愿输给黑爹巨根",
  "无法抗拒……","母畜自愿放弃一切人权……","成为黑爹专属的性处理便器……",
  "打桩中出","捣烂子宫","种付受孕","强制高潮","强制高潮","强制高潮","强制高潮"
];

let matchLock=false, flipped=[], floatRaf=0, floatCards=[];

function shuffle(a){
  const arr=a.slice();
  for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
  return arr;
}
function stopFloat(){ if(floatRaf){cancelAnimationFrame(floatRaf);floatRaf=0;} floatCards=[]; }

function startFloat(){
  stopFloat();
  const nodes=[...document.querySelectorAll("#matchGrid .match-card")];
  const W=window.innerWidth,H=window.innerHeight,SPEED=0.11;
  floatCards=nodes.map(el=>{
    const w=el.offsetWidth||118,h=el.offsetHeight||76;
    const angle=Math.random()*Math.PI*2;
    return {el,w,h,x:Math.random()*Math.max(1,W-w),y:Math.random()*Math.max(1,H-h),vx:Math.cos(angle)*SPEED,vy:Math.sin(angle)*SPEED};
  });
  function resolve(){
    for(let i=0;i<floatCards.length;i++){
      for(let j=i+1;j<floatCards.length;j++){
        const a=floatCards[i],b=floatCards[j];
        if(!a.el.isConnected||!b.el.isConnected) continue;
        if(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y){
          const dx=(a.x+a.w/2)-(b.x+b.w/2), dy=(a.y+a.h/2)-(b.y+b.h/2);
          const ox=(a.w+b.w)/2-Math.abs(dx), oy=(a.h+b.h)/2-Math.abs(dy);
          if(ox<oy){const p=ox/2+.5; if(dx>=0){a.x+=p;b.x-=p;}else{a.x-=p;b.x+=p;} const t=a.vx;a.vx=b.vx;b.vx=t;}
          else{const p=oy/2+.5; if(dy>=0){a.y+=p;b.y-=p;}else{a.y-=p;b.y+=p;} const t=a.vy;a.vy=b.vy;b.vy=t;}
        }
      }
    }
  }
  function tick(){
    const W=window.innerWidth,H=window.innerHeight;
    floatCards.forEach(c=>{
      if(!c.el.isConnected)return;
      c.x+=c.vx;c.y+=c.vy;
      if(c.x<=0){c.x=0;c.vx=Math.abs(c.vx);}
      if(c.y<=0){c.y=0;c.vy=Math.abs(c.vy);}
      if(c.x+c.w>=W){c.x=W-c.w;c.vx=-Math.abs(c.vx);}
      if(c.y+c.h>=H){c.y=H-c.h;c.vy=-Math.abs(c.vy);}
    });
    resolve();
    floatCards.forEach(c=>{
      if(!c.el.isConnected)return;
      c.x=Math.max(0,Math.min(c.x,W-c.w));
      c.y=Math.max(0,Math.min(c.y,H-c.h));
      c.el.style.left=c.x+"px"; c.el.style.top=c.y+"px";
    });
    floatRaf=requestAnimationFrame(tick);
  }
  floatRaf=requestAnimationFrame(tick);
}

function spawnHeart(){
  const h=document.createElement("div");
  h.className="heart-f"; h.textContent="♥";
  h.style.left=(10+Math.random()*80)+"%"; h.style.bottom="5%";
  document.getElementById("matchHearts").appendChild(h);
  setTimeout(()=>h.remove(),4000);
}

// 黑屏 → 视频占位 → 黑屏
function playVideoTransition(next){
  const t=document.getElementById("transition");
  const ph=document.getElementById("transPh");
  if(!t){ if(typeof next==="function") next(); return; }
  stopFloat();
  t.style.display="block";
  t.style.background="#000";
  if(ph) ph.style.display="none";
  setTimeout(()=>{
    if(ph) ph.style.display="flex";
    setTimeout(()=>{
      if(ph) ph.style.display="none";
      t.style.background="#000";
      setTimeout(()=>{ t.style.display="none"; if(typeof next==="function") next(); }, 350);
    }, 1600);
  }, 400);
}

function makeStoryCard(text, onFlip){
  const el=document.createElement("div");
  el.className="match-card static story";
  el.innerHTML=`<div class="inner"><div class="face back">?</div><div class="face front">${text}</div></div>`;
  let flippedOnce=false;
  el.onclick=()=>{
    if(flippedOnce) return;
    flippedOnce=true;
    el.classList.add("flipped","matched");
    if(onFlip) onFlip(el);
  };
  return el;
}

// ---------- 开场剧情 ----------
function startIntro(){
  try{ document.getElementById("interviewScreen").style.display="none"; }catch(e){}
  try{ document.getElementById("glitchScreen").style.display="none"; }catch(e){}
  document.getElementById("matchScreen").style.display="none";
  const scene=document.getElementById("scene");
  const text=document.getElementById("sceneText");
  const cards=document.getElementById("sceneCards");
  scene.style.display="flex";
  text.textContent="好像成功进来了......";
  cards.innerHTML="";
  const c=makeStoryCard("嗯,发生什么事了?", ()=>{
    setTimeout(()=>{
      playVideoTransition(()=>{
        document.body.classList.add("pink-theme");
        introScene2();
      });
    }, 2000);
  });
  cards.appendChild(c);
}

function introScene2(){
  const text=document.getElementById("sceneText");
  const cards=document.getElementById("sceneCards");
  text.textContent="果然,在这里可以可以享用这些母畜毫无防备的意识♠";
  cards.innerHTML="";
  let n=0;
  function check(){
    n++;
    if(n>=2){
      setTimeout(()=>{ playVideoTransition(()=> introScene3()); }, 2000);
    }
  }
  cards.appendChild(makeStoryCard("齁哦哦哦哦哦哦❤怎么回事❤", check));
  cards.appendChild(makeStoryCard("明明下面什么也没有但却有被插进来的感觉❤", check));
}

function introScene3(){
  const text=document.getElementById("sceneText");
  const cards=document.getElementById("sceneCards");
  text.textContent="快感不经过肉体直接灌进精神的感觉怎么样啊,是不是很爽啊你这**婊子!";
  cards.innerHTML="";
  let n=0;
  function check(){
    n++;
    if(n>=2){
      setTimeout(()=>{ playVideoTransition(()=> introScene4()); }, 2000);
    }
  }
  cards.appendChild(makeStoryCard("哦齁哦哦哦❤不要,不要再插了❤", check));
  cards.appendChild(makeStoryCard("下面好舒服,浑身都好敏感❤", check));
}

function introScene4(){
  const text=document.getElementById("sceneText");
  const cards=document.getElementById("sceneCards");
  text.textContent="该办正事了,就这样把快感和催眠洗脑一起灌输进你这头母猪的发情猪脑里w";
  cards.innerHTML="";
  let flippedEls=[];
  function addPairCard(){
    const el=document.createElement("div");
    el.className="match-card static story";
    el.innerHTML=`<div class="inner"><div class="face back">?</div><div class="face front">什么,你们要对我的大脑做什么哦哦哦❤</div></div>`;
    el.onclick=()=>{
      if(el.classList.contains("flipped")) return;
      el.classList.add("flipped");
      flippedEls.push(el);
      if(flippedEls.length===2){
        flippedEls.forEach(x=>x.classList.add("matched"));
        setTimeout(()=>{
          playVideoTransition(()=>{
            document.getElementById("scene").style.display="none";
            startMatchPhase1();
          });
        }, 600);
      }
    };
    cards.appendChild(el);
  }
  addPairCard();
  addPairCard();
}

// ---------- 正式配对 ----------
function wordsToDeck(words){
  const arr=[]; words.forEach(w=>{arr.push(w,w);});
  return shuffle(arr).map((w,i)=>({id:i,word:w,matched:false}));
}

function renderMatchGrid(deck, onComplete){
  const grid=document.getElementById("matchGrid");
  grid.innerHTML="";
  flipped=[]; matchLock=false;
  let matchedPairs=0, finished=false;
  const totalPairs=deck.length/2;

  deck.forEach(card=>{
    const el=document.createElement("div");
    el.className="match-card";
    el.innerHTML=`<div class="inner"><div class="face back">?</div><div class="face front">${card.word}</div></div>`;
    el.onclick=()=>{
      if(matchLock||card.matched||el.classList.contains("flipped")||finished) return;
      el.classList.add("flipped");
      flipped.push({card,el});
      if(flipped.length===2){
        matchLock=true;
        const [a,b]=flipped;
        if(a.card.word===b.card.word){
          a.card.matched=b.card.matched=true;
          a.el.classList.add("matched"); b.el.classList.add("matched");
          flipped=[]; matchLock=false; matchedPairs++;
          const sc=document.getElementById("matchScreen");
          const ratio=matchedPairs/totalPairs;
          if(ratio>=1) sc.className="pink-full";
          else if(ratio>=0.35) sc.className="pinkish";
          if(ratio>0.45) spawnHeart();
          if(matchedPairs>=totalPairs&&!finished){
            finished=true; stopFloat();
            setTimeout(onComplete,500);
          }
        }else{
          setTimeout(()=>{
            a.el.classList.remove("flipped"); b.el.classList.remove("flipped");
            flipped=[]; matchLock=false;
          },650);
        }
      }
    };
    grid.appendChild(el);
  });
  requestAnimationFrame(()=>startFloat());
}

function startMatchPhase1(){
  const screen=document.getElementById("matchScreen");
  screen.style.display="block";
  screen.className="";
  renderMatchGrid(wordsToDeck(BATCH_A), ()=>{
    playVideoTransition(()=>{
      document.getElementById("matchScreen").className="";
      renderMatchGrid(wordsToDeck(BATCH_B), ()=>{
        playVideoTransition(()=> startMatchPhase2());
      });
    });
  });
}

function startMatchPhase2(){
  const list=MATCH_PHASE2.slice();
  document.getElementById("matchScreen").className="pink-full";
  document.getElementById("matchGrid").innerHTML="";
  stopFloat();
  let idx=0;
  function nextPair(){
    if(idx>=list.length){
      playVideoTransition(()=> startClimaxCascade());
      return;
    }
    const word=list[idx];
    const deck=shuffle([{id:0,word,matched:false},{id:1,word,matched:false}]);
    renderMatchGrid(deck, ()=>{
      idx++;
      playVideoTransition(()=> nextPair());
    });
  }
  nextPair();
}

function startClimaxCascade(){
  stopFloat();
  const screen=document.getElementById("matchScreen");
  screen.className=""; screen.style.background="#000";
  const grid=document.getElementById("matchGrid"); grid.innerHTML="";
  let cards=[], firstMatched=false, flooding=false;

  function addCard(autoShow){
    const card={id:cards.length,word:"高潮",matched:!!autoShow};
    cards.push(card);
    const el=document.createElement("div");
    el.className="match-card"+(autoShow?" matched flipped":"");
    el.innerHTML=`<div class="inner"><div class="face back">?</div><div class="face front">高潮</div></div>`;
    card.el=el;
    if(!autoShow){
      el.onclick=()=>{
        if(flooding||card.matched)return;
        el.classList.add("flipped"); card._open=true;
        const open=cards.filter(x=>x._open&&!x.matched);
        if(open.length>=2){
          open.forEach(x=>{x.matched=true;x.el.classList.add("matched");});
          if(!firstMatched){ firstMatched=true; beginFlood(); }
        }
      };
    }
    grid.appendChild(el);
  }
  addCard(false); addCard(false); startFloat();

  function beginFlood(){
    flooding=true;
    const target=48;
    const iv=setInterval(()=>{
      if(cards.length>=target){
        clearInterval(iv); stopFloat();
        setTimeout(()=>{
          cards.forEach(c=>{c.matched=true; if(c.el)c.el.classList.add("flipped","matched");});
          setTimeout(()=>playVideoTransition(()=>finishClimaxBoard()),900);
        },1000);
        return;
      }
      for(let i=0;i<2+Math.floor(Math.random()*2)&&cards.length<target;i++) addCard(true);
      startFloat();
    },180);
  }
}

function finishClimaxBoard(){
  stopFloat();
  const grid=document.getElementById("matchGrid"); grid.innerHTML="";
  const finalText="去了去了，反差媚黑母畜丧失人权成为黑爹鸡把套子败北高潮了齁哦哦哦哦哦❤️！！！";
  const deck=[{id:0,word:finalText,matched:false},{id:1,word:finalText,matched:false}];
  deck.forEach(card=>{
    const el=document.createElement("div");
    el.className="match-card wide";
    el.innerHTML=`<div class="inner"><div class="face back">?</div><div class="face front">${card.word}</div></div>`;
    el.onclick=()=>{
      el.classList.add("flipped","matched"); card.matched=true;
      if(deck.every(c=>c.matched)) setTimeout(()=>playVideoTransition(()=>finalDotsPhase()),400);
    };
    grid.appendChild(el);
  });
  startFloat();
}

function finalDotsPhase(){
  stopFloat();
  const grid=document.getElementById("matchGrid"); grid.innerHTML="";
  function showPair(a,b,next){
    grid.innerHTML=""; let matched=0;
    [a,b].forEach(w=>{
      const el=document.createElement("div");
      el.className="match-card";
      el.innerHTML=`<div class="inner"><div class="face back">?</div><div class="face front">${w}</div></div>`;
      el.onclick=()=>{
        if(el.classList.contains("matched"))return;
        el.classList.add("flipped","matched"); matched++;
        if(matched>=2) setTimeout(()=>playVideoTransition(next),500);
      };
      grid.appendChild(el);
    });
    startFloat();
  }
  showPair("……","……",()=>{
    showPair("媚黑","万岁",()=>{
      stopFloat();
      document.getElementById("matchScreen").style.display="none";
      try{ document.getElementById("scene").style.display="none"; }catch(e){}
      // 洗脑结束 → 与男版一致：黑屏高潮播报 → 雷达结果 → 教师资格证
      startBlackPlay();
    });
  });
}

