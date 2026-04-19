// Stroke Sight — Reading Line Scan exercise
// Globals: addScore, missScore, getCurrentLevel, LEVEL_CONFIG, playSpatialCue,
//          t, affectedSide, userCondition, conditionDetail, exState, rnd,
//          getTargetBias, randomInBias, startTimer, endEx, setStat, showFb

// ════════════════════════════════════
// EXERCISE 2 — Reading Line Scan
// ════════════════════════════════════
function exReading(cv,startBtn){
  var ctx=cv.getContext('2d');
  var running=false;
  var W,H;
  var lvlCfg = LEVEL_CONFIG.reading[getCurrentLevel('reading')-1];
  var WORD_COUNT = lvlCfg.words;
  var FONT_SIZE = lvlCfg.fontSize;
  var TIMEOUT_MS = lvlCfg.timeoutMs;
  var words=WORD_LISTS[currentLang]||WORD_LISTS['en'];
  var fill=WORD_LISTS[currentLang]||WORD_LISTS['en'];
  var currentLine=null;

  function makeLine(){
    var ti=Math.floor(rnd(1,WORD_COUNT-1));
    var line=[];
    for(var i=0;i<WORD_COUNT;i++)line.push({w:i===ti?words[Math.floor(rnd(0,words.length))]:fill[Math.floor(rnd(0,fill.length))],target:i===ti,idx:i});
    return{items:line,ti:ti};
  }

  // Detect RTL mode (e.g. Arabic) — reading direction is right-to-left
  var isRTL = document.documentElement.dir === 'rtl' || document.documentElement.getAttribute('lang') === 'ar';

  function drawScene(ld,reveal){
    W=cv.width;H=cv.height;
    ctx.fillStyle='#081210';ctx.fillRect(0,0,W,H);
    var y=H/2;
    // anchor dot position: for RTL, the anchor (start of line) is on the right;
    // for LTR, anchor is on the left (or right if right-side affected).
    var ancX;
    if(isRTL){
      // In RTL reading, users scan right-to-left; anchor starts on right
      ancX = affectedSide==='right' ? 28 : W-28;
    } else {
      ancX = affectedSide==='left' ? 28 : W-28;
    }
    ctx.beginPath();ctx.arc(ancX,y,11,0,Math.PI*2);ctx.fillStyle='#f87171';ctx.fill();
    ctx.beginPath();ctx.arc(ancX,y,22,0,Math.PI*2);ctx.fillStyle='rgba(248,113,113,0.14)';ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.12)';ctx.font='12px sans-serif';ctx.textAlign='center';
    ctx.textBaseline='alphabetic';
    ctx.fillText(affectedSide==='left'?t('canvas_start_right'):t('canvas_start_left'),ancX,y-30);
    // words — direction depends on affected side AND reading direction (RTL/LTR)
    var sx, sp;
    if(isRTL){
      // RTL: words run right-to-left; mirror relative to affected side
      sx = affectedSide==='right' ? W-60 : 60;
      sp = affectedSide==='right' ? -(W-70)/WORD_COUNT : (W-70)/WORD_COUNT;
    } else {
      sx = affectedSide==='left' ? 60 : W-60;
      sp = affectedSide==='left' ? (W-70)/WORD_COUNT : -(W-70)/WORD_COUNT;
    }
    ctx.textBaseline='middle';
    ld.items.forEach(function(item,i){
      var x=sx+i*sp;
      item.px=x;
      if(item.target){
        ctx.font='bold '+FONT_SIZE+'px sans-serif';
        if(reveal){
          var tw=ctx.measureText(item.w).width;
          ctx.fillStyle='rgba(110,231,183,0.18)';ctx.beginPath();
          if(ctx.roundRect)ctx.roundRect(x-8,y-16,tw+16,32,6);
          else ctx.rect(x-8,y-16,tw+16,32);
          ctx.fill();
          ctx.strokeStyle='#6ee7b7';ctx.lineWidth=1.5;ctx.stroke();
          ctx.fillStyle='#6ee7b7';
        }else{ctx.fillStyle='#f5f5f5';}
      }else{
        ctx.font=(FONT_SIZE-2)+'px sans-serif';ctx.fillStyle='rgba(255,255,255,0.3)';
      }
      ctx.fillText(item.w,x,y);
    });
    exState.tpx=sx+ld.ti*sp;
    ctx.measureText.call(ctx,'');
    ctx.font='bold '+FONT_SIZE+'px sans-serif';
    exState.tpw=ctx.measureText(ld.items[ld.ti].w).width;
    ctx.fillStyle='rgba(255,255,255,0.14)';ctx.font='13px sans-serif';ctx.textAlign='center';
    ctx.textBaseline='alphabetic';
    // Scan instruction: in RTL the effective scan direction is mirrored
    var scanTxt;
    if(isRTL){
      scanTxt = affectedSide==='right' ? t('canvas_scan_left') : t('canvas_scan_right');
    } else {
      scanTxt = affectedSide==='left' ? t('canvas_scan_right') : t('canvas_scan_left');
    }
    ctx.fillText(scanTxt,W/2,y+50);
  }

  function newLine(){
    if(!running)return;
    currentLine=makeLine();exState.lineOn=true;exState.shown=Date.now();
    drawScene(currentLine,false);
    exState.dotTimer=setTimeout(function(){
      if(exState.lineOn){missScore();exState.lineOn=false;}
      if(running)exState.dotTimer=setTimeout(newLine,500);
    },TIMEOUT_MS);
  }

  function onTap(mx,my){
    if(!exState.lineOn||!currentLine)return;
    var cy=H/2;if(Math.abs(my-cy)>35)return;
    if(mx>=exState.tpx-10&&mx<=exState.tpx+exState.tpw+10){
      clearTimeout(exState.dotTimer);exState.lineOn=false;
      drawScene(currentLine,true);
      var rt=Date.now()-exState.shown;
      addScore(rt<1200?3:rt<2200?2:1,rt);
      setTimeout(function(){if(running)newLine();},700);
    }
  }

  function getXY(e,touch){
    var r=cv.getBoundingClientRect();var sx=cv.width/r.width,sy=cv.height/r.height;
    if(touch)return{x:(touch.clientX-r.left)*sx,y:(touch.clientY-r.top)*sy};
    return{x:(e.clientX-r.left)*sx,y:(e.clientY-r.top)*sy};
  }
  // Depends on: addScore, missScore, getCurrentLevel, LEVEL_CONFIG
  var _lastTouchTime2 = 0;
  cv.addEventListener('touchend',function(e){e.preventDefault();
    _lastTouchTime2 = Date.now();
    if(!running){startBtn.click();return;}
    var p=getXY(e,e.changedTouches[0]);onTap(p.x,p.y);
  },{passive:false});
  cv.addEventListener('click',function(e){
    if(Date.now()-_lastTouchTime2<500)return;
    if(!running){startBtn.click();return;}
    var p=getXY(e);onTap(p.x,p.y);
  });

  ctx.fillStyle='#081210';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,0.22)';ctx.font='15px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(affectedSide==='left'?t('canvas_reading_prompt_right'):t('canvas_reading_prompt_left'),W/2,H/2);

  startBtn.addEventListener('click',function(){
    running=true;exState.score=0;exState.streak=0;exState.hits=0;exState.misses=0;exState.totalRt=0;
    startBtn.disabled=true;
    startTimer(function(){running=false;endEx();});
    newLine();
  });
}
