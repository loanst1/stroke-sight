// Stroke Sight Lite — Core application logic
// Depends on: config.js (LEVEL_CONFIG, EXERCISES, BENCHMARKS, EX_META, CHART_COLORS, ALL_EX_IDS)
//             strings/*.js (STRINGS, WORD_LISTS)
//             audio.js (getAudioCtx, playSpatialCue)
//             exercises/*.js (exAnchor, exReading, etc.)
//
// LITE-SPECIFIC OVERRIDES:
//   - getCurrentLevel() capped at 3
//   - checkLevelUp() shows upgrade prompt after 6 sessions over 3 days at max level
//   - showUpgradePrompt() / setUpgradeLink()
//   - DB_NAME = 'StrokeSightLiteDB'

var _ls;
try { _ls = window.localStorage; } catch(e) { _ls = { getItem:function(){return null;}, setItem:function(){}, removeItem:function(){} }; }

// ── Global error boundary ──
var _errorLog = JSON.parse(_ls.getItem('strokeSight_errorLog') || '[]');
window.addEventListener('error', function(e) {
  _errorLog.push({
    time: new Date().toISOString(),
    msg: e.message,
    src: (e.filename || '').split('/').pop(),
    line: e.lineno
  });
  if (_errorLog.length > 20) _errorLog = _errorLog.slice(-20);
  _ls.setItem('strokeSight_errorLog', JSON.stringify(_errorLog));
});

var currentLang = _ls.getItem('strokeSight_lang') || 'en';

// ── Level state — persisted in localStorage ──
var exLevels = JSON.parse(_ls.getItem('strokeSight_levels')||'{}'); 
ALL_EX_IDS.forEach(function(id){if(!exLevels[id])exLevels[id]=1;});

var exAutoAdvance = JSON.parse(_ls.getItem('strokeSight_auto')||'{}'); 
ALL_EX_IDS.forEach(function(id){if(exAutoAdvance[id]===undefined)exAutoAdvance[id]=true;});

function saveLevels(){_ls.setItem('strokeSight_levels',JSON.stringify(exLevels));}
function saveAutoAdvance(){_ls.setItem('strokeSight_auto',JSON.stringify(exAutoAdvance));}
function saveSetting(key,val){_ls.setItem('strokeSight_'+key,JSON.stringify(val));}
function loadSetting(key,def){var v=_ls.getItem('strokeSight_'+key);return v!==null?JSON.parse(v):def;}

// LITE: getCurrentLevel capped at 3
function getCurrentLevel(exId){var raw=Math.max(1,Math.min(10,exLevels[exId]||1));return Math.min(raw,3);}

// LITE: upgrade prompt helpers
(function setUpgradeLink() {
  var link = document.getElementById('upgradeLink');
  if (!link) return;
  var ua = navigator.userAgent;
  var url;
  if (/iPad|iPhone|iPod/.test(ua)) {
    url = 'https://ansteyapps.com/stroke-sight/';
  } else if (/Android/.test(ua)) {
    url = 'https://ansteyapps.com/stroke-sight/';
  } else if (/Silk|Kindle/.test(ua)) {
    url = 'https://www.amazon.co.uk/Stroke-Sight-Visual-Field-Trainer/dp/B0GXGRMB2L/';
  } else {
    url = 'https://ansteyapps.com/stroke-sight/';
  }
  link.href = url;
  link.target = '_blank';
})();

function showUpgradePrompt() {
  var overlay = document.getElementById('upgradeOverlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  // Apply current language to overlay text
  var s = STRINGS[currentLang] || STRINGS.en;
  var els = overlay.querySelectorAll('[data-i18n]');
  els.forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    if (s[key]) el.textContent = s[key];
  });
}

// LITE: checkLevelUp — cap at 3, show upgrade prompt when at max and qualifying
function checkLevelUp(exId) {
  if (!exAutoAdvance[exId]) return false;
  var lvl = getCurrentLevel(exId);
  // Lite version: cap at level 3
  if (lvl >= 3) {
    // Check if they would have levelled up; if so show the upgrade prompt
    // Tighter trigger: 6 sessions over 3 distinct days
    var exSessions = sessions.filter(function(s){return s.exerciseId===exId;});
    if (exSessions.length >= 6) {
      var last6 = exSessions.slice(0, 6);
      var thresholds = [0,14,14,14,15,15,15,16,16,16,17];
      var threshold = thresholds[lvl] || 15;
      var avgScore = last6.reduce(function(a,s){return a+s.score;},0) / 6;
      var dayKeys = new Set(last6.map(function(s){
        return new Date(s.date).toISOString().slice(0,10);
      }));
      if (avgScore >= threshold && dayKeys.size >= 3) {
        var hasShown = localStorage.getItem('strokeSight_upgradeShown_' + exId);
        if (!hasShown) {
          localStorage.setItem('strokeSight_upgradeShown_' + exId, '1');
          showUpgradePrompt();
        }
      }
    }
    return false;
  }
  var exSessions = sessions.filter(function(s){return s.exerciseId===exId;});
  if (exSessions.length < 3) return false;
  var last3 = exSessions.slice(0, 3);
  var thresholds = [0,14,14,14,15,15,15,16,16,16,17];
  var threshold = thresholds[lvl] || 15;
  var avgScore = last3.reduce(function(a,s){return a+s.score;},0) / 3;
  if (avgScore >= threshold) {
    exLevels[exId] = lvl + 1;
    saveLevels();
    return true;
  }
  return false;
}


function t(key) {
  return (STRINGS[currentLang] && STRINGS[currentLang][key]) || (STRINGS['en'] && STRINGS['en'][key]) || key;
}

// ── Theme toggle ──
(function(){
  const btn=document.getElementById('theme-btn'),ico=document.getElementById('theme-ico'),h=document.documentElement;
  const sunSVG='<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>';
  const moonSVG='<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  let dark=window.matchMedia('(prefers-color-scheme:dark)').matches;
  function apply(){h.setAttribute('data-theme',dark?'dark':'light');ico.innerHTML=dark?sunSVG:moonSVG;}
  apply();
  btn.addEventListener('click',function(){dark=!dark;apply();});
})();

// ── IndexedDB layer ── (LITE uses StrokeSightLiteDB)
var DB_NAME='StrokeSightLiteDB';
var DB_VERSION=1;
var STORE_NAME='sessions';
var db=null;
var sessions=[];
var affectedSide = _ls.getItem('strokeSight_affectedSide') || 'left';
var userCondition = _ls.getItem('strokeSight_condition') || 'hemianopia';
var conditionDetail = _ls.getItem('strokeSight_conditionDetail') || 'left';

function saveCondition(){
  _ls.setItem('strokeSight_condition', userCondition);
  _ls.setItem('strokeSight_conditionDetail', conditionDetail);
  // Keep affectedSide in sync for backward compat
  if(userCondition==='hemianopia'||userCondition==='neglect'){
    affectedSide = (conditionDetail==='right')?'right':'left';
    _ls.setItem('strokeSight_affectedSide', affectedSide);
  } else if(userCondition==='quadrantanopia'){
    affectedSide = (conditionDetail==='UR'||conditionDetail==='LR')?'right':'left';
    _ls.setItem('strokeSight_affectedSide', affectedSide);
  }
}

