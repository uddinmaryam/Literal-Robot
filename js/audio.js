(function (root) {
'use strict';

/* Tiny synthesized sound effects (no audio files) and phone haptics. */
var ctx = null, enabled = true;

function ensure() {
  if (!enabled) return null;
  if (!ctx) {
    var A = root.AudioContext || root.webkitAudioContext;
    if (!A) return null;
    try { ctx = new A(); } catch (e) { return null; }
  }
  if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { /* ignore */ } }
  return ctx;
}

function tone(freq, dur, type, vol, delay, slideTo) {
  var c = ensure();
  if (!c) return;
  try {
    var t0 = c.currentTime + (delay || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.08, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  } catch (e) { /* audio is optional */ }
}

var SOUNDS = {
  click: function () { tone(660, 0.05, 'triangle', 0.05); },
  tick: function () { tone(520, 0.05, 'square', 0.035); },
  ok: function () { tone(523, 0.08, 'triangle', 0.06); tone(784, 0.12, 'triangle', 0.06, 0.07); },
  fail: function () { tone(330, 0.16, 'sawtooth', 0.05, 0, 220); tone(196, 0.28, 'sawtooth', 0.05, 0.14, 110); },
  confused: function () { tone(440, 0.12, 'sine', 0.06, 0, 520); tone(520, 0.12, 'sine', 0.06, 0.12, 390); },
  win: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.18, 'triangle', 0.07, i * 0.1); }); tone(1047, 0.5, 'sine', 0.05, 0.42); },
  pop: function () { tone(300, 0.1, 'sine', 0.08, 0, 800); },
  unlock: function () { tone(880, 0.1, 'triangle', 0.06); tone(1175, 0.2, 'triangle', 0.06, 0.1); },
  power: function () { tone(180, 0.5, 'sine', 0.06, 0, 720); tone(720, 0.12, 'triangle', 0.05, 0.5); }
};

root.Sfx = {
  play: function (name) { var f = SOUNDS[name]; if (f) f(); },
  setOn: function (b) { enabled = !!b; },
  isOn: function () { return enabled; },
  vibrate: function (pattern) {
    if (!enabled) return;
    try { if (root.navigator && navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* ignore */ }
  }
};
})(window);
