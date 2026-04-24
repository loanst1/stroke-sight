// Stroke Sight Lite — Configuration
// Lite version: levels capped at 3 in app.js (getCurrentLevel)

var ALL_EX_IDS=['anchor','reading','flicker','grid','pursuit','bisection','tracker','gapfill'];

var LEVEL_CONFIG = {
  anchor: [
    {level:1, radius:22, displayMs:1100, intMin:2500, intMax:4000, bias:0.70},
    {level:2, radius:20, displayMs:950,  intMin:2200, intMax:3500, bias:0.70},
    {level:3, radius:18, displayMs:800,  intMin:2000, intMax:3000, bias:0.70},
    {level:4, radius:16, displayMs:680,  intMin:1800, intMax:2700, bias:0.72},
    {level:5, radius:14, displayMs:580,  intMin:1600, intMax:2400, bias:0.72},
    {level:6, radius:12, displayMs:490,  intMin:1400, intMax:2100, bias:0.74},
    {level:7, radius:10, displayMs:420,  intMin:1200, intMax:1900, bias:0.74},
    {level:8, radius:9,  displayMs:360,  intMin:1050, intMax:1700, bias:0.75},
    {level:9, radius:8,  displayMs:310,  intMin:900,  intMax:1500, bias:0.75},
    {level:10,radius:7,  displayMs:260,  intMin:750,  intMax:1300, bias:0.75}
  ],
  reading: [
    {level:1, words:4, fontSize:20, timeoutMs:10000},
    {level:2, words:5, fontSize:18, timeoutMs:9000},
    {level:3, words:5, fontSize:17, timeoutMs:8000},
    {level:4, words:6, fontSize:16, timeoutMs:7500},
    {level:5, words:6, fontSize:15, timeoutMs:7000},
    {level:6, words:7, fontSize:14, timeoutMs:6500},
    {level:7, words:7, fontSize:13, timeoutMs:6000},
    {level:8, words:8, fontSize:13, timeoutMs:5500},
    {level:9, words:8, fontSize:12, timeoutMs:5000},
    {level:10,words:9, fontSize:12, timeoutMs:4500}
  ],
  flicker: [
    {level:1, durationMs:900, radius:24, minDelayMs:2500},
    {level:2, durationMs:780, radius:22, minDelayMs:2300},
    {level:3, durationMs:670, radius:20, minDelayMs:2100},
    {level:4, durationMs:560, radius:18, minDelayMs:1900},
    {level:5, durationMs:470, radius:16, minDelayMs:1700},
    {level:6, durationMs:390, radius:14, minDelayMs:1500},
    {level:7, durationMs:320, radius:12, minDelayMs:1350},
    {level:8, durationMs:260, radius:10, minDelayMs:1200},
    {level:9, durationMs:210, radius:9,  minDelayMs:1050},
    {level:10,durationMs:170, radius:8,  minDelayMs:900}
  ],
  grid: [
    {level:1, cols:4, rows:3, symSize:28},
    {level:2, cols:5, rows:4, symSize:26},
    {level:3, cols:5, rows:5, symSize:24},
    {level:4, cols:6, rows:5, symSize:22},
    {level:5, cols:6, rows:6, symSize:20},
    {level:6, cols:7, rows:6, symSize:18},
    {level:7, cols:7, rows:7, symSize:16},
    {level:8, cols:8, rows:7, symSize:14},
    {level:9, cols:8, rows:8, symSize:13},
    {level:10,cols:9, rows:9, symSize:12}
  ],
  pursuit: {
    1: {speed:1.2, passes:8,  pauseWindow:3000, targetSize:32},
    2: {speed:1.5, passes:9,  pauseWindow:2800, targetSize:30},
    3: {speed:1.8, passes:9,  pauseWindow:2600, targetSize:28},
    4: {speed:2.0, passes:10, pauseWindow:2400, targetSize:26},
    5: {speed:2.3, passes:10, pauseWindow:2200, targetSize:24},
    6: {speed:2.6, passes:11, pauseWindow:2000, targetSize:22},
    7: {speed:2.9, passes:11, pauseWindow:1800, targetSize:20},
    8: {speed:3.2, passes:12, pauseWindow:1600, targetSize:18},
    9: {speed:3.5, passes:12, pauseWindow:1400, targetSize:16},
    10:{speed:4.0, passes:14, pauseWindow:1200, targetSize:14}
  },
  bisection: [
    {level:1,  lines:8,  minLength:0.60, timePerLine:10},
    {level:2,  lines:8,  minLength:0.55, timePerLine:9},
    {level:3,  lines:9,  minLength:0.50, timePerLine:8},
    {level:4,  lines:9,  minLength:0.48, timePerLine:7},
    {level:5,  lines:10, minLength:0.45, timePerLine:7},
    {level:6,  lines:10, minLength:0.42, timePerLine:6},
    {level:7,  lines:11, minLength:0.40, timePerLine:5},
    {level:8,  lines:11, minLength:0.36, timePerLine:5},
    {level:9,  lines:12, minLength:0.32, timePerLine:4},
    {level:10, lines:12, minLength:0.30, timePerLine:4}
  ],
  tracker: [
    {level:1,  speed:0.8,  passes:8,  pathType:'straight'},
    {level:2,  speed:1.0,  passes:8,  pathType:'straight'},
    {level:3,  speed:1.2,  passes:9,  pathType:'straight'},
    {level:4,  speed:1.4,  passes:9,  pathType:'diagonal'},
    {level:5,  speed:1.6,  passes:10, pathType:'diagonal'},
    {level:6,  speed:1.8,  passes:10, pathType:'diagonal'},
    {level:7,  speed:2.0,  passes:11, pathType:'curved'},
    {level:8,  speed:2.3,  passes:11, pathType:'curved'},
    {level:9,  speed:2.6,  passes:12, pathType:'curved'},
    {level:10, speed:3.0,  passes:12, pathType:'curved'}
  ],
  gapfill: [
    {level:1,  targets:10, scotomTargets:2},
    {level:2,  targets:11, scotomTargets:2},
    {level:3,  targets:12, scotomTargets:3},
    {level:4,  targets:13, scotomTargets:3},
    {level:5,  targets:14, scotomTargets:4},
    {level:6,  targets:15, scotomTargets:5},
    {level:7,  targets:16, scotomTargets:6},
    {level:8,  targets:18, scotomTargets:6},
    {level:9,  targets:19, scotomTargets:7},
    {level:10, targets:20, scotomTargets:8}
  ]
};