// Helper: return target placement bias zone based on current condition
function getTargetBias(W, H){
  var half={x_min:0,x_max:W,y_min:0,y_max:H};
  if(userCondition==='hemianopia'||userCondition==='neglect'){
    if(affectedSide==='left')  return{x_min:0,      x_max:W*0.5, y_min:0, y_max:H};
    else                        return{x_min:W*0.5,  x_max:W,     y_min:0, y_max:H};
  }
  if(userCondition==='quadrantanopia'){
    var xL=(conditionDetail==='UL'||conditionDetail==='LL');
    var yT=(conditionDetail==='UL'||conditionDetail==='UR');
    return{
      x_min:xL?0:W*0.5, x_max:xL?W*0.5:W,
      y_min:yT?0:H*0.5, y_max:yT?H*0.5:H
    };
  }
  if(userCondition==='scotoma'){
    // Scotoma detail is "R,C" grid position (row,col) on 5x5 grid
    var parts=(conditionDetail||'2,2').split(',');
    var sr=parseInt(parts[0])||2, sc=parseInt(parts[1])||2;
    var cx=(sc/4)*W, cy=(sr/4)*H;
    var r=Math.min(W,H)*0.25;
    return{x_min:Math.max(0,cx-r),x_max:Math.min(W,cx+r),y_min:Math.max(0,cy-r),y_max:Math.min(H,cy+r)};
  }
  return half;
}

function randomInBias(bias,margin){
  var m=margin||0;
  var x=bias.x_min+m+Math.random()*Math.max(1,(bias.x_max-bias.x_min-m*2));
  var y=bias.y_min+m+Math.random()*Math.max(1,(bias.y_max-bias.y_min-m*2));
  return{x:x,y:y};
}

function openDB(callback){
  var req=self['indexedD'+'B'].open(DB_NAME,DB_VERSION);
  req.onupgradeneeded=function(e){
    var d=e.target.result;
    if(!d.objectStoreNames.contains(STORE_NAME)){
      var store=d.createObjectStore(STORE_NAME,{keyPath:'id',autoIncrement:true});
      store.createIndex('exerciseId','exerciseId',{unique:false});
      store.createIndex('date','date',{unique:false});
    }
  };
  req.onsuccess=function(e){
    db=e.target.result;
    if(callback)callback();
  };
  req.onerror=function(){
    console.warn('IndexedDB unavailable, using in-memory only');
    if(callback)callback();
  };
}

function loadAllSessions(callback){
  if(!db){callback();return;}
  var tx=db.transaction(STORE_NAME,'readonly');
  var store=tx.objectStore(STORE_NAME);
  var req=store.getAll();
  req.onsuccess=function(){
    var all=req.result||[];
    // Sort by date descending (newest first)
    all.sort(function(a,b){return new Date(b.date)-new Date(a.date);});
    sessions=all;
    callback();
  };
  req.onerror=function(){callback();};
}

function saveSessionToDB(session,callback){
  if(!db){if(callback)callback();return;}
  var tx=db.transaction(STORE_NAME,'readwrite');
  var store=tx.objectStore(STORE_NAME);
  store.add(session);
  tx.oncomplete=function(){if(callback)callback();};
  tx.onerror=function(){if(callback)callback();};
}

function clearAllData(callback){
  if(!db){sessions=[];if(callback)callback();return;}
  var tx=db.transaction(STORE_NAME,'readwrite');
  var store=tx.objectStore(STORE_NAME);
  store.clear();
  tx.oncomplete=function(){sessions=[];if(callback)callback();};
  tx.onerror=function(){if(callback)callback();};
}

// ── Boot ──
openDB(function(){
  loadAllSessions(function(){
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initApp);
    } else {
      initApp();
    }
  });
});

function initApp(){
// ── Screen navigation ──
function showScreen(id){
  document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});
  document.getElementById('screen-'+id).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(function(b){b.classList.remove('active');});
  var nb=document.getElementById('nav-'+id);
  if(nb)nb.classList.add('active');
  // Restore nav bar when leaving exercise screen
  var _nav=document.querySelector('.bottom-nav');
  if(_nav)_nav.style.display='';
  if(id==='progress')renderProgress();
  if(id==='settings')renderSettings();
}
document.getElementById('nav-home').addEventListener('click',function(){showScreen('home');});
document.getElementById('nav-progress').addEventListener('click',function(){showScreen('progress');});
document.getElementById('nav-about').addEventListener('click',function(){showScreen('about');});
document.getElementById('nav-settings').addEventListener('click',function(){showScreen('settings');});
document.getElementById('btn-back').addEventListener('click',function(){stopEx();showScreen('home');});

// ── Clear data button ──
document.getElementById('btn-clear-data').addEventListener('click',function(){
  if(confirm(t('confirm_clear'))){
    clearAllData(function(){renderProgress();});
  }
});

// ── Condition Picker ──
var COND_IDS=['hemianopia','quadrantanopia','neglect','scotoma'];

function renderCondSubArea(){
  var area=document.getElementById('cond-sub-area');
  if(!area)return;
  var html='';
  if(userCondition==='hemianopia'||userCondition==='neglect'){
    html='<div class="cond-sub"><div class="cond-sub-label">'+t('cond_pick_side')+'</div>';
    html+='<div class="cond-sub-btns">';
    html+='<button class="cond-sub-btn'+(conditionDetail==='left'?' active':'')+'" id="sub-left">'+ t('side_left')+'</button>';
    html+='<button class="cond-sub-btn'+(conditionDetail==='right'?' active':'')+'" id="sub-right">'+ t('side_right')+'</button>';
    html+='</div></div>';
  } else if(userCondition==='quadrantanopia'){
    html='<div class="cond-sub"><div class="cond-sub-label">'+t('cond_pick_quadrant')+'</div>';
    html+='<div class="cond-quad-grid">';
    ['UL','UR','LL','LR'].forEach(function(q){
      html+='<button class="cond-sub-btn'+(conditionDetail===q?' active':'')+'" data-q="'+ q +'">'+t('quad_'+q)+'</button>';
    });
    html+='</div></div>';
  } else if(userCondition==='scotoma'){
    html='<div class="cond-sub cond-scotoma-wrap">';
    html+='<div class="cond-sub-label">'+t('cond_pick_scotoma')+'</div>';
    html+='<div class="cond-scotoma-grid" style="grid-template-columns:repeat(5,28px)" id="scotoma-grid">';
    for(var sr=0;sr<5;sr++){
      for(var sc=0;sc<5;sc++){
        var key=sr+','+sc;
        html+='<div class="cond-scotoma-cell'+(conditionDetail===key?' active':'')+'" data-pos="'+key+'"></div>';
      }
    }
    html+='</div>';
    html+='<div class="cond-scotoma-hint">'+t('cond_pick_scotoma')+'</div>';
    html+='</div>';
  }
  area.innerHTML=html;
  // Wire sub-buttons
  if(userCondition==='hemianopia'||userCondition==='neglect'){
    var bl=area.querySelector('#sub-left'),br=area.querySelector('#sub-right');
    if(bl)bl.addEventListener('click',function(){conditionDetail='left';saveCondition();renderCondSubArea();rebuildHomeCards();});
    if(br)br.addEventListener('click',function(){conditionDetail='right';saveCondition();renderCondSubArea();rebuildHomeCards();});
  } else if(userCondition==='quadrantanopia'){
    area.querySelectorAll('[data-q]').forEach(function(btn){
      btn.addEventListener('click',function(){
        conditionDetail=this.getAttribute('data-q');
        saveCondition();renderCondSubArea();rebuildHomeCards();
      });
    });
  } else if(userCondition==='scotoma'){
    area.querySelectorAll('.cond-scotoma-cell').forEach(function(cell){
      cell.addEventListener('click',function(){
        conditionDetail=this.getAttribute('data-pos');
        saveCondition();
        area.querySelectorAll('.cond-scotoma-cell').forEach(function(c){c.classList.remove('active');});
        this.classList.add('active');
      });
    });
  }
  // Update settings label
  var lbl=document.getElementById('settings-cond-label');
  if(lbl) lbl.textContent=t('cond_'+userCondition)+' ('+conditionDetail+')';
}

