// Stroke Sight — Smooth Pursuit exercise
// Globals: addScore, missScore, getCurrentLevel, LEVEL_CONFIG, playSpatialCue,
//          t, affectedSide, userCondition, conditionDetail, exState, rnd,
//          getTargetBias, randomInBias, startTimer, endEx, setStat, showFb

// ════════════════════════════════════
// EXERCISE 5 — Smooth Pursuit Training (Neglect)
// ════════════════════════════════════
function exPursuit(cv,startBtn){
  var ctx=cv.getContext('2d');
  var running=false;
  var W,H;
  var lvl=getCurrentLevel('pursuit');
  var lvlCfg=LEVEL_CONFIG.pursuit[lvl];

  // Apply bisection bias to pause window
  var biasPct=parseFloat(_ls.getItem('strokeSight_bisectionBias')||'0');
  var biasBoost=Math.min(biasPct/50,0.3);
  var effectivePauseWindow=Math.round(lvlCfg.pauseWindow*(1+biasBoost));

  var SPEED=lvlCfg.speed;
  var TOTAL_PASSES=lvlCfg.passes;
  var PAUSE_WINDOW=effectivePauseWindow;
  var TARGET_R=lvlCfg.targetSize;

  var passCount=0;
  var successCount=0;
  var circX=0,circY=0,circVX=0;
  var phase='moving'; // 'moving' | 'paused' | 'blank'
  var pauseTimer=null;
  var lastAudioTime=0;
  var pausedTapped=false;
  var pausedAt=0;
  var passStopThreshold=0; // x position to stop at, set per pass

  function getXY(e,touch){
    var r=cv.getBoundingClientRect();var sx=cv.width/r.width,sy=cv.height/r.height;
    if(touch)return{x:(touch.clientX-r.left)*sx,y:(touch.clientY-r.top)*sy};
    return{x:(e.clientX-r.left)*sx,y:(e.clientY-r.top)*sy};
  }

  function startPass(){
    if(!running)return;
    if(passCount>=TOTAL_PASSES){
      // Neglect-aware completion message
      var sideName=affectedSide==='left'?'left':'right';
      showFb('Session complete! '+passCount+' passes done.',true);
      if(userCondition==='neglect'){
        var fb=document.getElementById('ex-fb');
        if(fb){
          fb.textContent=t(affectedSide==='left'?'pursuit_neglect_complete_left':'pursuit_neglect_complete_right');
          fb.className='feedback fb-good';
        }
      }
      setTimeout(function(){running=false;endEx();},2000);
      return;
    }
    passCount++;
    setStat('sv-streak',successCount);
    // Alternate slightly different Y positions for each pass
    var yVariance=(passCount%3-1)*H*0.12;
    var startOnIntact=(affectedSide==='left'); // intact side is right when neglect is left
    // For neglect: neglected side is affectedSide, intact side is opposite
    // Circle starts on INTACT side, moves toward NEGLECTED side
    var startRight=(affectedSide==='left'); // if neglected is left, intact is right
    if(startRight){
      circX=W-TARGET_R-10;
      circVX=-SPEED;
    }else{
      circX=TARGET_R+10;
      circVX=SPEED;
    }
    circY=H/2+yVariance;
    // Set stop threshold once per pass (random point in neglected half)
    if(circVX<0){
      // Moving right-to-left, stop in left (neglected or intact) region
      passStopThreshold=W*0.15+Math.random()*W*0.25; // stop between 15%-40% of width
    }else{
      // Moving left-to-right, stop in right region
      passStopThreshold=W*0.60+Math.random()*W*0.25; // stop between 60%-85%
    }
    phase='moving';
    pausedTapped=false;
    lastAudioTime=0;
  }

  function drawScene(){
    W=cv.width;H=cv.height;
    ctx.fillStyle='#081210';ctx.fillRect(0,0,W,H);
    if(phase==='blank')return;
    // Subtle midline
    ctx.strokeStyle='rgba(255,255,255,0.04)';ctx.lineWidth=1;
    ctx.setLineDash([6,6]);
    ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();
    ctx.setLineDash([]);
    // Side labels
    ctx.fillStyle='rgba(255,255,255,0.15)';ctx.font='11px sans-serif';
    if(affectedSide==='left'){
      ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText('Neglected side',8,8);
      ctx.textAlign='right';ctx.fillText('Intact side',W-8,8);
    }else{
      ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText('Intact side',8,8);
      ctx.textAlign='right';ctx.fillText('Neglected side',W-8,8);
    }
    // Pass counter
    ctx.fillStyle='rgba(255,255,255,0.4)';ctx.font='13px sans-serif';
    ctx.textAlign='center';ctx.textBaseline='top';
    ctx.fillText('Pass '+passCount+' of '+TOTAL_PASSES,W/2,8);
    // Draw circle with glow
    var g=ctx.createRadialGradient(circX,circY,2,circX,circY,TARGET_R+16);
    g.addColorStop(0,'rgba(110,231,183,0.9)');
    g.addColorStop(0.4,'rgba(110,231,183,0.3)');
    g.addColorStop(1,'rgba(110,231,183,0)');
    ctx.beginPath();ctx.arc(circX,circY,TARGET_R+16,0,Math.PI*2);
    ctx.fillStyle=g;ctx.fill();
    ctx.beginPath();ctx.arc(circX,circY,TARGET_R,0,Math.PI*2);
    ctx.fillStyle='#6ee7b7';ctx.fill();
    if(phase==='paused'){
      // Pulsing ring to indicate "tap now"
      var pulse=0.5+0.5*Math.sin(Date.now()*0.008);
      ctx.beginPath();ctx.arc(circX,circY,TARGET_R+8+pulse*6,0,Math.PI*2);
      ctx.strokeStyle='rgba(110,231,183,'+(0.4+0.4*pulse)+')';ctx.lineWidth=2;ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,0.55)';ctx.font='12px sans-serif';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('TAP',circX,circY);
    }
  }

  function loop(){
    if(!running)return;
    W=cv.width;H=cv.height;
    if(phase==='moving'){
      circX+=circVX;
      // Spatial audio every ~0.5 seconds of movement
      var now=Date.now();
      if(now-lastAudioTime>500){
        lastAudioTime=now;
        var pan=circX/W*2-1; // -1..+1
        playSpatialCue(pan,0.6);
      }
      // Stop condition: circle has crossed the pre-set threshold for this pass
      var stopX=(circVX<0)?(circX<=passStopThreshold):(circX>=passStopThreshold);
      // Also stop if circle is out of bounds
      if(circX<-TARGET_R||circX>W+TARGET_R){
        // Missed this pass — circle exited screen without stopping
        missScore();
        phase='blank';
        drawScene();
        exState.dotTimer=setTimeout(function(){
          phase='moving';
          startPass();
        },500);
        exState.raf=requestAnimationFrame(loop);
        return;
      }
      if(stopX){
        // Pause here
        phase='paused';
        pausedAt=Date.now();
        pausedTapped=false;
        pauseTimer=setTimeout(function(){
          if(phase==='paused'&&!pausedTapped){
            // Miss — didn't tap in time
            missScore();
            phase='blank';
            drawScene();
            exState.dotTimer=setTimeout(function(){
              phase='moving';
              startPass();
            },500);
          }
        },PAUSE_WINDOW);
      }
    }
    drawScene();
    exState.raf=requestAnimationFrame(loop);
  }

  function onTap(mx,my){
    if(!running)return;
    if(phase==='paused'&&!pausedTapped){
      var dist=Math.hypot(mx-circX,my-circY);
      if(dist<TARGET_R+40){
        pausedTapped=true;
        clearTimeout(pauseTimer);
        var rt=Date.now()-pausedAt;
        var pts=rt<800?4:rt<1500?3:2;
        addScore(pts,rt);
        successCount++;
        setStat('sv-streak',successCount);
        // Success burst
        ctx.beginPath();ctx.arc(circX,circY,TARGET_R+12,0,Math.PI*2);
        ctx.fillStyle='rgba(110,231,183,0.5)';ctx.fill();
        phase='blank';
        exState.dotTimer=setTimeout(function(){
          phase='moving';
          startPass();
        },500);
      }
    }else if(phase==='moving'){
      // Tapping during movement does nothing (not a saccade task)
    }
  }

  // Depends on: addScore, missScore, getCurrentLevel, LEVEL_CONFIG
  var _lastTouchTime5 = 0;
  cv.addEventListener('touchend',function(e){e.preventDefault();
    _lastTouchTime5=Date.now();
    if(!running){startBtn.click();return;}
    var p=getXY(e,e.changedTouches[0]);onTap(p.x,p.y);
  },{passive:false});
  cv.addEventListener('click',function(e){
    if(Date.now()-_lastTouchTime5<500)return;
    if(!running){startBtn.click();return;}
    var p=getXY(e);onTap(p.x,p.y);
  });

  // Draw idle state
  W=cv.width;H=cv.height;
  ctx.fillStyle='#081210';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,0.2)';ctx.font='15px sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('Follow the circle with your eyes. Tap when it stops.',W/2,H/2);

  startBtn.addEventListener('click',function(){
    running=true;passCount=0;successCount=0;
    exState.score=0;exState.streak=0;exState.hits=0;exState.misses=0;exState.totalRt=0;
    startBtn.disabled=true;
    W=cv.width;H=cv.height;
    startPass();
    exState.raf=requestAnimationFrame(loop);
  });
}
