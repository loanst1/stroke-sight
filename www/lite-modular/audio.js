// Stroke Sight — Audio utilities

// ── Stereo spatial audio system ──
// _audioCtx is intentionally null at page load — created lazily on first user gesture
// to satisfy iOS Safari's requirement that AudioContext be created within a user gesture.
var _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_audioCtx.state === 'suspended') {
    _audioCtx.resume();
  }
  return _audioCtx;
}

function playSpatialCue(panValue, volume) {
  // panValue: -1 (left) to +1 (right)
  // volume: 0-1
  var soundLevel = _ls.getItem('strokeSight_soundCues') || 'subtle';
  if (soundLevel === 'off') return;
  var vol = soundLevel === 'subtle' ? 0.1 : 0.25;
  vol *= (volume || 1);
  try {
    var ctx = getAudioCtx();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    var panner = ctx.createStereoPanner();
    osc.connect(gain);
    gain.connect(panner);
    panner.connect(ctx.destination);
    osc.frequency.value = 600;
    gain.gain.value = vol;
    panner.pan.value = Math.max(-1, Math.min(1, panValue));
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.stop(ctx.currentTime + 0.15);
  } catch(e) {}
}

// Legacy alias kept for any callers
function playAudioCue() { playSpatialCue(0, 1); }