function setCondition(cond){
  userCondition=cond;
  // Set sensible default detail
  if(cond==='hemianopia'||cond==='neglect'){
    if(conditionDetail!=='left'&&conditionDetail!=='right') conditionDetail='left';
  } else if(cond==='quadrantanopia'){
    if(['UL','UR','LL','LR'].indexOf(conditionDetail)<0) conditionDetail='UL';
  } else if(cond==='scotoma'){
    if(!conditionDetail||conditionDetail.indexOf(',')<0) conditionDetail='2,2';
  }
  saveCondition();
  COND_IDS.forEach(function(c){
    var el=document.getElementById('cond-card-'+c);
    if(el)el.classList.toggle('active',c===cond);
  });
  renderCondSubArea();
  rebuildHomeCards();
}

COND_IDS.forEach(function(cond){
  var el=document.getElementById('cond-card-'+cond);
  if(el)el.addEventListener('click',function(){setCondition(cond);});
});


function getExDesc(id){
  var L=affectedSide==='left';
  var descs={
    anchor:t('ex_anchor_desc'),
    reading:t('ex_reading_desc'),
    flicker:t('ex_flicker_desc'),
    grid:L?t('ex_grid_desc_ltr'):t('ex_grid_desc_rtl'),
    pursuit:t('ex_pursuit_desc'),
    bisection:t('ex_bisection_desc'),
    tracker:t('ex_tracker_desc'),
    gapfill:t('ex_gapfill_desc')
  };
  return descs[id]||'';
}

function getExInstr(id){
  var L=affectedSide==='left';
  var instrs={
    anchor:t('ex_anchor_instr'),
    reading:L?t('ex_reading_instr_left'):t('ex_reading_instr_right'),
    flicker:t('ex_flicker_instr'),
    grid:L?t('ex_grid_instr_ltr'):t('ex_grid_instr_rtl'),
    pursuit:t('ex_pursuit_instr'),
    bisection:t('ex_bisection_instr'),
    tracker:t('ex_tracker_instr'),
    gapfill:t('ex_gapfill_instr')
  };
  return instrs[id]||'';
}

// ── Build home cards ──
var icons={
  anchor:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>',
  reading:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  flicker:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>',
  grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>',
  pursuit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5" cy="12" r="3" fill="currentColor" opacity=".7"/><path d="M8 12 Q12 6 16 12 Q20 18 22 12" stroke-linecap="round"/><circle cx="22" cy="12" r="2" fill="currentColor"/></svg>',
  bisection:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>',
  tracker:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5" fill="currentColor" opacity=".3"/><path d="M2 12h4M18 12h4M12 2v4M12 18v4"/><circle cx="12" cy="12" r="10"/></svg>',
  gapfill:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="4" r="2"/><circle cx="20" cy="12" r="2"/><circle cx="12" cy="20" r="2"/><circle cx="4" cy="12" r="2"/><circle cx="12" cy="12" r="3" stroke-dasharray="4 2"/></svg>'
};

function rebuildHomeCards(){
  // Sync condition card active states
  COND_IDS.forEach(function(c){
    var el=document.getElementById('cond-card-'+c);
    if(el)el.classList.toggle('active',c===userCondition);
  });
  var g=document.getElementById('ex-grid');
  g.innerHTML='';
  EXERCISES.forEach(function(ex){
    var visible=ex.conds.indexOf(userCondition)>=0;
    var btn=document.createElement('button');
    btn.className='ex-card'+(visible?'':' exercise-card-hidden');
    btn.setAttribute('aria-label',t('ex_'+ex.id+'_name'));
    var lvl = getCurrentLevel(ex.id);
    var lvlBar = '';
    // LITE: show 10 pips but only first 3 are reachable
    for(var i=1;i<=10;i++) lvlBar += '<span class="lvl-pip'+(i<=lvl?' filled':'')+'"></span>';
    btn.innerHTML='<div class="ex-top"><span class="badge '+ex.bc+'">'+t('ex_'+ex.id+'_badge')+'</span><div class="ex-ico">'+icons[ex.id]+'</div></div><h3>'+t('ex_'+ex.id+'_name')+'</h3>'
      + '<div class="lvl-row"><span class="lvl-label">Level '+lvl+'</span><div class="lvl-pips">'+lvlBar+'</div></div>'
      + '<p>'+getExDesc(ex.id)+'</p>';
    btn.addEventListener('click',function(){startExercise(ex.id);});
    g.appendChild(btn);
  });
}
// Init condition picker with saved state
setCondition(userCondition);

// ── i18n runtime ──
function setLang(lang){
  currentLang=lang;
  _ls.setItem('strokeSight_lang',lang);
  document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  document.getElementById('lang-select').value=lang;
  updateI18nDOM();
  rebuildHomeCards();
  if(document.querySelector('.screen#screen-progress.active')||
     document.getElementById('nav-progress').classList.contains('active')){
    renderProgress();
  }
}

function updateI18nDOM(){
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    var key=el.getAttribute('data-i18n');
    if(el.tagName==='INPUT'){el.placeholder=t(key);}
    else{el.textContent=t(key);}
  });
  document.querySelectorAll('[data-i18n-html]').forEach(function(el){
    var key=el.getAttribute('data-i18n-html');
    if(key==='notice_body_full'){
      el.innerHTML='<strong>'+t('notice_title')+'</strong> '+t('notice_body');
    }else if(key==='privacy_short_body_full'){
      el.innerHTML='<strong>'+t('privacy_short_body').split('.')[0]+'.</strong>'+t('privacy_short_body').substring(t('privacy_short_body').indexOf('.')+1);
    }else{
      el.innerHTML=t(key);
    }
  });
}

document.getElementById('lang-select').addEventListener('change',function(){
  setLang(this.value);
});

setLang(currentLang);


// ── Session storage (IndexedDB-backed, in-memory mirror) ──
var currentEx=null;
var exState={};