var EXERCISES=[
  {id:'anchor',   bc:'b-teal',   conds:['hemianopia','quadrantanopia']},
  {id:'reading',  bc:'b-amber',  conds:['hemianopia','quadrantanopia']},
  {id:'flicker',  bc:'b-teal',   conds:['hemianopia','quadrantanopia','scotoma']},
  {id:'grid',     bc:'b-green',  conds:['hemianopia','quadrantanopia','neglect']},
  {id:'pursuit', bc:'b-purple', conds:['neglect']},
  {id:'bisection',bc:'b-purple', conds:['neglect']},
  {id:'tracker',  bc:'b-coral',  conds:['scotoma']},
  {id:'gapfill',  bc:'b-coral',  conds:['scotoma']}
];

var BENCHMARKS={
  anchor:{rt:350,accuracy:85},
  reading:{rt:800,accuracy:90},
  flicker:{rt:300,accuracy:80},
  grid:{rt:3500,accuracy:90},
  pursuit:{rt:1000,accuracy:75},
  bisection:{rt:0,accuracy:85},
  tracker:{rt:0,accuracy:75},
  gapfill:{rt:0,accuracy:70}
};

var EX_META={
  anchor:{name:'Anchor & Scan',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>'},
  reading:{name:'Reading Line Scan',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'},
  flicker:{name:'Peripheral Flicker',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>'},
  grid:{name:'Visual Search Grid',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>'},
  pursuit:{name:'Smooth Pursuit',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5" cy="12" r="3" fill="currentColor" opacity=".7"/><path d="M8 12 Q12 6 16 12 Q20 18 22 12" stroke-linecap="round"/><circle cx="22" cy="12" r="2" fill="currentColor"/></svg>'},
  bisection:{name:'Line Bisection',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>'},
  tracker:{name:'Blind Spot Tracker',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="currentColor" opacity=".3"/></svg>'},
  gapfill:{name:'Gap Fill',icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="4" r="2"/><circle cx="20" cy="12" r="2"/><circle cx="12" cy="20" r="2"/><circle cx="4" cy="12" r="2"/></svg>'}
};

var CHART_COLORS = {
  anchor:    '#2e9e93',  // teal
  reading:   '#e8943a',  // amber
  flicker:   '#6c5ce7',  // purple
  grid:      '#e05252',  // red
  pursuit:   '#8b5cf6',  // violet
  bisection: '#06b6d4',  // cyan
  tracker:   '#10b981',  // emerald
  gapfill:   '#ec4899'   // pink
};

// STRINGS and WORD_LISTS are initialised here so they exist before language files load
if (!window.STRINGS) window.STRINGS = {};
if (!window.WORD_LISTS) window.WORD_LISTS = {};
