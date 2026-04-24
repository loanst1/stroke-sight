// Stroke Sight — Peripheral Flicker exercise
// Globals: addScore, missScore, getCurrentLevel, LEVEL_CONFIG, playSpatialCue,
//          t, affectedSide, userCondition, conditionDetail, exState, rnd,
//          getTargetBias, randomInBias, startTimer, endEx, setStat, showFb

// ════════════════════════════════════
// EXERCISE 3 — Peripheral Flicker
// ════════════════════════════════════
function exFlicker(cv,startBtn){
  var ctx=cv.getContext('2d');
  var running=false;
  var W,H;
  var lvlCfg = LEVEL_CONFIG.flicker[getCurrentLevel('flicker')-1];
  var FLICKER_MS = lvlCfg.durationMs;
  var FLICKER_R = lvlCfg.radius;
  var MIN_DELAY = lvlCfg.minDelayMs;

  function drawBase(){
    W=cv.width;H=cv.height;
    ctx.fillStyle='#081210';ctx.fillRect(0,0,W,H);
    var cx=W/2,cy=H/2;
    ctx.strokeStyle='#fff';ctx.lineWidth=2.5;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(cx-22,cy);ctx.lineTo(cx+22,cy);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx,cy-22);ctx.lineTo(cx,cy+22);ctx.stroke();
    ctx.beginPath();ctx.arc(cx,cy,3.5,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.15)';ctx.font='13px sans-serif';ctx.textAlign='center';
    ctx.textBaseline='alphabetic';
    var _fTxt=t('ex_flicker_instr');
    if(_fTxt.length>60){
      var _mid=_fTxt.lastIndexOf(' ',Math.floor(_fTxt.length/2));
      if(_mid>0){ctx.fillText(_fTxt.substring(0,_mid),cx,H-28);ctx.fillText(_fTxt.substring(_mid+1),cx,H-12);}
      else{ctx.fillText(_fTxt,cx,H-14);}
    }else{ctx.fillText(_fTxt,cx,H-14);}
  }

  function spawnFlicker(){
    if(!running)return;
    drawBase();
    var fx,fy;
    if(userCondition==='quadrantanopia'){
      var bias=getTargetBias(W,H);
      if(Math.random()<0.65){
        fx=rnd(Math.max(bias.x_min+20,0),Math.min(bias.x_max-20,W));
        fy=rnd(Math.max(bias.y_min+20,0),Math.min(bias.y_max-20,H));
      }else{
        fx=rnd(30,W-30);fy=rnd(30,H-40);
      }
    }else{
      var side=Math.random()<0.65?(affectedSide==='left'?-1:1):(affectedSide==='left'?1:-1);
      fx=W/2+side*rnd(90,W/2-30);
      fy=rnd(30,H-40);
    }
    exState.up=true;exState.shown=Date.now();
    ctx.beginPath();ctx.arc(fx,fy,FLICKER_R/2,0,Math.PI*2);
    ctx.fillStyle='rgba(251,191,36,0.82)';ctx.fill();
    ctx.beginPath();ctx.arc(fx,fy,FLICKER_R,0,Math.PI*2);
    ctx.fillStyle='rgba(251,191,36,0.15)';ctx.fill();
    exState.dotTimer=setTimeout(function(){
      if(exState.up){missScore();exState.up=false;}
      drawBase();if(running)exState.dotTimer=setTimeout(spawnFlicker,rnd(MIN_DELAY,MIN_DELAY+1200));
    },FLICKER_MS);
  }

  function respond(){
    if(!exState.up)return;
    clearTimeout(exState.dotTimer);exState.up=false;
    drawBase();var rt=Date.now()-exState.shown;
    addScore(rt<350?3:rt<600?2:1,rt);
    if(running)exState.dotTimer=setTimeout(spawnFlicker,rnd(MIN_DELAY*0.5,MIN_DELAY));
  }

  // Depends on: addScore, missScore, getCurrentLevel, LEVEL_CONFIG
  var _lastTouchTime3 = 0;
  cv.addEventListener('touchend',function(e){e.preventDefault();
    _lastTouchTime3=Date.now();
    if(!running){startBtn.click();return;}respond();
  },{passive:false});
  cv.addEventListener('click',function(){
    if(Date.now()-_lastTouchTime3<500)return;
    if(!running){startBtn.click();return;}respond();
  });
  exState.spaceHandler=function(e){if(e.code==='Space'&&running){e.preventDefault();respond();}};
  document.addEventListener('keydown',exState.spaceHandler);

  drawBase();

  startBtn.addEventListener('click',function(){
    running=true;exState.score=0;exState.streak=0;exState.hits=0;exState.misses=0;exState.totalRt=0;
    startBtn.disabled=true;
    startTimer(function(){running=false;endEx();});
    spawnFlicker();
  });
}