// ── Helpers ──
function rnd(a,b){return Math.random()*(b-a)+a;}
function setStat(id,v){var el=document.getElementById(id);if(el)el.textContent=v;}
function showFb(msg,good){
  var el=document.getElementById('ex-fb');
  if(!el)return;
  el.textContent=msg;el.className='feedback '+(good?'fb-good':'fb-bad');
  clearTimeout(exState.fbTimer);
  exState.fbTimer=setTimeout(function(){if(el)el.textContent='';el&&(el.className='feedback');},800);
}
function addScore(pts,rt){
  exState.score=(exState.score||0)+pts;
  exState.streak=(exState.streak||0)+1;
  exState.hits=(exState.hits||0)+1;
  exState.totalRt=(exState.totalRt||0)+(rt||0);
  setStat('sv-score',exState.score);
  setStat('sv-streak',exState.streak);
  showFb('+'+pts+' pts',true);
}
function missScore(){
  exState.streak=0;exState.misses=(exState.misses||0)+1;
  setStat('sv-streak',0);
  showFb('Missed',false);
}
function stopEx(){
  if(exState.raf)cancelAnimationFrame(exState.raf);
  if(exState.timer)clearTimeout(exState.timer);
  if(exState.dotTimer)clearTimeout(exState.dotTimer);
  if(exState.fbTimer)clearTimeout(exState.fbTimer);
  if(exState.spaceHandler)document.removeEventListener('keydown',exState.spaceHandler);
  exState={};
}
function startTimer(onEnd,secs){
  secs=secs||60;
  var rem=secs;setStat('sv-time',rem);
  function tick(){rem--;setStat('sv-time',rem);if(rem<=0){onEnd();return;}exState.timer=setTimeout(tick,1000);}
  exState.timer=setTimeout(tick,1000);
}
function endEx(){
  stopEx();
  var score=exState&&exState.score||0;
  var hits=exState&&exState.hits||0;
  var misses=exState&&exState.misses||0;
  var totalRt=exState&&exState.totalRt||0;
  var rt=hits>0?Math.round(totalRt/hits):0;
  var accuracy=(hits+misses)>0?Math.round((hits/(hits+misses))*100):0;
  var now=new Date();
  var exerciseId=currentEx?currentEx.id:'anchor';
  var sessionObj={
    exerciseId:exerciseId,
    name:currentEx?t('ex_'+currentEx.id+'_name'):'Exercise',
    score:score,
    hits:hits,
    misses:misses,
    totalRt:totalRt,
    rt:rt,
    accuracy:accuracy,
    date:now.toISOString(),
    dateLabel:now.toLocaleDateString('en-GB',{day:'numeric',month:'short'}),
    timeLabel:now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})
  };
  sessions.unshift(sessionObj);
  saveSessionToDB(sessionObj);
  showFb('Done! Score: '+score,true);
  var btn=document.getElementById('ex-startbtn');
  if(btn){btn.textContent='Play Again';btn.disabled=false;}
  var _endExId = exerciseId;
  var didLevelUp = checkLevelUp(_endExId);
  if (didLevelUp) {
    var newLvl = getCurrentLevel(_endExId);
    showLevelUp(_endExId, newLvl, function(){ showScreen('home'); });
  }
}

// ── Session restore on interruption ──
document.addEventListener('visibilitychange', function() {
  if (document.hidden && typeof exState !== 'undefined' && exState.running) {
    // Save minimal state when app goes to background mid-exercise
    _ls.setItem('strokeSight_pausedEx', JSON.stringify({
      exerciseId: (currentEx && currentEx.id) || '',
      score: exState.score || 0,
      streak: exState.streak || 0,
      time: Date.now()
    }));
  } else if (!document.hidden) {
    // Returning from background — check for a recently-interrupted session
    var paused = JSON.parse(_ls.getItem('strokeSight_pausedEx') || 'null');
    if (paused && Date.now() - paused.time < 300000) {
      // Session was interrupted less than 5 minutes ago — notify user
      _ls.removeItem('strokeSight_pausedEx');
      showFb('Session interrupted. Your progress was saved.', true);
    }
  }
});

// ── Start exercise ──
function startExercise(id){
  stopEx();
  currentEx=EXERCISES.find(function(e){return e.id===id;});
  if(!currentEx)return;
  document.getElementById('ex-title').textContent=t('ex_'+currentEx.id+'_name');
  // Remove old level badge if any
  var oldBadge=document.querySelector('.ex-level-badge');if(oldBadge)oldBadge.remove();
  var lvlBadge=document.createElement('span');lvlBadge.className='ex-level-badge';
  lvlBadge.textContent='Level '+getCurrentLevel(currentEx.id);
  document.querySelector('.ex-header').appendChild(lvlBadge);
  showScreen('exercise');
  buildExUI(id);
}

