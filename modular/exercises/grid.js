// Stroke Sight — Visual Search Grid exercise
// Globals: addScore, missScore, getCurrentLevel, LEVEL_CONFIG, playSpatialCue,
//          t, affectedSide, userCondition, conditionDetail, exState, rnd,
//          getTargetBias, randomInBias, startTimer, endEx, setStat, showFb

// ════════════════════════════════════
// EXERCISE 4 — Visual Search Grid
// ════════════════════════════════════
function exGrid(cv,startBtn){
  var ctx=cv.getContext('2d');
  var running=false;
  var W,H;
  var lvlCfg = LEVEL_CONFIG.grid[getCurrentLevel('grid')-1];
  var COLS=lvlCfg.cols,ROWS=lvlCfg.rows;
  var SYM_SIZE=lvlCfg.symSize;
  var TARGET='★'; // ★
  var syms=['●','■','▲','◆','❖','✚','⬡','⬢','✿','❋'];
  var cellW,cellH;
  var currentGrid=null;

  function buildGrid(){
    var ti;
    if(userCondition==='quadrantanopia'){
      // bias target placement to affected quadrant (70% chance)
      var bias=getTargetBias(W||700, H||380);
      var biasedCells=[];
      for(var c=0;c<COLS*ROWS;c++){
        var col=c%COLS,row=Math.floor(c/COLS);
        // compute notional cell center
        var cx2=(col+0.5)/COLS*(W||700),cy2=26+(row+0.5)/ROWS*((H||380)-26);
        if(cx2>=bias.x_min&&cx2<=bias.x_max&&cy2>=bias.y_min&&cy2<=bias.y_max) biasedCells.push(c);
      }
      if(biasedCells.length>0&&Math.random()<0.70){
        ti=biasedCells[Math.floor(rnd(0,biasedCells.length))];
      }else{
        ti=Math.floor(rnd(0,COLS*ROWS));
      }
    }else{
      ti=Math.floor(rnd(0,COLS*ROWS));
    }
    var cells=[];
    for(var i=0;i<COLS*ROWS;i++)cells.push({sym:i===ti?TARGET:syms[Math.floor(rnd(0,syms.length))],target:i===ti});
    return{cells:cells,ti:ti};
  }

  function drawGrid(gd,reveal){
    W=cv.width;H=cv.height;
    cellW=W/COLS;cellH=(H-26)/ROWS;
    ctx.fillStyle='#081210';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='rgba(255,255,255,0.1)';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.textBaseline='alphabetic';
    ctx.fillText(affectedSide==='left'?t('canvas_grid_instr_ltr'):t('canvas_grid_instr_rtl'),W/2,18);
    ctx.font='bold '+SYM_SIZE+'px sans-serif';ctx.textBaseline='middle';
    gd.cells.forEach(function(cell,i){
      var col=i%COLS,row=Math.floor(i/COLS);
      var x=col*cellW+cellW/2,y=26+row*cellH+cellH/2;
      cell.px=x;cell.py=y;
      if(cell.target){
        if(reveal){
          ctx.fillStyle='rgba(251,191,36,0.22)';
          ctx.beginPath();
          var hs=Math.round(SYM_SIZE*0.85);if(ctx.roundRect)ctx.roundRect(x-hs,y-hs,hs*2,hs*2,8);else ctx.rect(x-hs,y-hs,hs*2,hs*2);
          ctx.fill();
          ctx.fillStyle='#fbbf24';
        }else{ctx.fillStyle='#ffffff';}
      }else{ctx.fillStyle='rgba(255,255,255,0.28)';}
      ctx.fillText(cell.sym,x,y);
    });
  }

  function onTap(mx,my){
    if(!exState.gridOn||!currentGrid)return;
    var hit=null;
    currentGrid.cells.forEach(function(cell){if(Math.hypot(mx-cell.px,my-cell.py)<SYM_SIZE+8){hit=cell;}});
    if(!hit)return;
    if(hit.target){
      clearTimeout(exState.dotTimer);exState.gridOn=false;
      drawGrid(currentGrid,true);
      var rt=Date.now()-exState.shown;
      addScore(rt<3000?4:rt<6000?3:2,rt);
      setTimeout(function(){if(running){newGridWithAudio();}},600);
    }else{missScore();}
  }

  function getXY(e,touch){
    var r=cv.getBoundingClientRect();var sx=cv.width/r.width,sy=cv.height/r.height;
    if(touch)return{x:(touch.clientX-r.left)*sx,y:(touch.clientY-r.top)*sy};
    return{x:(e.clientX-r.left)*sx,y:(e.clientY-r.top)*sy};
  }
  // Depends on: addScore, missScore, getCurrentLevel, LEVEL_CONFIG
  var _lastTouchTime4 = 0;
  cv.addEventListener('touchend',function(e){e.preventDefault();
    _lastTouchTime4=Date.now();
    if(!running){startBtn.click();return;}
    var p=getXY(e,e.changedTouches[0]);onTap(p.x,p.y);
  },{passive:false});
  cv.addEventListener('click',function(e){
    if(Date.now()-_lastTouchTime4<500)return;
    if(!running){startBtn.click();return;}
    var p=getXY(e);onTap(p.x,p.y);
  });

  ctx.fillStyle='#081210';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,0.22)';ctx.font='15px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(affectedSide==='left'?t('canvas_grid_prompt_ltr'):t('canvas_grid_prompt_rtl'),W/2,H/2);

  function newGridWithAudio(){
    currentGrid=buildGrid();
    exState.gridOn=true;exState.shown=Date.now();
    drawGrid(currentGrid,false);
    // Spatial cue from the side the target is on
    if(currentGrid&&currentGrid.ti!==undefined){
      var col=currentGrid.ti%COLS;
      var pan=(col/(COLS-1))*2-1; // -1 left, +1 right
      playSpatialCue(pan,0.7);
    }
  }

  startBtn.addEventListener('click',function(){
    running=true;exState.score=0;exState.streak=0;exState.hits=0;exState.misses=0;exState.totalRt=0;
    startBtn.disabled=true;
    startTimer(function(){running=false;endEx();});
    newGridWithAudio();
  });
}
