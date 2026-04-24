// Stroke Sight — Line Bisection exercise
// Globals: addScore, missScore, getCurrentLevel, LEVEL_CONFIG, playSpatialCue,
//          t, affectedSide, userCondition, conditionDetail, exState, rnd,
//          getTargetBias, randomInBias, startTimer, endEx, setStat, showFb

// ════════════════════════════════════
// EXERCISE 6 — Line Bisection (Neglect)
// ════════════════════════════════════
function exBisection(cv,startBtn){
  var ctx=cv.getContext('2d');
  var running=false;
  var W,H;
  var lvlCfg=LEVEL_CONFIG.bisection[getCurrentLevel('bisection')-1];
  var TOTAL_LINES=lvlCfg.lines;
  var MIN_LENGTH=lvlCfg.minLength;
  var TIME_PER_LINE=lvlCfg.timePerLine;

  var linesDone=0;
  var currentLineData=null;
  var waitingForNext=false;
  var deviationSum=0;
  var deviationCount=0;

  function getXY(e,touch){
    var r=cv.getBoundingClientRect();var sx=cv.width/r.width,sy=cv.height/r.height;
    if(touch)return{x:(touch.clientX-r.left)*sx,y:(touch.clientY-r.top)*sy};
    return{x:(e.clientX-r.left)*sx,y:(e.clientY-r.top)*sy};
  }

  function drawIdle(){
    W=cv.width;H=cv.height;
    ctx.fillStyle='#081210';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='rgba(255,255,255,0.2)';ctx.font='15px sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('Tap the midpoint of each line',W/2,H/2);
  }

  function makeLine(){
    W=cv.width;H=cv.height;
    var maxLen=lvlCfg.minLength+Math.random()*(0.9-lvlCfg.minLength);
    var lineLen=Math.round(W*maxLen);
    // Bias line position toward neglected side at higher levels
    var cx;
    if(userCondition==='neglect'){
      var biasAmt=Math.min(0.45,(getCurrentLevel('bisection')-1)*0.04);
      if(affectedSide==='left') cx=rnd(lineLen/2,W*0.5+W*biasAmt);
      else cx=rnd(W*0.5-W*biasAmt,W-lineLen/2);
    }else{
      cx=rnd(lineLen/2+20,W-lineLen/2-20);
    }
    var y=rnd(H*0.25,H*0.75);
    return{x1:cx-lineLen/2,x2:cx+lineLen/2,y:y,mid:cx,len:lineLen};
  }

  function drawLine(ld,tapX,revealed){
    W=cv.width;H=cv.height;
    ctx.fillStyle='#081210';ctx.fillRect(0,0,W,H);
    // Progress
    ctx.fillStyle='rgba(255,255,255,0.35)';ctx.font='13px sans-serif';
    ctx.textAlign='left';ctx.textBaseline='top';
    ctx.fillText('Line '+(linesDone+1)+' of '+TOTAL_LINES,12,12);
    // The line
    ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(ld.x1,ld.y);ctx.lineTo(ld.x2,ld.y);ctx.stroke();
    // End tick marks
    ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(ld.x1,ld.y-10);ctx.lineTo(ld.x1,ld.y+10);ctx.stroke();
    ctx.beginPath();ctx.moveTo(ld.x2,ld.y-10);ctx.lineTo(ld.x2,ld.y+10);ctx.stroke();
    if(tapX!==undefined){
      // User tap marker
      ctx.strokeStyle='#f59e0b';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(tapX,ld.y-14);ctx.lineTo(tapX,ld.y+14);ctx.stroke();
      if(revealed){
        // True midpoint
        ctx.strokeStyle='#6ee7b7';ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(ld.mid,ld.y-14);ctx.lineTo(ld.mid,ld.y+14);ctx.stroke();
        // Error line
        var err=Math.abs(tapX-ld.mid)/ld.len;
        var col=err<0.05?'#22c55e':err<0.10?'#f59e0b':'#ef4444';
        ctx.fillStyle=col;ctx.font='bold 13px sans-serif';ctx.textAlign='center';
        ctx.fillText(Math.round(err*100)+'% off',ld.mid,ld.y+30);
        ctx.fillStyle='rgba(110,231,183,0.6)';ctx.font='11px sans-serif';
        ctx.fillText('true midpoint',ld.mid,ld.y+46);
        ctx.fillStyle='rgba(245,158,11,0.7)';
        ctx.fillText('your tap',tapX,ld.y-26);
      }
    }
    // Timer bar
    if(running&&currentLineData&&currentLineData.timeLeft!==undefined){
      var pct=currentLineData.timeLeft/TIME_PER_LINE;
      ctx.fillStyle='rgba(255,255,255,0.08)';ctx.fillRect(0,H-6,W,6);
      ctx.fillStyle=pct>0.4?'#6ee7b7':'#f87171';
      ctx.fillRect(0,H-6,W*pct,6);
    }
  }

  function nextLine(){
    if(linesDone>=TOTAL_LINES||!running){
      running=false;
      // Calculate average deviation and store as bisection bias
      var avgDev=deviationCount>0?Math.round((deviationSum/deviationCount)*100):0;
      _ls.setItem('strokeSight_bisectionBias',avgDev);
      showFb('Done! Avg deviation: '+avgDev+'%. This will adjust your next Smooth Pursuit session.',true);
      if(userCondition==='neglect'){
        var fb=document.getElementById('ex-fb');
        if(fb){
          var sideName=affectedSide==='left'?'left':'right';
          fb.textContent=t(affectedSide==='left'?'bisection_neglect_complete_left':'bisection_neglect_complete_right');
          fb.className='feedback fb-good';
        }
      }
      // Delay endEx so the message is visible
      exState.dotTimer=setTimeout(function(){endEx();},2500);
      return;
    }
    currentLineData=makeLine();
    currentLineData.timeLeft=TIME_PER_LINE;
    waitingForNext=false;
    drawLine(currentLineData,undefined,false);
    // Spatial audio cue from neglected side when line appears
    var pan=affectedSide==='left'?-1:1;
    playSpatialCue(pan,0.8);
    // Countdown timer for this line
    exState.dotTimer=setTimeout(function lineTick(){
      if(!running)return;
      currentLineData.timeLeft--;
      drawLine(currentLineData,undefined,false);
      if(currentLineData.timeLeft<=0){
        // Timed out — show mid, no score
        missScore();
        waitingForNext=true;
        drawLine(currentLineData,currentLineData.mid,true);
        linesDone++;
        exState.dotTimer=setTimeout(nextLine,1200);
      }else{
        exState.dotTimer=setTimeout(lineTick,1000);
      }
    },1000);
  }

  function onTap(mx,my){
    if(!running||waitingForNext||!currentLineData)return;
    if(my<currentLineData.y-40||my>currentLineData.y+40)return;
    clearTimeout(exState.dotTimer);
    waitingForNext=true;
    var err=Math.abs(mx-currentLineData.mid)/currentLineData.len;
    deviationSum+=err*100;
    deviationCount++;
    var score=err<0.05?4:err<0.10?3:err<0.20?2:1;
    addScore(score,0);
    drawLine(currentLineData,mx,true);
    linesDone++;
    exState.dotTimer=setTimeout(nextLine,1400);
  }

  // Depends on: addScore, missScore, getCurrentLevel, LEVEL_CONFIG
  var _lastTouchTime6 = 0;
  cv.addEventListener('touchend',function(e){e.preventDefault();
    _lastTouchTime6=Date.now();
    if(!running){startBtn.click();return;}
    var p=getXY(e,e.changedTouches[0]);onTap(p.x,p.y);
  },{passive:false});
  cv.addEventListener('click',function(e){
    if(Date.now()-_lastTouchTime6<500)return;
    if(!running){startBtn.click();return;}
    var p=getXY(e);onTap(p.x,p.y);
  });

  drawIdle();

  startBtn.addEventListener('click',function(){
    running=true;linesDone=0;waitingForNext=false;
    deviationSum=0;deviationCount=0;
    exState.score=0;exState.streak=0;exState.hits=0;exState.misses=0;exState.totalRt=0;
    startBtn.disabled=true;
    setStat('sv-time',TOTAL_LINES);
    nextLine();
  });
}