function buildExUI(id){
  var body=document.getElementById('ex-body');
  body.innerHTML='';

  var instr=document.createElement('div');
  instr.className='instr';instr.innerHTML=getExInstr(currentEx.id);
  body.appendChild(instr);

  var sr=document.createElement('div');sr.className='stats-row';
  sr.innerHTML='<div class="s-box"><div class="s-num" id="sv-score">0</div><div class="s-lbl">Score</div></div>'+
    '<div class="s-box"><div class="s-num" id="sv-streak">0</div><div class="s-lbl">Streak</div></div>'+
    '<div class="s-box"><div class="s-num" id="sv-time">60</div><div class="s-lbl">Seconds</div></div>';
  body.appendChild(sr);

  var fb=document.createElement('div');fb.className='feedback';fb.id='ex-fb';
  body.appendChild(fb);

  var wrap=document.createElement('div');wrap.className='canvas-wrap';
  var cv=document.createElement('canvas');
var _vw=window.innerWidth,_vh=window.innerHeight;
if(_vw>=768 && _vh>=500){
  // Desktop/laptop layout
  var _ch=Math.max(Math.round(_vh*0.65),360);
  var _cw=Math.min(Math.round(_vw*0.80),Math.round(_ch*2));
  var _nav=document.querySelector('.bottom-nav');
  if(_nav)_nav.style.display='none';
  cv.width=_cw;cv.height=_ch;
  cv.style.cssText='width:'+_cw+'px!important;height:'+_ch+'px!important;display:block;touch-action:none';
  wrap.style.cssText='width:'+_cw+'px;max-width:none;height:'+_ch+'px;margin:0.25rem auto;overflow:hidden;background:#081210;border-radius:16px';
}else if(_vw>=600 && _vh<500){
  // Phone landscape
  cv.width=Math.round(_vw*0.7);cv.height=Math.round(_vh*0.55);
  cv.style.cssText='width:'+cv.width+'px!important;height:'+cv.height+'px!important;display:block;touch-action:none';
  wrap.style.cssText='width:'+cv.width+'px;max-width:none;height:'+cv.height+'px;margin:0.15rem auto;overflow:hidden;background:#081210;border-radius:12px';
  var _nav=document.querySelector('.bottom-nav');
  if(_nav)_nav.style.display='none';
}else{cv.width=700;cv.height=380;}
  cv.setAttribute('aria-label',(t('ex_'+currentEx.id+'_name')||currentEx.id)+' exercise area');
  wrap.appendChild(cv);body.appendChild(wrap);

  // Resize canvas on orientation change
  var _resizeTimer;
  window.addEventListener('resize',function(){
    clearTimeout(_resizeTimer);
    _resizeTimer=setTimeout(function(){
      var nw=window.innerWidth,nh=window.innerHeight;
      // Only act if dimensions changed significantly (rotation)
      if(Math.abs(nw-_vw)>100||Math.abs(nh-_vh)>100){
        _vw=nw;_vh=nh;
        var newW,newH;
        if(nw>=768&&nh>=500){
          newH=Math.max(Math.round(nh*0.65),360);
          newW=Math.min(Math.round(nw*0.80),Math.round(newH*2));
          var nav=document.querySelector('.bottom-nav');if(nav)nav.style.display='none';
        }else if(nw>=600&&nh<500){
          newW=Math.round(nw*0.7);newH=Math.round(nh*0.55);
          var nav=document.querySelector('.bottom-nav');if(nav)nav.style.display='none';
        }else{
          newW=700;newH=380;
          var nav=document.querySelector('.bottom-nav');if(nav)nav.style.display='';
        }
        cv.width=newW;cv.height=newH;
        if(nw>=600){
          cv.style.cssText='width:'+newW+'px!important;height:'+newH+'px!important;display:block;touch-action:none';
          wrap.style.cssText='width:'+newW+'px;max-width:none;height:'+newH+'px;margin:0.25rem auto;overflow:hidden;background:#081210;border-radius:16px';
        }else{
          cv.style.cssText='';wrap.style.cssText='';
        }
      }
    },250);
  });

  var ctrl=document.createElement('div');ctrl.className='controls';
  var startBtn=document.createElement('button');startBtn.className='btn-start';
  startBtn.textContent='Begin Exercise';startBtn.id='ex-startbtn';
  ctrl.appendChild(startBtn);body.appendChild(ctrl);

  // Warm up AudioContext on first user gesture (iOS Safari requirement)
  startBtn.addEventListener('click', function() {
    try { getAudioCtx(); } catch(e) {}
  }, {once: true});

  var fns={anchor:exAnchor,reading:exReading,flicker:exFlicker,grid:exGrid,
            pursuit:exPursuit,bisection:exBisection,tracker:exTracker,gapfill:exGapfill};
  if(fns[id])fns[id](cv,startBtn);

  // Safety warning overlay — shown once per install on first exercise launch
  if(!_ls.getItem('strokeSight_safetyWarningShown')){
    _ls.setItem('strokeSight_safetyWarningShown','1');
    var _swCtx=cv.getContext('2d');
    var _swW=cv.width,_swH=cv.height;
    var _swText=t('safety_warning');
    var _swAlpha=0;
    var _swStart=Date.now();
    var _swDuration=3000;
    function _drawSafetyWarning(){
      var elapsed=Date.now()-_swStart;
      if(elapsed>_swDuration)return;
      var fadeIn=Math.min(elapsed/400,1);
      var fadeOut=elapsed>2600?Math.max(1-(elapsed-2600)/400,0):1;
      _swAlpha=fadeIn*fadeOut*0.88;
      _swCtx.save();
      _swCtx.globalAlpha=_swAlpha;
      _swCtx.fillStyle='rgba(30,20,0,0.92)';
      var pad=24,lineH=20,maxW=_swW-pad*2;
      _swCtx.font='13px sans-serif';
      // Word-wrap
      var words=_swText.split(' '),lines=[],cur='';
      for(var wi=0;wi<words.length;wi++){var test=(cur?cur+' ':'')+words[wi];if(_swCtx.measureText(test).width>maxW&&cur){lines.push(cur);cur=words[wi];}else cur=test;}
      if(cur)lines.push(cur);
      var bH=lines.length*lineH+pad*2;
      var bY=_swH/2-bH/2;
      _swCtx.beginPath();_swCtx.roundRect(pad,bY,maxW,bH,10);_swCtx.fill();
      _swCtx.globalAlpha=_swAlpha;
      _swCtx.fillStyle='#fbbf24';_swCtx.textAlign='center';_swCtx.textBaseline='top';
      for(var li=0;li<lines.length;li++)_swCtx.fillText(lines[li],_swW/2,bY+pad+li*lineH);
      _swCtx.restore();
      requestAnimationFrame(_drawSafetyWarning);
    }
    requestAnimationFrame(_drawSafetyWarning);
  }
}



function infoIcon(){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
}

function deltaHTML(earlyArr,recentArr,field,unit,lowerIsBetter){
  if(earlyArr.length<3||recentArr.length<3) return '<span class="bench-flat">— insufficient data</span>';
  var earlyAvg=earlyArr.reduce(function(a,s){return a+s[field];},0)/earlyArr.length;
  var recentAvg=recentArr.reduce(function(a,s){return a+s[field];},0)/recentArr.length;
  var diff=Math.round(recentAvg-earlyAvg);
  if(diff===0) return '<span class="bench-flat">— no change</span>';
  var improved=lowerIsBetter?(diff<0):(diff>0);
  var cls=improved?'bench-up':'bench-down';
  var arrow=improved?'↑':'↓';
  var sign=diff>0?'+':'';
  return '<span class="bench-delta-item '+cls+'">'+arrow+' '+sign+diff+(unit||'')+'</span>';
}


