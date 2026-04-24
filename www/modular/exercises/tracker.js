// Stroke Sight — Blind Spot Tracker exercise
// Globals: addScore, missScore, getCurrentLevel, LEVEL_CONFIG, playSpatialCue,
//          t, affectedSide, userCondition, conditionDetail, exState, rnd,
//          getTargetBias, randomInBias, startTimer, endEx, setStat, showFb

// ════════════════════════════════════
// EXERCISE 7 — Blind Spot Tracker (Scotoma)
// ════════════════════════════════════
function exTracker(cv,startBtn){
  var ctx=cv.getContext('2d');
  var running=false;
  var W,H;
  var lvlCfg=LEVEL_CONFIG.tracker[getCurrentLevel('tracker')-1];
  var SPEED=lvlCfg.speed; // pixels per frame (scaled)
  var PASSES=lvlCfg.passes;
  var PATH_TYPE=lvlCfg.pathType;

  var passCount=0;
  var dotState=null; // {x,y,vx,vy,visible,hidden,t}
  var scotomZone=null;
  var inHiddenPhase=false;
  var tapRegistered=false;
  var tapX=0,tapY=0;

  function getXY(e,touch){
    var r=cv.getBoundingClientRect();var sx=cv.width/r.width,sy=cv.height/r.height;
    if(touch)return{x:(touch.clientX-r.left)*sx,y:(touch.clientY-r.top)*sy};
    return{x:(e.clientX-r.left)*sx,y:(e.clientY-r.top)*sy};
  }

  function getScotomZone(){
    // Parse conditionDetail for scotoma position
    var parts=(conditionDetail||'2,2').split(',');
    var sr=parseInt(parts[0])||2,sc=parseInt(parts[1])||2;
    var cx=(sc/4)*W,cy=(sr/4)*H;
    var r=Math.min(W,H)*0.18;
    return{cx:cx,cy:cy,r:r};
  }

  function inZone(x,y,z){
    return Math.hypot(x-z.cx,y-z.cy)<z.r;
  }

  function startPass(){
    if(passCount>=PASSES||!running){running=false;endEx();return;}
    passCount++;
    setStat('sv-streak',passCount);
    inHiddenPhase=false;tapRegistered=false;
    // Choose start and direction
    var fromLeft=Math.random()<0.5;
    var sy=rnd(H*0.15,H*0.85);
    var pathT=PATH_TYPE;
    var vx=fromLeft?SPEED:-SPEED;
    var vy=0;
    if(pathT==='diagonal') vy=(Math.random()<0.5?1:-1)*SPEED*0.4;
    if(pathT==='curved'){dotState={x:fromLeft?0:W,y:sy,vx:vx,vy:vy,t:0,angle:fromLeft?0:Math.PI};}
    else dotState={x:fromLeft?0:W,y:sy,vx:vx,vy:vy,t:0};
  }

  function drawScene(){
    ctx.fillStyle='#081210';ctx.fillRect(0,0,W,H);
    // Scotoma zone indicator (very faint)
    if(scotomZone){
      ctx.beginPath();ctx.arc(scotomZone.cx,scotomZone.cy,scotomZone.r,0,Math.PI*2);
      ctx.fillStyle='rgba(255,60,60,0.06)';ctx.fill();
      ctx.strokeStyle='rgba(255,60,60,0.12)';ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,0.12)';ctx.font='11px sans-serif';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('blind spot',scotomZone.cx,scotomZone.cy);
    }
    // Progress
    ctx.fillStyle='rgba(255,255,255,0.4)';ctx.font='13px sans-serif';
    ctx.textAlign='left';ctx.textBaseline='top';
    ctx.fillText('Pass '+passCount+' of '+PASSES,12,12);

    if(!dotState)return;
    var d=dotState;
    if(!inHiddenPhase||tapRegistered){
      // Draw dot
      var g=ctx.createRadialGradient(d.x,d.y,1,d.x,d.y,16);
      g.addColorStop(0,'#6ee7b7');g.addColorStop(1,'rgba(110,231,183,0)');
      ctx.beginPath();ctx.arc(d.x,d.y,10,0,Math.PI*2);
      ctx.fillStyle='#6ee7b7';ctx.fill();
      ctx.beginPath();ctx.arc(d.x,d.y,16,0,Math.PI*2);
      ctx.fillStyle=g;ctx.fill();
    }
    // Show user tap during hidden phase
    if(inHiddenPhase&&tapRegistered){
      ctx.beginPath();ctx.arc(tapX,tapY,8,0,Math.PI*2);
      ctx.fillStyle='rgba(251,191,36,0.6)';ctx.fill();
    }
  }

  function loop(){
    if(!running)return;
    W=cv.width;H=cv.height;
    if(!scotomZone)scotomZone=getScotomZone();
    if(!dotState){exState.raf=requestAnimationFrame(loop);return;}
    var d=dotState;
    // Move dot
    if(PATH_TYPE==='curved'){
      d.angle+=(d.vx>0?0.02:-0.02);
      d.x+=d.vx;
      d.y=d.y+Math.sin(d.angle*3)*0.8;
    }else{
      d.x+=d.vx;d.y+=d.vy;
    }
    d.t++;
    // Check scotoma entry/exit
    var nowIn=inZone(d.x,d.y,scotomZone);
    if(nowIn&&!inHiddenPhase){
      inHiddenPhase=true;tapRegistered=false;
    }
    if(!nowIn&&inHiddenPhase){
      // Dot exited scotoma — score the tap if registered
      inHiddenPhase=false;
      if(tapRegistered){
        var dist=Math.hypot(tapX-d.x,tapY-d.y);
        var pts=dist<40?4:dist<80?3:dist<140?2:1;
        addScore(pts,0);
      }else{
        missScore();
      }
    }
    // Dot left canvas
    if(d.x<-20||d.x>W+20||d.y<-20||d.y>H+20){
      if(inHiddenPhase){
        if(!tapRegistered)missScore();
        inHiddenPhase=false;
      }
      dotState=null;
      exState.dotTimer=setTimeout(startPass,700);
    }
    drawScene();
    exState.raf=requestAnimationFrame(loop);
  }

  function onTap(mx,my){
    if(!running)return;
    if(inHiddenPhase&&!tapRegistered){
      tapRegistered=true;tapX=mx;tapY=my;
    }
  }

  // Depends on: addScore, missScore, getCurrentLevel, LEVEL_CONFIG
  var _lastTouchTime7 = 0;
  cv.addEventListener('touchend',function(e){e.preventDefault();
    _lastTouchTime7=Date.now();
    if(!running){startBtn.click();return;}
    var p=getXY(e,e.changedTouches[0]);onTap(p.x,p.y);
  },{passive:false});
  cv.addEventListener('click',function(e){
    if(Date.now()-_lastTouchTime7<500)return;
    if(!running){startBtn.click();return;}
    var p=getXY(e);onTap(p.x,p.y);
  });

  W=cv.width;H=cv.height;
  ctx.fillStyle='#081210';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,0.2)';ctx.font='15px sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('Watch the dot — tap when it enters your blind spot',W/2,H/2);

  startBtn.addEventListener('click',function(){
    running=true;passCount=0;
    exState.score=0;exState.streak=0;exState.hits=0;exState.misses=0;exState.totalRt=0;
    startBtn.disabled=true;
    W=cv.width;H=cv.height;
    scotomZone=getScotomZone();
    startPass();
    exState.raf=requestAnimationFrame(loop);
  });
}
