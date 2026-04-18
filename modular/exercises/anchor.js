// Stroke Sight — Anchor & Scan exercise
// Globals: addScore, missScore, getCurrentLevel, LEVEL_CONFIG, playSpatialCue,
//          t, affectedSide, userCondition, conditionDetail, exState, rnd,
//          getTargetBias, randomInBias, startTimer, endEx, setStat, showFb

// ════════════════════════════════════
// EXERCISE 1 — Anchor & Scan
// ════════════════════════════════════
function exAnchor(cv,startBtn){
  var ctx=cv.getContext('2d');
  var running=false;
  var W,H;
  var lvlCfg = LEVEL_CONFIG.anchor[getCurrentLevel('anchor')-1];
  var RADIUS = lvlCfg.radius;
  var DISPLAY_MS = lvlCfg.displayMs;
  var INT_MIN = lvlCfg.intMin;
  var INT_MAX = lvlCfg.intMax;
  var BIAS = lvlCfg.bias;

  function drawBase(){
    W=cv.width;H=cv.height;
    ctx.fillStyle='#081210';ctx.fillRect(0,0,W,H);
    var cx=W/2,cy=H/2;
    // midline hint
    ctx.strokeStyle='rgba(255,255,255,0.04)';ctx.lineWidth=1;
    ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(cx,0);ctx.lineTo(cx,H);ctx.stroke();
    ctx.setLineDash([]);
    // labels
    ctx.fillStyle='rgba(255,255,255,0.18)';ctx.font='12px sans-serif';
    if(affectedSide==='left'){
      ctx.textAlign='left';ctx.fillText(t('canvas_affected_left'),18,18);
      ctx.textAlign='right';ctx.fillText(t('canvas_sighted_right'),W-22,18);
    }else{
      ctx.textAlign='left';ctx.fillText(t('canvas_sighted_left'),18,18);
      ctx.textAlign='right';ctx.fillText(t('canvas_affected_right'),W-22,18);
    }
    // fixation cross
    ctx.strokeStyle='#ffffff';ctx.lineWidth=2.5;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(cx-20,cy);ctx.lineTo(cx+20,cy);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx,cy-20);ctx.lineTo(cx,cy+20);ctx.stroke();
    ctx.beginPath();ctx.arc(cx,cy,3,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
  }

  function spawnTarget(){
    if(!running)return;
    drawBase();
    var tx,ty;
    if(userCondition==='quadrantanopia'){
      var bias=getTargetBias(W,H);
      if(Math.random()<BIAS){
        tx=rnd(Math.max(bias.x_min+20,0),Math.min(bias.x_max-20,W));
        ty=rnd(Math.max(bias.y_min+20,0),Math.min(bias.y_max-20,H));
      }else{
        tx=rnd(30,W-30);ty=rnd(30,H-30);
      }
    }else{
      var side=Math.random()<BIAS?(affectedSide==='left'?-1:1):(affectedSide==='left'?1:-1);
      tx=W/2+side*rnd(55,W/2-45);
      ty=rnd(35,H-35);
    }
    exState.tx=tx;exState.ty=ty;exState.up=true;exState.shown=Date.now();
    // glow
    var g=ctx.createRadialGradient(tx,ty,2,tx,ty,RADIUS+16);
    g.addColorStop(0,'#6ee7b7');g.addColorStop(0.5,'rgba(110,231,183,0.3)');g.addColorStop(1,'rgba(110,231,183,0)');
    ctx.beginPath();ctx.arc(tx,ty,RADIUS+16,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
    ctx.beginPath();ctx.arc(tx,ty,RADIUS,0,Math.PI*2);ctx.fillStyle='#6ee7b7';ctx.fill();
    exState.dotTimer=setTimeout(function(){
      if(exState.up){missScore();exState.up=false;}
      drawBase();
      if(running)exState.dotTimer=setTimeout(spawnTarget,rnd(300,800));
    },DISPLAY_MS);
  }

  function onHit(mx,my){
    if(!exState.up)return;
    if(Math.hypot(mx-exState.tx,my-exState.ty)>RADIUS+45)return;
    clearTimeout(exState.dotTimer);exState.up=false;
    var rt=Date.now()-exState.shown;
    drawBase();
    ctx.beginPath();ctx.arc(exState.tx,exState.ty,RADIUS+3,0,Math.PI*2);ctx.fillStyle='#6ee7b7';ctx.fill();
    addScore(rt<700?4:rt<1400?3:2,rt);
    setTimeout(function(){if(running)spawnTarget();},350);
  }

  function getXY(e,touch){
    var r=cv.getBoundingClientRect();
    var sx=cv.width/r.width,sy=cv.height/r.height;
    if(touch){return{x:(touch.clientX-r.left)*sx,y:(touch.clientY-r.top)*sy};}
    return{x:(e.clientX-r.left)*sx,y:(e.clientY-r.top)*sy};
  }

  // Depends on: addScore, missScore, getCurrentLevel, LEVEL_CONFIG
  var _lastTouchTime = 0;
  cv.addEventListener('touchend',function(e){e.preventDefault();
    _lastTouchTime = Date.now();
    if(!running){startBtn.click();return;}
    var p=getXY(e,e.changedTouches[0]);onHit(p.x,p.y);
  },{passive:false});
  cv.addEventListener('click',function(e){
    if(Date.now()-_lastTouchTime<500)return;
    if(!running){startBtn.click();return;}
    var p=getXY(e);onHit(p.x,p.y);
  });

  drawBase();
  ctx.fillStyle='rgba(255,255,255,0.22)';ctx.font='14px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(t('start_prompt'),W/2,H/2+52);

  startBtn.addEventListener('click',function(){
    running=true;exState.score=0;exState.streak=0;exState.hits=0;exState.misses=0;exState.totalRt=0;
    startBtn.disabled=true;
    startTimer(function(){running=false;endEx();});
    spawnTarget();
  });
}