function renderProgressChart() {
  var chartCard = document.getElementById('chart-card');
  var chartEmpty = document.getElementById('chart-empty');
  var canvas = document.getElementById('progress-chart');
  var legend = document.getElementById('chart-legend');
  
  if (sessions.length < 2) {
    chartCard.style.display = 'block';
    canvas.style.display = 'none';
    legend.style.display = 'none';
    chartEmpty.style.display = 'block';
    return;
  }
  
  chartCard.style.display = 'block';
  canvas.style.display = 'block';
  legend.style.display = 'flex';
  chartEmpty.style.display = 'none';
  
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var rect = canvas.parentElement.getBoundingClientRect();
  var W = rect.width - 32; // account for card padding
  var H = 220;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);
  
  // Chart area with margins
  var ml = 40, mr = 15, mt = 10, mb = 30;
  var cw = W - ml - mr;
  var ch = H - mt - mb;
  
  // Get computed styles for theming
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  var gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  var textColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)';
  var refGreen = isDark ? 'rgba(46,158,147,0.35)' : 'rgba(46,158,147,0.25)';
  var refAmber = isDark ? 'rgba(232,148,58,0.35)' : 'rgba(232,148,58,0.25)';
  
  ctx.clearRect(0, 0, W, H);
  
  // All sessions chronological (oldest first)
  var allChron = sessions.slice().reverse();
  
  // Find max score across all sessions for y-axis scaling
  var maxScore = Math.max.apply(null, allChron.map(function(s){ return s.score; }));
  maxScore = Math.max(maxScore, 25); // minimum y-axis top of 25
  
  // Y-axis grid lines and labels
  ctx.font = '11px sans-serif';
  ctx.fillStyle = textColor;
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  
  var ySteps = [0, Math.round(maxScore*0.25), Math.round(maxScore*0.5), Math.round(maxScore*0.75), maxScore];
  ySteps.forEach(function(v) {
    var y = mt + ch - (v / maxScore) * ch;
    ctx.beginPath();
    ctx.moveTo(ml, y);
    ctx.lineTo(ml + cw, y);
    ctx.stroke();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(v, ml - 6, y);
  });
  
  // Reference lines at 80% and 50% of maxScore
  var y80 = mt + ch - (0.8 * maxScore / maxScore) * ch;
  ctx.strokeStyle = refGreen;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(ml, y80);
  ctx.lineTo(ml + cw, y80);
  ctx.stroke();
  ctx.fillStyle = refGreen;
  ctx.textAlign = 'left';
  ctx.font = '10px sans-serif';
  ctx.fillText('80% Strong', ml + cw - 60, y80 - 6);
  
  var y50 = mt + ch - (0.5 * maxScore / maxScore) * ch;
  ctx.strokeStyle = refAmber;
  ctx.beginPath();
  ctx.moveTo(ml, y50);
  ctx.lineTo(ml + cw, y50);
  ctx.stroke();
  ctx.fillStyle = refAmber;
  ctx.fillText('50% Developing', ml + cw - 80, y50 - 6);
  ctx.setLineDash([]);
  
  // Group sessions by exercise
  var exIds = ALL_EX_IDS;
  var exNames = {};
  exIds.forEach(function(id) { exNames[id] = t('ex_'+id+'_name'); });
  
  // X-axis: based on all sessions chronologically
  var totalSessions = allChron.length;
  
  // Draw each exercise line
  exIds.forEach(function(exId) {
    var exSessions = [];
    var sessionIndices = [];
    allChron.forEach(function(s, i) {
      if (s.exerciseId === exId) {
        exSessions.push(s);
        sessionIndices.push(i);
      }
    });
    if (exSessions.length < 1) return;
    
    var color = CHART_COLORS[exId];
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    
    sessionIndices.forEach(function(gi, i) {
      var x = ml + (totalSessions > 1 ? (gi / (totalSessions - 1)) * cw : cw / 2);
      var y = mt + ch - (exSessions[i].score / maxScore) * ch;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Draw dots on each data point
    sessionIndices.forEach(function(gi, i) {
      var x = ml + (totalSessions > 1 ? (gi / (totalSessions - 1)) * cw : cw / 2);
      var y = mt + ch - (exSessions[i].score / maxScore) * ch;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
  });
  
  // X-axis labels (first and last session dates)
  ctx.font = '10px sans-serif';
  ctx.fillStyle = textColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  if (allChron.length > 0) {
    ctx.fillText(allChron[0].dateLabel || '', ml, mt + ch + 8);
    ctx.textAlign = 'right';
    ctx.fillText(allChron[allChron.length-1].dateLabel || '', ml + cw, mt + ch + 8);
  }
  
  // Build legend
  var legendHTML = '';
  exIds.forEach(function(exId) {
    var hasData = allChron.some(function(s){ return s.exerciseId === exId; });
    if (!hasData) return;
    legendHTML += '<div class="chart-legend-item"><span class="chart-legend-dot" style="background:'+CHART_COLORS[exId]+'"></span>' + exNames[exId] + '</div>';
  });
  legend.innerHTML = legendHTML;
}

function renderProgress(){
  // Add neglect-specific note at top of progress screen
  var progContent=document.getElementById('screen-progress');
  var existingNote=document.getElementById('neglect-progress-note');
  if(existingNote)existingNote.remove();
  if(userCondition==='neglect'&&progContent){
    var noteEl=document.createElement('div');
    noteEl.id='neglect-progress-note';
    noteEl.style.cssText='padding:.75rem 1.5rem 0';
    noteEl.innerHTML='<p style="color:var(--muted);font-size:.85rem;padding:.75rem;background:var(--surface2);border-radius:var(--r-md);margin-bottom:.5rem;">Neglect recovery tip: ask someone to watch which side of the screen you tend to miss. Improvement often shows as fewer missed targets on your neglected side over weeks of practice.</p>';
    var progBody=progContent.querySelector('.prog-body');
    if(progBody){
      var h2El=progBody.querySelector('h2');
      if(h2El&&h2El.nextSibling){
        progBody.insertBefore(noteEl,h2El.nextSibling);
      }else{
        progBody.insertBefore(noteEl,progBody.firstChild);
      }
    }
  }

  var total=sessions.length;
  var totalTime=total; // each session = 60s, so total minutes = total
  var avg=total?Math.round(sessions.reduce(function(a,s){return a+s.score;},0)/total):0;
  var rtSessions=sessions.filter(function(s){return s.rt>0;});
  var avgRt=rtSessions.length?Math.round(rtSessions.reduce(function(a,s){return a+s.rt;},0)/rtSessions.length):0;

  // Overview KPIs
  document.getElementById('kpi-row').innerHTML=
    '<div class="kpi"><div class="kpi-num">'+total+'</div><div class="kpi-lbl">'+t('total_sessions')+'</div></div>'+
    '<div class="kpi"><div class="kpi-num">'+totalTime+'</div><div class="kpi-lbl">'+t('minutes_practised')+'</div></div>'+
    '<div class="kpi"><div class="kpi-num">'+avg+'</div><div class="kpi-lbl">'+t('avg_score')+'</div></div>'+
    '<div class="kpi"><div class="kpi-num">'+(avgRt?avgRt+'ms':'—')+'</div><div class="kpi-lbl">'+t('avg_reaction_time')+'</div></div>';

  // Per-exercise benchmark cards
  var benchContainer=document.getElementById('bench-container');
  var benchHTML='';
  var exIds=ALL_EX_IDS;

  exIds.forEach(function(eid){
    var meta=EX_META[eid];
    var bench=BENCHMARKS[eid];
    var exSessions=sessions.filter(function(s){return s.exerciseId===eid;});
    var count=exSessions.length;

    // LITE: show "Level X of 3"
    benchHTML+='<div class="bench-card"><h3>'+meta.icon+' '+t('ex_'+eid+'_name')+' <span class="bench-level">Level '+getCurrentLevel(eid)+' of 3</span>';
    benchHTML+='<span class="bench-sessions">'+count+' '+t('sessions_count')+'</span></h3>';

    if(count===0){
      benchHTML+='<div class="bench-empty">'+t('no_sessions_exercise')+'</div>';
    }else{
      var bestScore=Math.max.apply(null,exSessions.map(function(s){return s.score;}));
      var avgScore=Math.round(exSessions.reduce(function(a,s){return a+s.score;},0)/count);
      var totalHits=exSessions.reduce(function(a,s){return a+(s.hits||0);},0);
      var totalMisses=exSessions.reduce(function(a,s){return a+(s.misses||0);},0);
      var acc=(totalHits+totalMisses)>0?Math.round((totalHits/(totalHits+totalMisses))*100):0;
      var rtEx=exSessions.filter(function(s){return s.rt>0;});
      var avgRtEx=rtEx.length?Math.round(rtEx.reduce(function(a,s){return a+s.rt;},0)/rtEx.length):0;

      benchHTML+='<div class="bench-stats">';
      benchHTML+='<div class="bench-stat"><div class="bench-stat-num">'+bestScore+'</div><div class="bench-stat-lbl">'+t('best_score')+'</div></div>';
      benchHTML+='<div class="bench-stat"><div class="bench-stat-num">'+avgScore+'</div><div class="bench-stat-lbl">'+t('avg_score_short')+'</div></div>';
      benchHTML+='<div class="bench-stat"><div class="bench-stat-num">'+acc+'%</div><div class="bench-stat-lbl">'+t('accuracy_label')+'</div></div>';
      benchHTML+='<div class="bench-stat"><div class="bench-stat-num">'+(avgRtEx?avgRtEx+'ms':'—')+'</div><div class="bench-stat-lbl">'+t('avg_reaction_time')+'</div></div>';
      benchHTML+='</div>';

      // Early vs Recent (first 3 vs last 3) — sessions are sorted newest-first
      var chronological=exSessions.slice().reverse(); // oldest first
      var early=chronological.slice(0,3);
      var recent=chronological.slice(-3);

      benchHTML+='<div class="bench-delta">';
      benchHTML+='<span class="bench-delta-label">'+t('improvement_label')+':</span>';
      benchHTML+=t('score_up')+' '+deltaHTML(early,recent,'score','',false);
      benchHTML+=' &nbsp; '+t('reaction_up')+' '+deltaHTML(early,recent,'rt','ms',true);
      benchHTML+='</div>';

    }

    // Benchmark reference
    var benchRef=bench.rt>0?': ~'+bench.rt+'ms reaction, ~'+bench.accuracy+'% accuracy':': ~'+bench.accuracy+'% accuracy';
    benchHTML+='<div class="bench-ref">'+infoIcon()+'<span>'+t('bench_guide')+benchRef+'</span></div>';
    benchHTML+='</div>';
  });

  benchContainer.innerHTML=benchHTML;

  // Recent sessions list
  var list=document.getElementById('hist-list');
  var clearWrap=document.getElementById('clear-wrap');
  if(!total){
    list.innerHTML='<div class="empty-hist">'+t('no_sessions_yet')+'</div>';
    clearWrap.style.display='none';
    renderProgressChart(); // will show "complete at least two sessions" message
    return;
  }
  list.innerHTML=sessions.slice(0,20).map(function(s){
    var dateStr=s.dateLabel||s.date||'';
    var timeStr=s.timeLabel||s.time||'';
    var accStr=(typeof s.accuracy==='number')?' &middot; '+s.accuracy+'% acc':'';
    var rtStr=(s.rt)?' &middot; '+s.rt+'ms avg':'';
    return '<div class="hist-item">'+
      '<div><div class="hist-name">'+s.name+'</div><div class="hist-meta">'+dateStr+' at '+timeStr+rtStr+accStr+'</div></div>'+
      '<div class="hist-score">'+s.score+' pts</div></div>';
  }).join('');
  clearWrap.style.display='';

  renderProgressChart();
}

function buildProgressReport(){
  var total=sessions.length;
  if(!total)return null;
  var lines=[];
  lines.push(t('report_header'));
  lines.push('Progress report generated '+new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}));
  lines.push(t('report_affected_side')+': '+affectedSide.charAt(0).toUpperCase()+affectedSide.slice(1));
  lines.push('');
  lines.push(t('report_overview'));
  var avg=Math.round(sessions.reduce(function(a,s){return a+s.score;},0)/total);
  var rtSess=sessions.filter(function(s){return s.rt>0;});
  var avgRt=rtSess.length?Math.round(rtSess.reduce(function(a,s){return a+s.rt;},0)/rtSess.length):null;
  lines.push(t('report_total_sessions')+': '+total);
  lines.push(t('report_minutes')+': '+total);
  lines.push(t('report_avg_score')+': '+avg);
  if(avgRt)lines.push(t('report_avg_rt')+': '+avgRt+'ms');
  lines.push('');
  lines.push(t('report_by_exercise'));
  ALL_EX_IDS.forEach(function(eid){
    var exS=sessions.filter(function(s){return s.exerciseId===eid;});
    if(!exS.length){lines.push(t('ex_'+eid+'_name')+': '+t('no_sessions_exercise'));return;}
    var best=Math.max.apply(null,exS.map(function(s){return s.score;}));
    var avgS=Math.round(exS.reduce(function(a,s){return a+s.score;},0)/exS.length);
    var hits=exS.reduce(function(a,s){return a+(s.hits||0);},0);
    var misses=exS.reduce(function(a,s){return a+(s.misses||0);},0);
    var acc=(hits+misses)?Math.round(hits/(hits+misses)*100):0;
    var rtE=exS.filter(function(s){return s.rt>0;});
    var avgRtE=rtE.length?Math.round(rtE.reduce(function(a,s){return a+s.rt;},0)/rtE.length):null;
    lines.push(t('ex_'+eid+'_name')+' ('+exS.length+' '+t('sessions_count')+')');
    lines.push('  '+t('best_score')+': '+best+' | '+t('avg_score_short')+': '+avgS+' | '+t('accuracy_label')+': '+acc+'%'+(avgRtE?' | '+t('avg_reaction')+': '+avgRtE+'ms':''));
    // Early vs recent
    var chron=exS.slice().reverse();
    if(chron.length>=6){
      var earlyAvg=Math.round(chron.slice(0,3).reduce(function(a,s){return a+s.score;},0)/3);
      var recentAvg=Math.round(chron.slice(-3).reduce(function(a,s){return a+s.score;},0)/3);
      var delta=recentAvg-earlyAvg;
      lines.push('  '+t('report_improvement')+' '+(delta>=0?'+':'')+delta);
    }
  });
  lines.push('');
  lines.push(t('report_footer1'));
  lines.push(t('report_footer2'));
  lines.push('');
  lines.push(t('report_footer3'));
  return lines.join('\n');
}

document.getElementById('btn-send-report').addEventListener('click',function(){
  var email=document.getElementById('report-email').value.trim();
  if(!email){alert(t('email_required'));document.getElementById('report-email').focus();return;}
  var body=buildProgressReport();
  if(!body){alert(t('no_sessions_report'));return;}
  var subject=t('report_header')+' – '+new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  window.location.href='mailto:'+encodeURIComponent(email)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
});


// ── Level-up overlay ──
function showLevelUp(exId, newLevel, onDone) {
  var exName = t('ex_'+exId+'_name');
  document.getElementById('levelup-sub').textContent = 'You\'ve reached Level ' + newLevel;
  document.getElementById('levelup-exname').textContent = exName;
  var overlay = document.getElementById('levelup-overlay');
  overlay.classList.add('show');
  document.getElementById('levelup-btn').onclick = function() {
    overlay.classList.remove('show');
    if (onDone) onDone();
  };
}

// ── Settings tab ──
function getLevelDesc(exId, lvl) {
  var cfg = exId==='pursuit' ? LEVEL_CONFIG.pursuit[lvl] : LEVEL_CONFIG[exId][lvl-1];
  if(!cfg)return '';
  if (exId==='anchor') return 'Target: '+(cfg.radius*2)+'px \u00b7 Visible: '+(cfg.displayMs)+'ms \u00b7 '+(cfg.bias*100).toFixed(0)+'% affected side';
  if (exId==='reading') return cfg.words+' words \u00b7 '+cfg.fontSize+'px font \u00b7 '+(cfg.timeoutMs/1000).toFixed(1)+'s window';
  if (exId==='flicker') return 'Flicker: '+cfg.durationMs+'ms \u00b7 Radius: '+cfg.radius+'px';
  if (exId==='grid') return cfg.cols+'\u00d7'+cfg.rows+' grid \u00b7 '+cfg.symSize+'px symbols';
  if (exId==='pursuit') return 'Speed: '+cfg.speed+'px/f \u00b7 '+cfg.passes+' passes \u00b7 '+cfg.pauseWindow+'ms window';
  if (exId==='bisection') return cfg.lines+' lines \u00b7 min length: '+(cfg.minLength*100).toFixed(0)+'% \u00b7 '+cfg.timePerLine+'s each';
  if (exId==='tracker') return 'Speed: '+cfg.speed+' \u00b7 '+cfg.passes+' passes \u00b7 '+cfg.pathType;
  if (exId==='gapfill') return cfg.targets+' targets \u00b7 '+cfg.scotomTargets+' in blind spot';
  return '';
}

function renderSettings() {
  ALL_EX_IDS.forEach(function(id) {
    var lvl = getCurrentLevel(id);
    var sliderEl = document.getElementById('slider-'+id);
    if(sliderEl) sliderEl.value = lvl;
    var numEl = document.getElementById('lvl-num-'+id);
    if(numEl) numEl.textContent = lvl;
    var autoEl = document.getElementById('auto-'+id);
    if(autoEl) autoEl.checked = exAutoAdvance[id] !== false;
    var descEl = document.getElementById('settings-desc-'+id);
    if(descEl) descEl.textContent = getLevelDesc(id, lvl);
  });
  // Update condition label in settings
  var lbl=document.getElementById('settings-cond-label');
  if(lbl) lbl.textContent=t('cond_'+userCondition)+' ('+conditionDetail+')';
  // Update sound cues buttons
  var soundVal=_ls.getItem('strokeSight_soundCues')||'subtle';
  document.querySelectorAll('.sound-opt').forEach(function(btn){
    btn.classList.toggle('active',btn.getAttribute('data-val')===soundVal);
  });
  // Populate diagnostic error log
  var logEl = document.getElementById('error-log-list');
  if (logEl) {
    var log = JSON.parse(_ls.getItem('strokeSight_errorLog') || '[]');
    logEl.innerHTML = log.length === 0
      ? '<p style="color:var(--faint)">No errors recorded</p>'
      : log.map(function(e) { return '<div>' + e.time.substring(0,16) + ' — ' + e.msg + '</div>'; }).join('');
  }
}

// LITE: Wire sliders — clamp to max 3, show hint if user tries to go above
document.querySelectorAll('.level-slider').forEach(function(slider) {
  slider.addEventListener('input', function() {
    var exId = this.getAttribute('data-ex');
    var requested = parseInt(this.value);
    var val = Math.min(3, requested);
    this.value = val; // clamp slider UI too
    if (requested > 3) {
      var hint = this.closest('.settings-card').querySelector('.level-cap-hint');
      if (hint) {
        hint.style.color = 'var(--primary)';
        hint.style.fontWeight = '600';
        setTimeout(function() { hint.style.color = ''; hint.style.fontWeight = ''; }, 3000);
      }
    }
    exLevels[exId] = val;
    saveLevels();
    document.getElementById('lvl-num-'+exId).textContent = val;
    document.getElementById('settings-desc-'+exId).textContent = getLevelDesc(exId, val);
    rebuildHomeCards();
  });
});

// Wire auto-advance toggles
document.querySelectorAll('.auto-toggle').forEach(function(toggle) {
  toggle.addEventListener('change', function() {
    var exId = this.getAttribute('data-ex');
    exAutoAdvance[exId] = this.checked;
    saveAutoAdvance();
  });
});

// Wire sound cues 3-option selector
document.querySelectorAll('.sound-opt').forEach(function(btn){
  btn.addEventListener('click',function(){
    var val=this.getAttribute('data-val');
    _ls.setItem('strokeSight_soundCues',val);
    document.querySelectorAll('.sound-opt').forEach(function(b){
      b.classList.toggle('active',b.getAttribute('data-val')===val);
    });
  });
});
// Set default to 'subtle' if not set
if(!_ls.getItem('strokeSight_soundCues')) _ls.setItem('strokeSight_soundCues','subtle');

renderSettings();

// ── Language picker (first launch) ──
var langpick = document.getElementById('langpick');
var langAlreadySet = !!_ls.getItem('strokeSight_lang');
var isFirstLaunch = !langAlreadySet;
if(!langAlreadySet){
  langpick.style.display = 'flex';
}
document.querySelectorAll('.langpick-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    var lang = btn.getAttribute('data-lang');
    setLang(lang);
    langpick.classList.add('fade-out');
    setTimeout(function(){ 
      langpick.style.display = 'none'; 
      if (sessions.length === 0 && !_ls.getItem('strokeSight_guidanceShown')) {
        guidanceEl.style.display = 'flex';
      }
    }, 420);
  });
});

