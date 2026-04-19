// Stroke Sight — Gap Fill exercise
// Globals: addScore, missScore, getCurrentLevel, LEVEL_CONFIG, playSpatialCue,
//          t, affectedSide, userCondition, conditionDetail, exState, rnd,
//          getTargetBias, randomInBias, startTimer, endEx, setStat, showFb

// ════════════════════════════════════
// EXERCISE 8 — Gap Fill (Scotoma)
// ════════════════════════════════════
function exGapfill(cv,startBtn){
  var ctx=cv.getContext('2d');
  var running=false;
  var W,H;
  var lvlCfg=LEVEL_CONFIG.gapfill[getCurrentLevel('gapfill')-1];
  var RING_TOTAL=lvlCfg.targets;
  var SCOTOM_TARGETS=lvlCfg.scotomTargets;

  var ringTargets=[]; // {x,y,visible,found}
  var missingPositions=[]; // expected positions of scotoma targets
  var round=0;
  var ROUNDS=8;

  function getXY(e,touch){
    var r=cv.getBoundingClientRect();var sx=cv.width/r.width,sy=cv.height/r.height;
    if(touch)return{x:(touch.clientX-r.left)*sx,y:(touch.clientY-r.top)*sy};
    return{x:(e.clientX-r.left)*sx,y:(e.clientY-r.top)*sy};
  }

  function getScotomCenter(){
    var parts=(conditionDetail||'2,2').split(',');
    var sr=parseInt(parts[0])||2,sc=parseInt(parts[1])||2;
    return{cx:(sc/4)*W,cy:(sr/4)*H};
  }

  function buildRound(){
    W=cv.width;H=cv.height;
    ringTargets=[];missingPositions=[];
    var sc=getScotomCenter();
    var R=Math.min(W,H)*0.32;
    // Place RING_TOTAL targets evenly in a circle around scotoma center
    for(var i=0;i<RING_TOTAL;i++){
      var ang=(i/RING_TOTAL)*Math.PI*2;
      var x=sc.cx+R*Math.cos(ang);
      var y=sc.cy+R*Math.sin(ang);
      // Clamp to canvas
      x=Math.max(20,Math.min(W-20,x));
      y=Math.max(20,Math.min(H-20,y));
      var visible=true;
      // Mark some as in scotoma (choose SCOTOM_TARGETS evenly spaced)
      if(i%Math.floor(RING_TOTAL/SCOTOM_TARGETS)===0&&missingPositions.length<SCOTOM_TARGETS){
        visible=false;
        missingPositions.push({x:x,y:y,found:false});
      }
      if(visible) ringTargets.push({x:x,y:y,found:false});
    }
  }

  function drawScene(){
    ctx.fillStyle='#081210';ctx.fillRect(0,0,W,H);
    var sc=getScotomCenter();
    // Faint scotoma hint
    ctx.beginPath();ctx.arc(sc.cx,sc.cy,Math.min(W,H)*0.12,0,Math.PI*2);
    ctx.fillStyle='rgba(255,60,60,0.05)';ctx.fill();
    // Visible ring targets
    ringTargets.forEach(function(t){
      ctx.beginPath();ctx.arc(t.x,t.y,10,0,Math.PI*2);
      ctx.fillStyle=t.found?'rgba(110,231,183,0.4)':'#6c5ce7';
      ctx.fill();
      if(!t.found){
        ctx.strokeStyle='rgba(255,255,255,0.3)';ctx.lineWidth=1.5;ctx.stroke();
      }
    });
    // Guide text
    ctx.fillStyle='rgba(255,255,255,0.3)';ctx.font='13px sans-serif';
    ctx.textAlign='center';ctx.textBaseline='top';
    ctx.fillText('Tap where the missing targets should be',W/2,12);
    ctx.fillText('Round '+(round+1)+' of '+ROUNDS,W/2,H-20);
  }

  function checkDone(){
    return missingPositions.every(function(p){return p.found;});
  }

  function revealMissing(){
    missingPositions.forEach(function(p){
      // Show true positions in green
      ctx.beginPath();ctx.arc(p.x,p.y,10,0,Math.PI*2);
      ctx.strokeStyle='#6ee7b7';ctx.lineWidth=2;ctx.stroke();
      ctx.fillStyle='rgba(110,231,183,0.2)';ctx.fill();
    });
  }

  function onTap(mx,my){
    if(!running)return;
    var tol=38;
    var hit=null;
    missingPositions.forEach(function(p){
      if(!p.found&&Math.hypot(mx-p.x,my-p.y)<tol)hit=p;
    });
    if(hit){
      hit.found=true;
      ctx.beginPath();ctx.arc(hit.x,hit.y,12,0,Math.PI*2);
      ctx.fillStyle='rgba(110,231,183,0.5)';ctx.fill();
      addScore(3,0);
      if(checkDone()){
        round++;
        if(round>=ROUNDS){running=false;endEx();return;}
        exState.dotTimer=setTimeout(function(){
          buildRound();drawScene();
        },800);
      }
    }else{
      // Check if tapping visible target (wrong)
      var wrongHit=ringTargets.some(function(t){return Math.hypot(mx-t.x,my-t.y)<20;});
      if(!wrongHit)missScore();
    }
    drawScene();
  }

  // Depends on: addScore, missScore, getCurrentLevel, LEVEL_CONFIG
  var _lastTouchTime8 = 0;
  cv.addEventListener('touchend',function(e){e.preventDefault();
    _lastTouchTime8=Date.now();
    if(!running){startBtn.click();return;}
    var p=getXY(e,e.changedTouches[0]);onTap(p.x,p.y);
  },{passive:false});
  cv.addEventListener('click',function(e){
    if(Date.now()-_lastTouchTime8<500)return;
    if(!running){startBtn.click();return;}
    var p=getXY(e);onTap(p.x,p.y);
  });

  W=cv.width;H=cv.height;
  ctx.fillStyle='#081210';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,0.2)';ctx.font='15px sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('Tap where the missing circles belong',W/2,H/2);

  startBtn.addEventListener('click',function(){
    running=true;round=0;
    exState.score=0;exState.streak=0;exState.hits=0;exState.misses=0;exState.totalRt=0;
    startBtn.disabled=true;
    W=cv.width;H=cv.height;
    buildRound();drawScene();
  });
}