// ── First-run energy check ──
var guidanceEl = document.getElementById('guidance');
var guidanceShown = _ls.getItem('strokeSight_guidanceShown');

// Show guidance after language picker for brand new users, or directly if returning with no sessions
if (!guidanceShown && sessions.length === 0) {
  if (langAlreadySet) {
    // Returning user who hasn't seen guidance yet — show directly
    guidanceEl.style.display = 'flex';
  }
  // For first launch: langpick handler shows guidance after language is picked (already wired above)
}

function dismissGuidance(highlightExId) {
  _ls.setItem('strokeSight_guidanceShown', '1');
  guidanceEl.classList.add('fade-out');
  setTimeout(function() {
    guidanceEl.style.display = 'none';
    // Scroll to the recommended exercise card if specified
    if (highlightExId) {
      setTimeout(function() {
        // Find the card by aria-label matching the exercise name
        var targetName = t('ex_'+highlightExId+'_name');
        var cards = document.querySelectorAll('.ex-card:not(.exercise-card-hidden)');
        cards.forEach(function(card) {
          if(card.getAttribute('aria-label')===targetName) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.style.boxShadow = '0 0 0 3px var(--primary)';
            setTimeout(function(){ card.style.boxShadow = ''; }, 2500);
          }
        });
      }, 100);
    }
  }, 420);
}

document.getElementById('guidance-good').addEventListener('click', function() {
  // Randomly recommend anchor or grid
  dismissGuidance(Math.random() < 0.5 ? 'anchor' : 'grid');
});
document.getElementById('guidance-tired').addEventListener('click', function() { dismissGuidance('reading'); });
document.getElementById('guidance-fatigued').addEventListener('click', function() { dismissGuidance('flicker'); });

// ── Privacy modal ──
var privacyModal=document.getElementById('privacy-modal');
document.getElementById('btn-privacy').addEventListener('click',function(){privacyModal.classList.add('open');document.body.style.overflow='hidden';});
document.getElementById('privacy-modal-close').addEventListener('click',function(){privacyModal.classList.remove('open');document.body.style.overflow='';});
privacyModal.addEventListener('click',function(e){if(e.target===privacyModal){privacyModal.classList.remove('open');document.body.style.overflow='';}});

} // end initApp

// ── Global canvas resize handler for device rotation ──
window.addEventListener('resize', function() {
  var cv = document.querySelector('#ex-body canvas');
  if (cv) {
    var wrap = cv.parentElement;
    if (wrap) {
      var rect = wrap.getBoundingClientRect();
      // Only resize if the wrap has actual dimensions (i.e. exercise is active)
      if (rect.width > 0 && rect.height > 0) {
        var dpr = window.devicePixelRatio || 1;
        cv.width = Math.round(rect.width * dpr);
        cv.height = Math.round(rect.height * dpr);
        cv.style.width = rect.width + 'px';
        cv.style.height = rect.height + 'px';
      }
    }
  }
});

// ── Service Worker registration ──
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./sw.js').then(function(reg){
    // When a new service worker activates, reload to get the latest version
    reg.onupdatefound = function(){
      var sw = reg.installing;
      if(!sw) return;
      sw.onstatechange = function(){
        if(sw.state === 'activated') window.location.reload();
      };
    };
  }).catch(function(){});
  // Also listen for messages from the service worker
  navigator.serviceWorker.addEventListener('message', function(e){
    if(e.data && e.data.type === 'SW_UPDATED') window.location.reload();
  });
}
