(function () {
'use strict';

var G = window.Game, U = window.UI, I = window.I18N, Sfx = window.Sfx;
var el = U.el, $ = U.$, clear = U.clear;
function T(k, v) { return I.t(k, v); }
var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
var LV = G.LEVELS;

/* ============================================================== save data */
var LS_KEY = 'literal-robot-v2', LS_V1 = 'literal-robot-v1';
var COLORS = [['#FFB703', 'yellow'], ['#4E9FD1', 'blue'], ['#F56F9B', 'pink'], ['#3FA866', 'green'], ['#9B6BD6', 'purple'], ['#E8553D', 'red']];

function freshSave() {
  return {
    name: 'Robot', color: COLORS[0][0], stars: [0, 0, 0, 0, 0], progs: {}, fails: {}, ach: {},
    daily: { streak: 0, best: 0, last: '', hist: {} },
    n: { runs: 0, wins: 0, pokes: 0, stepped: 0, custom: 0, shared: 0, dailyWins: 0 },
    sound: true, lang: '', draft: null, ai: { model: 'claude-haiku-5-5', key: '' }
  };
}
function loadSave() {
  var s = freshSave();
  try {
    var raw = localStorage.getItem(LS_KEY), o;
    if (raw) {
      o = JSON.parse(raw);
      if (o && typeof o === 'object') {
        if (typeof o.name === 'string') s.name = o.name.slice(0, 14) || 'Robot';
        if (typeof o.color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(o.color)) s.color = o.color;
        if (Array.isArray(o.stars)) for (var i = 0; i < LV.length; i++) s.stars[i] = Math.max(0, Math.min(3, o.stars[i] | 0));
        ['progs', 'fails', 'ach'].forEach(function (k) { if (o[k] && typeof o[k] === 'object') s[k] = o[k]; });
        if (o.daily && typeof o.daily === 'object') {
          s.daily.streak = o.daily.streak | 0; s.daily.best = o.daily.best | 0;
          s.daily.last = typeof o.daily.last === 'string' ? o.daily.last : '';
          if (o.daily.hist && typeof o.daily.hist === 'object') s.daily.hist = o.daily.hist;
        }
        if (o.n && typeof o.n === 'object') for (var k in s.n) s.n[k] = o.n[k] | 0;
        if (typeof o.sound === 'boolean') s.sound = o.sound;
        if (typeof o.lang === 'string') s.lang = o.lang;
        if (o.draft && typeof o.draft === 'object') s.draft = o.draft;
        if (o.ai && typeof o.ai === 'object') {
          if (typeof o.ai.model === 'string') s.ai.model = o.ai.model.slice(0, 60);
          if (typeof o.ai.key === 'string') s.ai.key = o.ai.key.slice(0, 200);
        }
      }
    } else {
      var v1 = localStorage.getItem(LS_V1);
      if (v1) {
        var p = JSON.parse(v1);
        if (p && Array.isArray(p.stars)) for (var j = 0; j < 4; j++) s.stars[j] = Math.max(0, Math.min(3, p.stars[j] | 0));
        if (p && p.progs) for (var q = 0; q < 4; q++) if (typeof p.progs[q] === 'string') s.progs[LV[q].id] = p.progs[q];
      }
    }
  } catch (e) { /* storage unavailable or damaged: start fresh */ }
  return s;
}
var save = loadSave();
function persist() { try { localStorage.setItem(LS_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } }

function today() {
  var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
function botName() { return save.name || 'Robot'; }
function say(text) { var n = botName(); return n === 'Robot' ? text : String(text).replace(/\bRobot\b/g, n); }
function levelStr(L, field) { return I.levelText(L.id, field) || L[field]; }
function setI18n(node, key, vars) { node.setAttribute('data-i18n', key); node.textContent = T(key, vars); }

/* ================================================================== scenes */
var heroCanvas = $('heroCanvas'), gameCanvas = $('canvas'), editCanvas = $('editCanvas');
var heroScene = Scene.create(heroCanvas), gameScene = Scene.create(gameCanvas), editScene = Scene.create(editCanvas);
var SCENES = [heroScene, gameScene, editScene];

/* ============================================================ DOM handles */
var ta = $('ta'), gutter = $('gutter'), logEl = $('log'), bubble = $('bubble'), msgEl = $('msg');
var runBtn = $('run'), pauseBtn = $('pauseBtn'), stepBtn = $('stepBtn'), backStepBtn = $('backStepBtn'), resetBtn = $('reset');
var hintBox = $('hintBox'), winEl = $('win'), nextBtn = $('nextBtn');

var SCREENS = ['home', 'map', 'game', 'gallery', 'create'];
var screen = 'home';

/* ================================================================== toasts */
function toast(title, sub) {
  var d = el('div', { class: 'toast', role: 'status' }, [title, sub ? el('small', { text: sub }) : null]);
  $('toasts').appendChild(d);
  setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 3800);
}

/* ============================================================ achievements */
function foundCount(type) { return G.CATALOG.filter(function (c) { return c[1] === type && save.fails[c[0]] > 0; }).length; }
function totalCount(type) { return G.CATALOG.filter(function (c) { return c[1] === type; }).length; }
var ACH = [
  ['first_win', function () { return save.n.wins >= 1; }],
  ['three_stars', function () { return save.stars.some(function (s) { return s >= 3; }); }],
  ['all_levels', function () { return save.stars.every(function (s) { return s > 0; }); }],
  ['perfect', function () { return save.stars.every(function (s) { return s >= 3; }); }],
  ['loop_master', function () { return save.stars[4] >= 3; }],
  ['blunders_10', function () { return foundCount('blunder') >= 10; }],
  ['blunders_all', function () { return foundCount('blunder') === totalCount('blunder'); }],
  ['quirks_all', function () { return foundCount('quirk') === totalCount('quirk'); }],
  ['daily_first', function () { return save.n.dailyWins >= 1; }],
  ['streak_3', function () { return save.daily.best >= 3; }],
  ['poke_10', function () { return save.n.pokes >= 10; }],
  ['stepper', function () { return save.n.stepped >= 10; }],
  ['builder', function () { return save.n.custom >= 1; }],
  ['sharer', function () { return save.n.shared >= 1; }],
  ['named', function () { return botName() !== 'Robot'; }]
];
function checkAch() {
  var got = false;
  ACH.forEach(function (a) {
    if (!save.ach[a[0]] && a[1]()) {
      save.ach[a[0]] = today(); got = true;
      toast(T('toast.badge'), T('ach.' + a[0] + '.t'));
      Sfx.play('unlock');
    }
  });
  if (got) persist();
}
function discover(kind) {
  if (!kind) return;
  var first = !save.fails[kind];
  save.fails[kind] = (save.fails[kind] || 0) + 1;
  if (first) {
    var c = G.CATALOG.filter(function (x) { return x[0] === kind; })[0];
    if (c) { toast(T('toast.newEntry'), c[2]); Sfx.play('pop'); }
  }
}

/* =================================================================== clipboard */
function copyText(text, note) {
  function done(ok) {
    if (!note) return;
    note.hidden = false;
    note.textContent = ok ? T('copy.ok') : T('copy.manual', { text: text });
  }
  function fallback() {
    try {
      var t2 = el('textarea', { 'aria-hidden': 'true', style: 'position:fixed;left:-999px;top:0;' });
      t2.value = text; document.body.appendChild(t2); t2.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(t2);
      done(!!ok);
    } catch (e) { done(false); }
  }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
      return;
    }
  } catch (e) { /* fall through */ }
  fallback();
}

/* ============================================================= screen router */
function show(name) {
  screen = name;
  SCREENS.forEach(function (s) { $('screen-' + s).hidden = (s !== name); });
  var key = name;
  if (name === 'game' && cur) key = cur.mode === 'sandbox' ? 'sandbox' : (cur.mode === 'daily' ? 'daily' : (cur.fromEditor ? 'create' : 'map'));
  var btns = $('nav').querySelectorAll('button');
  for (var i = 0; i < btns.length; i++) {
    if (btns[i].getAttribute('data-go') === key) btns[i].setAttribute('aria-current', 'page'); else btns[i].removeAttribute('aria-current');
  }
  window.scrollTo(0, 0);
}
function go(target) {
  if (screen === 'game' && target !== 'game') abortSession();
  Sfx.play('click');
  if (target === 'home') { renderHome(); show('home'); }
  else if (target === 'map') { renderMap(); show('map'); }
  else if (target === 'daily') startDaily();
  else if (target === 'sandbox') startLevel(G.SANDBOX, { mode: 'sandbox' });
  else if (target === 'gallery') { renderGallery(); show('gallery'); }
  else if (target === 'create') { show('create'); }
}
(function wireNav() {
  var all = document.querySelectorAll('[data-go]');
  for (var i = 0; i < all.length; i++) (function (b) {
    b.addEventListener('click', function () { go(b.getAttribute('data-go')); });
  })(all[i]);
})();

/* ===================================================================== HOME */
var wake = { active: false, start: 0, dur: 1300, done: false };
var heroWorld = G.makeWorld(LV[0]);
heroScene.freePos = [3.0, 3.0];
heroScene.setLevel(LV[0], heroWorld);
heroScene.snapRobot();

function heroSay(text, mood, act, ms) {
  $('heroMsg').textContent = say(text);
  if (mood) heroScene.setMood(mood, ms || 1600);
  if (act) heroScene.perform(act);
}
function heroIntro() {
  $('heroWho').textContent = botName();
  if (reduce) { wake.done = true; heroScene.setPower(1); heroScene.setMood('idle'); heroSay(T('hero.hello', { name: botName() })); return; }
  heroScene.setPower(0); heroScene.setMood('off');
  heroSay('…');
  setTimeout(function () {
    if (wake.done) return;
    wake.start = performance.now(); wake.active = true;
    Sfx.play('power');
  }, 700);
}
function finishWake() {
  if (wake.done) return;
  wake.done = true; wake.active = false;
  heroScene.setPower(1); heroScene.setMood('idle');
  heroSay(T('hero.hello', { name: botName() }), 'happy', 'hop', 1800);
}
function wakeNow() { if (!wake.done) { wake.start = performance.now() - wake.dur; wake.active = true; } }

var REACT = [
  [/^(hello|hi|hey|hola|yo)\b/, 'poke.hello', 'nod', 'happy'],
  [/^(jump|hop|leap|bounce)\b/, 'poke.jump', 'hop', 'happy'],
  [/^(dance|boogie|groove)\b/, 'poke.dance', 'dance', 'happy'],
  [/^(sleep|nap|zzz|rest)\b/, 'poke.sleep', null, 'sleep'],
  [/^(sit|stand|stay|wait)\b/, 'poke.stay', 'nod', null],
  [/^(sing|song)\b/, 'poke.sing', 'wiggle', 'confused'],
  [/^(name|who)\b/, 'poke.name', 'nod', null],
  [/^(love|good|great|thanks|thank|nice|please)\b/, 'poke.love', 'dance', 'happy'],
  [/^(bad|dumb|stupid|ugly|broken)\b/, 'poke.rude', null, 'sad'],
  [/(toast|bread|cookie|plant|candle)/, 'poke.task', 'nod', null]
];
function pokeWord(raw) {
  var w = String(raw || '').toLowerCase().replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim();
  wakeNow(); save.n.pokes++;
  if (!w) { heroSay(T('poke.empty'), 'confused', 'wiggle'); Sfx.play('confused'); }
  else {
    var hit = null;
    for (var i = 0; i < REACT.length; i++) if (REACT[i][0].test(w)) { hit = REACT[i]; break; }
    if (hit) { heroSay(T(hit[1], { name: botName() }), hit[3], hit[2], 3200); Sfx.play(hit[3] === 'sad' ? 'fail' : 'ok'); }
    else { heroSay(T('poke.unknown', { word: w.slice(0, 24) }), 'confused', 'wiggle'); Sfx.play('confused'); }
  }
  persist(); checkAch();
}
heroCanvas.addEventListener('click', function () {
  wakeNow(); save.n.pokes++;
  heroSay(T('poke.tap' + (save.n.pokes % 4)), 'confused', 'hop', 1200);
  Sfx.play('pop'); Sfx.vibrate(15);
  persist(); checkAch();
});
$('pokeForm').addEventListener('submit', function (e) {
  e.preventDefault();
  var inp = $('pokeIn');
  pokeWord(inp.value);
  inp.value = '';
});

function firstOpenLevel() {
  for (var i = 0; i < LV.length; i++) if (save.stars[i] === 0) return i;
  return -1;
}
function totalStars() { return save.stars.reduce(function (a, b) { return a + b; }, 0); }
function streakNow() {
  var d = save.daily;
  if (!d.last) return 0;
  return G.daysBetween(d.last, today()) <= 1 ? d.streak : 0;
}
function attemptsRow(str, node) {
  clear(node);
  String(str || '').split('').forEach(function (c) { node.appendChild(el('i', { class: c })); });
}
function renderHome() {
  var started = totalStars() > 0 || Object.keys(save.progs).length > 0;
  setI18n($('beginBtn'), started ? 'home.continue' : 'home.begin');
  var info = G.dailyInfo(today()), hist = save.daily.hist[info.date];
  $('dailyEyebrow').textContent = T('daily.eyebrow', { n: info.number });
  $('dailyTitle').textContent = hist && hist.won ? T('daily.solved') : T('daily.tileTitle');
  $('dailyStreak').textContent = T('daily.streak', { n: streakNow() });
  attemptsRow(hist ? hist.a : '', $('dailyAttempts'));
  var db = $('dailyBtn'); setI18n(db, hist && hist.won ? 'daily.again' : 'daily.play');
  $('nameIn').value = save.name === 'Robot' && !$('nameIn').value ? '' : save.name;
  $('nameIn').placeholder = 'Robot';
  var sw = clear($('swatches'));
  COLORS.forEach(function (c) {
    var b = el('button', { type: 'button', class: 'sw', role: 'radio', 'aria-checked': save.color === c[0] ? 'true' : 'false', 'aria-label': T('col.' + c[1]), style: 'background:' + c[0] });
    b.addEventListener('click', function () { setColor(c[0]); });
    sw.appendChild(b);
  });
  var found = foundCount('blunder') + foundCount('quirk'), total = G.CATALOG.length;
  $('collectionSummary').textContent = T('home.collectionSum', { a: found, b: total, c: Object.keys(save.ach).length, d: ACH.length });
  $('heroWho').textContent = botName();
}
function setColor(hex) {
  save.color = hex;
  SCENES.forEach(function (s) { s.setColor(hex); });
  persist(); renderHome();
}
$('nameIn').addEventListener('input', function () {
  save.name = $('nameIn').value.trim().slice(0, 14) || 'Robot';
  $('heroWho').textContent = botName(); $('who').textContent = botName();
  persist(); checkAch();
});
$('beginBtn').addEventListener('click', function () {
  Sfx.play('click');
  var i = firstOpenLevel();
  if (i < 0) go('map'); else startLevel(LV[i], { mode: 'level', index: i });
});
$('freeBtn').addEventListener('click', function () { go('sandbox'); });

/* ======================================================================= MAP */
var MAP_POS = [[80, 308], [224, 123], [376, 290], [528, 114], [704, 273]];
function renderMap() {
  var map = $('map'), old = map.querySelectorAll('.node'), i;
  for (i = 0; i < old.length; i++) map.removeChild(old[i]);
  var curIdx = firstOpenLevel();
  LV.forEach(function (L, idx) {
    var unlocked = idx === 0 || save.stars[idx - 1] > 0, done = save.stars[idx] > 0;
    var cls = 'node ' + (done ? 'done' : (idx === curIdx ? 'cur' : (unlocked ? 'cur' : 'locked')));
    if (!unlocked) cls = 'node locked';
    var b = el('button', { type: 'button', class: cls, style: 'left:' + (MAP_POS[idx][0] / 8) + '%;top:' + (MAP_POS[idx][1] / 4.4) + '%;', 'aria-disabled': unlocked ? null : 'true' }, [
      el('span', { class: 'dot', text: String(idx + 1) }),
      el('span', { class: 'nm' }, [levelStr(L, 'title'), el('br'), U.starRow(save.stars[idx], 14)])
    ]);
    b.addEventListener('click', function () {
      if (!unlocked) { Sfx.play('fail'); toast(T('map.locked')); return; }
      startLevel(L, { mode: 'level', index: idx });
    });
    map.appendChild(b);
  });
}

/* ================================================================= GAME */
var cur = null;   // which level is open
var ses = null;   // the current run: { steps, pos, snaps, state, timer, lineState, msgs, rows, text }
var world = null;
var editMode = 'type';

function initialText() {
  if (cur.mode === 'daily') return cur.daily.entry.program;
  if (cur.mode === 'sandbox') return save.progs.sandbox || '';
  if (cur.mode === 'custom') return '';
  var p = save.progs[cur.level.id];
  return (typeof p === 'string' && p) ? p : cur.level.prefill;
}
function progKey() { return cur.mode === 'sandbox' ? 'sandbox' : (cur.mode === 'level' ? cur.level.id : null); }

function startLevel(level, opts) {
  abortSession();
  opts = opts || {};
  cur = { level: level, mode: opts.mode || 'level', index: opts.index, daily: opts.daily || null, spec: opts.spec || null, fromEditor: !!opts.fromEditor, challenge: opts.challenge || null, hintIdx: 0, attempts: '', alreadyWon: false };
  if (cur.mode === 'daily') {
    var h = save.daily.hist[cur.daily.date];
    cur.attempts = h ? h.a : ''; cur.alreadyWon = !!(h && h.won);
  }
  world = G.makeWorld(level);
  gameScene.setLevel(level, world);
  gameScene.snapRobot();
  gameScene.setMood('idle');
  ta.value = initialText();
  ses = null;
  hintBox.hidden = true; winEl.hidden = true;
  setEditorMode('type');
  blocks.setLevel(level);
  updateGameText();
  renderDict(); clearLog(); renderGutter(); updateButtons();
  setBubble(greetText(), '');
  show('game');
}
function greetText() {
  if (cur.mode === 'daily') return T('daily.greet');
  return levelStr(cur.level, 'greet');
}
function updateGameText() {
  if (!cur) return;
  var L = cur.level, m = cur.mode;
  $('who').textContent = botName();
  if (m === 'level') $('lvLabel').textContent = T('game.levelOf', { n: cur.index + 1, total: LV.length });
  else if (m === 'sandbox') $('lvLabel').textContent = T('nav.sandbox');
  else if (m === 'daily') $('lvLabel').textContent = T('daily.eyebrow', { n: cur.daily.number });
  else $('lvLabel').textContent = T('banner.customLabel');
  if (m === 'daily') {
    $('jobTitle').textContent = T('daily.heading');
    $('goalText').textContent = T('daily.goal', { job: levelStr(L, 'job'), goal: levelStr(L, 'goal') });
  } else if (m === 'custom') {
    $('jobTitle').textContent = L.title;
    $('goalText').textContent = (cur.spec && cur.spec.j ? cur.spec.j + ' ' : '') + L.goal;
  } else {
    $('jobTitle').textContent = levelStr(L, 'job');
    $('goalText').textContent = levelStr(L, 'goal');
  }
  var cb = $('challengeBanner');
  if (cur.challenge) { cb.hidden = false; cb.textContent = T('challenge.banner', { name: cur.challenge.name || T('challenge.friend'), n: cur.challenge.lines }); }
  else cb.hidden = true;
  var mb = $('modeBanner');
  clear(mb);
  if (m === 'daily') {
    mb.hidden = false;
    mb.appendChild(document.createTextNode(T('banner.daily', { n: cur.daily.number })));
    var at = el('span', { class: 'attempts' }); attemptsRow(cur.attempts, at); mb.appendChild(at);
  } else if (m === 'custom' && cur.fromEditor) { mb.hidden = false; mb.textContent = T('banner.test'); }
  else if (m === 'custom') { mb.hidden = false; mb.textContent = T('banner.custom'); }
  else if (m === 'sandbox') { mb.hidden = false; mb.textContent = T('banner.sandbox'); }
  else mb.hidden = true;
  var back = $('backBtn');
  setI18n(back, cur.fromEditor ? 'game.backEditor' : ((m === 'daily' || m === 'sandbox') ? 'game.backHome' : 'game.back'));
  gameCanvas.setAttribute('aria-label', T('game.canvasAria', { title: m === 'daily' ? T('daily.heading') : (m === 'level' ? levelStr(L, 'title') : L.title) }));
}
function setBubble(text, kind) { msgEl.textContent = say(text); bubble.className = 'bubble' + (kind ? ' ' + kind : ''); }

function renderDict() {
  var L = cur.level;
  var ul = clear($('dict'));
  L.vocab.forEach(function (v) { if (G.FORMS[v]) ul.appendChild(el('li', {}, [el('code', { text: G.FORMS[v] })])); });
  var places = L.stations.map(function (s) { return s.names[0]; });
  var things = [];
  L.items.forEach(function (d) { var n = d.pick[0]; if (things.indexOf(n) < 0) things.push(n); });
  var room = clear($('room'));
  room.appendChild(el('span', {}, [el('b', { text: T('dict.places') + ' ' }), places.join(', ')]));
  room.appendChild(el('span', {}, [el('b', { text: T('dict.things') + ' ' }), things.join(', ')]));
}
function renderGutter() {
  var lines = ta.value.split('\n'), n = Math.max(8, lines.length), ls = ses ? ses.lineState : {};
  clear(gutter);
  for (var i = 0; i < n; i++) gutter.appendChild(el('div', { class: ls[i] || '', text: String(i + 1) }));
  gutter.scrollTop = ta.scrollTop;
}
function clearLog() { clear(logEl); logEl.appendChild(el('li', { class: 'empty', text: T('log.empty') })); }
function addLog(n, raw, res) {
  if (logEl.firstChild && logEl.firstChild.className === 'empty') clear(logEl);
  var li = el('li', { class: res.ok ? 'ok' : 'bad' }, [
    el('span', { class: 'n', text: String(n) }), el('code', { text: raw.trim() }), el('span', { class: 'r', text: say(res.msg) })
  ]);
  logEl.appendChild(li);
  logEl.scrollTop = logEl.scrollHeight;
  return li;
}
function updateButtons() {
  var st = ses ? ses.state : 'idle';
  runBtn.disabled = st === 'running';
  setI18n(runBtn, st === 'running' ? 'game.running' : 'game.run');
  pauseBtn.disabled = !(st === 'running' || st === 'paused');
  setI18n(pauseBtn, st === 'paused' ? 'game.resume' : 'game.pause');
  stepBtn.disabled = st === 'running';
  backStepBtn.disabled = !(ses && ses.pos > 0 && st !== 'running');
  ta.readOnly = st === 'running';
}

/* ---------------- running a program ---------------- */
function resetWorld() {
  world = G.makeWorld(cur.level);
  gameScene.setWorld(world);
  gameScene.snapRobot();
  gameScene.setMood('idle');
}
function abortSession() {
  if (ses && ses.timer) clearTimeout(ses.timer);
  ses = null;
}
function resetRoom() {
  abortSession();
  resetWorld(); clearLog(); winEl.hidden = true;
  if (cur) setBubble(greetText(), '');
  renderGutter(); updateButtons();
}
function hasContent() { return G.plan(ta.value).length > 0; }
function beginSession() {
  var text = ta.value;
  abortSession();
  resetWorld(); clearLog();
  winEl.hidden = true; hintBox.hidden = true;
  ses = { steps: G.plan(text), pos: 0, snaps: [], state: 'idle', timer: 0, lineState: {}, msgs: [], rows: [], text: text };
  renderGutter();
}
function runClick() {
  if (!cur || (ses && ses.state === 'running')) return;
  if (!hasContent()) { setBubble(T('msg.empty'), ''); Sfx.play('confused'); return; }
  beginSession();
  save.n.runs++;
  ses.state = 'running';
  updateButtons();
  tick();
}
function tick() {
  if (!ses || ses.state !== 'running') return;
  var delay = doStep();
  if (ses && ses.state === 'running') ses.timer = setTimeout(tick, delay);
}
function doStep() {
  var s = ses, step = s.steps[s.pos];
  s.snaps.push(G.cloneWorld(world));
  for (var k in s.lineState) if (s.lineState[k] === 'run') s.lineState[k] = 'ok';
  var res = G.execStep(world, step);
  s.pos++;
  s.lineState[step.line] = res.ok ? 'run' : 'bad';
  s.rows.push(addLog(s.pos, step.raw, res));
  s.msgs.push({ text: res.msg, bad: !res.ok });
  setBubble(res.msg, res.ok ? '' : 'bad');
  renderGutter();
  discover(res.kind);
  if (res.ok) {
    if (res.kind && res.kind !== 'wait') { gameScene.setMood('confused', 1300); Sfx.play('confused'); }
    else if (res.kind === 'wait') { gameScene.setMood('sleep', 1100); Sfx.play('tick'); }
    else { Sfx.play('tick'); Sfx.vibrate(8); }
  }
  var tp = gameScene.target(), dx = tp[0] - gameScene.rob.x, dy = tp[1] - gameScene.rob.y, dist = Math.sqrt(dx * dx + dy * dy);
  var delay = reduce ? 450 : Math.round(dist / 2.6 * 1000) + (step.type === 'repeat' ? 250 : 650);
  if (!res.ok) finish('fail', res);
  else if (s.pos >= s.steps.length) finish('end', res);
  updateButtons();
  return delay;
}
function finish(kind, res) {
  var s = ses;
  if (s.timer) clearTimeout(s.timer);
  s.state = 'done';
  for (var k in s.lineState) if (s.lineState[k] === 'run') s.lineState[k] = 'ok';
  renderGutter();
  if (kind === 'fail') {
    gameScene.setMood('confused', 2600); Sfx.play('fail'); Sfx.vibrate([40, 30, 40]);
    recordAttempt('r');
    persist(); checkAch();
    return;
  }
  if (cur.mode === 'sandbox') {
    setBubble(T('msg.sandboxDone', { n: G.countLines(s.text) }), '');
    gameScene.setMood('happy', 1500); Sfx.play('ok');
    persist(); checkAch();
    return;
  }
  if (G.check(world)) { win(); return; }
  setBubble(T('msg.unmet', { why: G.explain(world) }), 'bad');
  gameScene.setMood('sad', 2600); Sfx.play('confused');
  recordAttempt('y');
  persist(); checkAch();
}
function recordAttempt(c) {
  if (cur.mode !== 'daily' || cur.alreadyWon) return;
  if (cur.attempts.length < 12) cur.attempts += c;
  var d = cur.daily.date;
  save.daily.hist[d] = { a: cur.attempts, won: c === 'g' };
  // keep the history short
  var keys = Object.keys(save.daily.hist).sort();
  while (keys.length > 40) delete save.daily.hist[keys.shift()];
  updateGameText();
}

function setBtn(btn, key, vars) { btn.hidden = false; setI18n(btn, key, vars); }
function win() {
  var s = ses, L = cur.level, lines = G.countLines(s.text), text = '';
  save.n.wins++;
  var stars = 0;
  $('shareBtn').hidden = true; $('challengeBtn').hidden = true; $('editorBtn').hidden = true; nextBtn.hidden = true;
  $('winAttempts').hidden = true; $('shareNote').hidden = true;

  if (cur.mode === 'level') {
    stars = G.starsFor(L, lines);
    if (stars > save.stars[cur.index]) save.stars[cur.index] = stars;
    save.progs[L.id] = s.text;
    text = stars === 3 ? T('win.stars3', { n: lines }) : T('win.stars12', { n: lines, opt: L.optimal });
    if (cur.index < LV.length - 1) setBtn(nextBtn, 'win.next'); else setBtn(nextBtn, 'win.toMap');
    setBtn($('challengeBtn'), 'win.challenge');
  } else if (cur.mode === 'daily') {
    save.n.dailyWins += cur.alreadyWon ? 0 : 1;
    recordAttempt('g');
    if (!cur.alreadyWon) {
      var d = save.daily, gap = d.last ? G.daysBetween(d.last, cur.daily.date) : 99;
      d.streak = gap === 1 ? d.streak + 1 : 1;
      d.last = cur.daily.date; d.best = Math.max(d.best, d.streak);
      cur.alreadyWon = true;
    }
    var tries = cur.attempts.length || 1;
    text = T(tries === 1 ? 'win.daily1' : 'win.daily', { n: tries, streak: save.daily.streak });
    $('winAttempts').hidden = false; attemptsRow(cur.attempts, $('winAttempts'));
    setBtn($('shareBtn'), 'win.share');
    cur.lastGrid = cur.attempts;
  } else if (cur.fromEditor) {
    text = T('win.editor', { n: lines });
    editor.setOptimal(lines);
    publish(cur.spec, lines);
    save.n.custom++;
    setBtn($('editorBtn'), 'win.toEditor');
  } else {
    text = T('win.custom', { n: lines });
    setBtn($('challengeBtn'), 'win.challenge');
  }
  if (cur.challenge) {
    var theirs = cur.challenge.lines, who = cur.challenge.name || T('challenge.friend');
    text += ' ' + T(lines < theirs ? 'win.beat' : (lines === theirs ? 'win.tied' : 'win.lost'), { name: who, theirs: theirs, n: lines });
  }
  cur.lastLines = lines;
  $('winText').textContent = text;
  var ws = clear($('winStars'));
  if (stars) ws.appendChild(U.starRow(stars, 24));
  winEl.hidden = false;
  setBubble(T('msg.win'), '');
  gameScene.setMood('happy', 4000); gameScene.perform('dance');
  Sfx.play('win'); Sfx.vibrate([30, 40, 60]);
  Confetti.burst($('confetti'));
  persist(); checkAch();
}

/* ---------------- step / pause / back ---------------- */
function pauseClick() {
  if (!ses) return;
  if (ses.state === 'running') { clearTimeout(ses.timer); ses.state = 'paused'; }
  else if (ses.state === 'paused' && ses.pos < ses.steps.length) { ses.state = 'running'; updateButtons(); tick(); return; }
  updateButtons();
}
function stepClick() {
  if (!cur) return;
  if (!ses || ses.state === 'done' || ses.state === 'idle') {
    if (!hasContent()) { setBubble(T('msg.empty'), ''); return; }
    beginSession(); save.n.runs++;
    ses.state = 'paused';
  }
  if (ses.state === 'paused' && ses.pos < ses.steps.length) {
    save.n.stepped++;
    ses.state = 'paused';
    doStep();
    if (ses.state !== 'done') ses.state = 'paused';
    updateButtons();
    checkAch();
  }
}
function backStepClick() {
  if (!ses || ses.pos <= 0 || ses.state === 'running') return;
  clearTimeout(ses.timer);
  world = ses.snaps.pop();
  gameScene.setWorld(world);
  ses.pos--; ses.msgs.pop();
  var row = ses.rows.pop(); if (row && row.parentNode) row.parentNode.removeChild(row);
  if (!ses.rows.length) clearLog();
  ses.lineState = {};
  for (var i = 0; i < ses.pos; i++) ses.lineState[ses.steps[i].line] = (i === ses.pos - 1) ? 'run' : 'ok';
  ses.state = 'paused';
  winEl.hidden = true;
  gameScene.setMood('idle');
  var last = ses.msgs[ses.msgs.length - 1];
  if (last) setBubble(last.text, last.bad ? 'bad' : ''); else setBubble(greetText(), '');
  Sfx.play('tick');
  renderGutter(); updateButtons();
}

/* ---------------- editor modes ---------------- */
function setEditorMode(m) {
  editMode = m;
  $('typePane').hidden = m !== 'type'; $('blocksPane').hidden = m !== 'blocks';
  $('tabType').setAttribute('aria-selected', m === 'type' ? 'true' : 'false');
  $('tabBlocks').setAttribute('aria-selected', m === 'blocks' ? 'true' : 'false');
  if (m === 'blocks') blocks.render();
}
$('tabType').addEventListener('click', function () { setEditorMode('type'); ta.focus(); });
$('tabBlocks').addEventListener('click', function () { setEditorMode('blocks'); });

var blocks = Blocks.create({
  list: $('blockList'), palette: $('palette'),
  getText: function () { return ta.value; },
  setText: function (txt) { ta.value = txt; programEdited(); },
  onAdd: function () { Sfx.play('pop'); }
});
function programEdited() {
  if (ses && ses.state !== 'idle') resetRoom(); else renderGutter();
  var key = cur && progKey();
  if (key) { save.progs[key] = ta.value; persist(); }
}
ta.addEventListener('input', programEdited);
ta.addEventListener('scroll', function () { gutter.scrollTop = ta.scrollTop; });
ta.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runClick(); } });

runBtn.addEventListener('click', runClick);
pauseBtn.addEventListener('click', pauseClick);
stepBtn.addEventListener('click', stepClick);
backStepBtn.addEventListener('click', backStepClick);
resetBtn.addEventListener('click', function () { Sfx.play('click'); resetRoom(); });
$('backBtn').addEventListener('click', function () {
  abortSession();
  if (cur.fromEditor) { go('create'); return; }
  go(cur.mode === 'daily' || cur.mode === 'sandbox' ? 'home' : 'map');
});
$('hint').addEventListener('click', function () {
  if (!cur) return;
  var hs = I.levelText(cur.level.id, 'hints') || cur.level.hints;
  hintBox.textContent = T('hint.label', { i: cur.hintIdx + 1, n: hs.length, text: hs[cur.hintIdx] });
  hintBox.hidden = false;
  cur.hintIdx = (cur.hintIdx + 1) % hs.length;
  Sfx.play('click');
});
nextBtn.addEventListener('click', function () {
  Sfx.play('click');
  if (cur.index < LV.length - 1) startLevel(LV[cur.index + 1], { mode: 'level', index: cur.index + 1 });
  else go('map');
});

/* ---------------- share / challenge ---------------- */
function baseUrl() { return String(location.href).split('#')[0]; }
function levelRef() {
  if (cur.mode === 'level') return 'L:' + cur.level.id;
  if (cur.spec) return 'C:' + G.encodeSpec(cur.spec);
  return null;
}
$('challengeBtn').addEventListener('click', function () {
  var ref = levelRef();
  if (!ref) return;
  var nm = botName() === 'Robot' ? '' : encodeURIComponent(botName().replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 14));
  var str = ref + '.' + cur.lastLines + '.' + nm;
  var link = baseUrl() + '#challenge=' + str;
  var title = cur.mode === 'level' ? levelStr(cur.level, 'title') : cur.level.title;
  copyText(T('challenge.msg', { title: title, n: cur.lastLines, link: link }), $('shareNote'));
  save.n.shared++; persist(); checkAch();
});
$('shareBtn').addEventListener('click', function () {
  var grid = (cur.lastGrid || cur.attempts).split('').map(function (c) { return c === 'r' ? '🟥' : (c === 'y' ? '🟨' : '🟩'); }).join('');
  var tries = (cur.lastGrid || cur.attempts).length;
  copyText(T('share.text', { n: cur.daily.number, grid: grid, tries: T(tries === 1 ? 'share.try1' : 'share.tries', { n: tries }) }), $('shareNote'));
  save.n.shared++; persist(); checkAch();
});
$('editorBtn').addEventListener('click', function () { abortSession(); show('create'); });

function parseChallenge(s) {
  var m;
  try { s = decodeURIComponent(s); } catch (e) { /* use as is */ }
  m = String(s).match(/^(L|C):([A-Za-z0-9_-]+)\.(\d{1,3})\.(.*)$/);
  if (!m) return null;
  var out = { lines: parseInt(m[3], 10), name: m[4].slice(0, 14) };
  if (m[1] === 'L') {
    for (var i = 0; i < LV.length; i++) if (LV[i].id === m[2]) { out.level = LV[i]; out.index = i; return out; }
    return null;
  }
  var spec = G.decodeSpec(m[2]);
  if (!spec) return null;
  out.spec = spec;
  return out;
}
function parseShared(str) {
  str = String(str || '').trim();
  var m = str.match(/play=([A-Za-z0-9_-]+)/);
  if (m) { var sp = G.decodeSpec(m[1]); return sp ? { spec: sp, lines: 0 } : null; }
  m = str.match(/challenge=([^\s]+)/);
  if (m) return parseChallenge(m[1]);
  if (/^[LC]:/.test(str)) return parseChallenge(str);
  var raw = G.decodeSpec(str);
  return raw ? { spec: raw, lines: 0 } : null;
}
function playShared(p, edit) {
  if (!p) return false;
  if (edit && p.spec) { editor.setDraft(p.spec); show('create'); return true; }
  var ch = p.lines ? { lines: p.lines, name: p.name } : null;
  if (p.level) { startLevel(p.level, { mode: 'level', index: p.index, challenge: ch }); return true; }
  var CL = G.compileCustom(p.spec);
  if (!CL) return false;
  startLevel(CL, { mode: 'custom', spec: p.spec, challenge: ch });
  return true;
}
function routeHash() {
  var h = String(location.hash || '').replace(/^#/, '');
  if (!h) return;
  var ok = playShared(parseShared(h), false);
  if (!ok) toast(T('shared.bad'));
  try { history.replaceState(null, '', baseUrl()); } catch (e) { /* ignore */ }
}

/* ---------------- Bug of the Day ---------------- */
function startDaily() {
  var info = G.dailyInfo(today());
  startLevel(info.level, { mode: 'daily', daily: info });
}

/* ---------------- voice ---------------- */
var SR = window.SpeechRecognition || window.webkitSpeechRecognition, listening = false;
if (SR) {
  $('voiceBtn').hidden = false;
  $('voiceBtn').addEventListener('click', function () {
    if (listening) return;
    try {
      var rec = new SR();
      rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 1;
      rec.onresult = function (e) {
        var txt = String(e.results[0][0].transcript || '').toLowerCase().trim().replace(/[.!?,]+$/g, '');
        if (!txt) return;
        ta.value = ta.value + (ta.value && !/\n$/.test(ta.value) ? '\n' : '') + txt;
        programEdited(); if (editMode === 'blocks') blocks.render();
        Sfx.play('pop');
      };
      rec.onerror = function () { toast(T('voice.err')); };
      rec.onend = function () { listening = false; setI18n($('voiceBtn'), 'game.voice'); };
      listening = true; setI18n($('voiceBtn'), 'game.listening');
      rec.start();
    } catch (e) { listening = false; setI18n($('voiceBtn'), 'game.voice'); toast(T('voice.err')); }
  });
}

/* ---------------- real AI helper ---------------- */
$('aiToggle').addEventListener('click', function () {
  var box = $('aiBox'), open = box.hidden;
  box.hidden = !open;
  $('aiToggle').setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) { $('aiKey').value = save.ai.key; $('aiModel').value = save.ai.model; $('aiRemember').checked = !!save.ai.key; }
});
function aiSystem(L) {
  var forms = L.vocab.filter(function (v) { return G.FORMS[v]; }).map(function (v) { return '- ' + G.FORMS[v]; }).join('\n');
  var places = L.stations.map(function (s) { return s.names[0]; }).join(', ');
  var things = []; L.items.forEach(function (d) { if (things.indexOf(d.pick[0]) < 0) things.push(d.pick[0]); });
  return 'You write programs for a very literal robot. Reply with ONLY the program: one command per line, no numbering, no commentary, no code fences.\n' +
    'Allowed command forms (replace ___ with a place or thing name):\n' + forms + '\n' +
    'Places: ' + places + '\nThings: ' + things.join(', ') + '\n' +
    'Rules: the robot holds one thing at a time, must stand at a place before picking up or using something there, forgets everything between lines (never use the word "it"), and cannot do two actions on one line. Indent the lines inside a repeat by two spaces. Use the shortest program that reaches the goal.\n' +
    'Goal: ' + L.job + ' ' + L.goal;
}
function aiStatus(text, err) { var s = $('aiStatus'); s.hidden = !text; s.textContent = text || ''; s.className = 'aistatus' + (err ? ' err' : ''); }
$('aiAsk').addEventListener('click', function () {
  if (!cur) return;
  var key = $('aiKey').value.trim(), model = $('aiModel').value.trim() || 'claude-haiku-5-5';
  save.ai.model = model.slice(0, 60);
  save.ai.key = $('aiRemember').checked ? key.slice(0, 200) : '';
  persist();
  if (!key) { aiStatus(T('ai.needKey'), true); return; }
  aiStatus(T('ai.thinking'), false); $('aiResult').hidden = true; $('aiAsk').disabled = true;
  var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 25000);
  var userText = ta.value.trim() ? 'The player wrote:\n' + ta.value : 'The player wrote nothing yet. Solve the goal.';
  fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', signal: ctl ? ctl.signal : undefined,
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({ model: model, max_tokens: 500, system: aiSystem(cur.level), messages: [{ role: 'user', content: userText }] })
  }).then(function (r) {
    return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, status: r.status, body: j }; });
  }).then(function (r) {
    clearTimeout(timer); $('aiAsk').disabled = false;
    if (!r.ok) { aiStatus(T('ai.errHttp', { status: r.status, msg: String(r.body && r.body.error && r.body.error.message || '').slice(0, 140) }), true); return; }
    var out = r.body && r.body.content && r.body.content[0] && r.body.content[0].text || '';
    var lines = out.split('\n').filter(function (l) { return l.trim() && !/^\s*```/.test(l); })
      .map(function (l) { return l.replace(/^(\s*)(?:\d+[.)]|[-*])\s+/, '$1').replace(/\s+$/, ''); }).slice(0, 40);
    if (!lines.length) { aiStatus(T('ai.empty'), true); return; }
    $('aiLines').textContent = lines.join('\n'); $('aiResult').hidden = false; aiStatus('', false);
  }).catch(function () {
    clearTimeout(timer); $('aiAsk').disabled = false;
    aiStatus(T('ai.errNet'), true);
  });
});
function aiApply(andRun) {
  ta.value = $('aiLines').textContent;
  programEdited(); if (editMode === 'blocks') blocks.render();
  setEditorMode(editMode);
  if (andRun) runClick();
}
$('aiUse').addEventListener('click', function () { aiApply(false); });
$('aiRun').addEventListener('click', function () { aiApply(true); });

/* ============================================================ COLLECTION */
var gTab = 'blunder';
function renderGallery() {
  var tabs = { blunder: 'gTabBlunders', quirk: 'gTabQuirks', badges: 'gTabBadges' };
  $('gTabBlunders').textContent = T('gallery.blunders') + ' ' + foundCount('blunder') + '/' + totalCount('blunder');
  $('gTabQuirks').textContent = T('gallery.quirks') + ' ' + foundCount('quirk') + '/' + totalCount('quirk');
  $('gTabBadges').textContent = T('gallery.badges') + ' ' + Object.keys(save.ach).length + '/' + ACH.length;
  for (var k in tabs) $(tabs[k]).setAttribute('aria-selected', k === gTab ? 'true' : 'false');
  var body = clear($('galleryBody'));
  if (gTab === 'badges') {
    ACH.forEach(function (a) {
      var got = !!save.ach[a[0]];
      body.appendChild(el('div', { class: 'gcard badge' + (got ? ' got' : '') }, [
        el('div', { class: 'b-ic', 'aria-hidden': 'true', text: got ? '★' : '?' }),
        el('h4', { text: T('ach.' + a[0] + '.t') }),
        el('p', { text: T('ach.' + a[0] + '.d') })
      ]));
    });
    return;
  }
  G.CATALOG.filter(function (c) { return c[1] === gTab; }).forEach(function (c) {
    var n = save.fails[c[0]] || 0;
    if (n) {
      body.appendChild(el('div', { class: 'gcard' }, [
        el('span', { class: 'cnt', text: '×' + n }), el('h4', { text: c[2] }), el('p', { text: c[3] })
      ]));
    } else {
      var p = el('p', { text: '', hidden: true });
      var b = el('button', { type: 'button', class: 'btn ghost small', text: T('gallery.clue') });
      b.addEventListener('click', function () { p.hidden = false; p.textContent = c[3]; b.hidden = true; });
      body.appendChild(el('div', { class: 'gcard locked' }, [el('h4', { text: '???' }), p, b]));
    }
  });
}
$('gTabBlunders').addEventListener('click', function () { gTab = 'blunder'; renderGallery(); });
$('gTabQuirks').addEventListener('click', function () { gTab = 'quirk'; renderGallery(); });
$('gTabBadges').addEventListener('click', function () { gTab = 'badges'; renderGallery(); });

/* ================================================================ EDITOR */
var published = null;
function publish(spec, lines) {
  var s = JSON.parse(JSON.stringify(spec)); s.o = lines;
  var code = G.encodeSpec(s);
  published = { code: code, lines: lines };
  $('cLink').value = baseUrl() + '#play=' + code;
  $('cCode').value = code;
  $('cShareNote').hidden = false;
  $('cShareNote').textContent = T('create.shareNote', { n: lines });
  $('cShare').hidden = false;
}
var editor = Editor.create({
  scene: editScene, t: T, draft: save.draft,
  onChange: function (d, reset) {
    save.draft = d; persist();
    if (reset && published) { published = null; $('cShare').hidden = true; }
  },
  onTest: function (spec) {
    var CL = G.compileCustom(spec);
    if (!CL) { $('cError').textContent = T('shared.bad'); $('cError').hidden = false; return; }
    startLevel(CL, { mode: 'custom', spec: spec, fromEditor: true });
  }
});
$('cCopyLink').addEventListener('click', function () { copyText($('cLink').value, $('cShareNote')); save.n.shared++; persist(); checkAch(); });
$('cCopyCode').addEventListener('click', function () { copyText($('cCode').value, $('cShareNote')); save.n.shared++; persist(); checkAch(); });
function loadFrom(edit) {
  var p = parseShared($('cLoad').value), err = $('cLoadErr');
  if (!p) { err.hidden = false; err.textContent = T('shared.bad'); return; }
  err.hidden = true;
  playShared(p, edit);
}
$('cLoadPlay').addEventListener('click', function () { loadFrom(false); });
$('cLoadEdit').addEventListener('click', function () { loadFrom(true); });

/* ============================================================ TOP BAR */
function updateSoundBtn() {
  var b = $('soundBtn');
  b.setAttribute('aria-pressed', save.sound ? 'true' : 'false');
  setI18n(b.firstChild, save.sound ? 'sound.on' : 'sound.off');
  Sfx.setOn(save.sound);
}
$('soundBtn').addEventListener('click', function () { save.sound = !save.sound; persist(); updateSoundBtn(); if (save.sound) Sfx.play('pop'); });

function setLang(l) {
  if (l !== 'en' && l !== 'es') l = 'en';
  save.lang = l; I.setLang(l);
  document.documentElement.setAttribute('lang', l);
  $('lang').value = l;
  I.apply(document);
  persist(); refreshAll();
}
$('lang').addEventListener('change', function () { setLang($('lang').value); });
function refreshAll() {
  updateSoundBtn();
  renderHome();
  if (screen === 'map') renderMap();
  if (screen === 'gallery') renderGallery();
  editor.rerender();
  blocks.render();
  if (cur) { updateGameText(); renderDict(); updateButtons(); }
}

/* ================================================================ LOOP */
var lastT = 0;
function frame(t) {
  var dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
  lastT = t;
  if (!document.hidden) {
    if (wake.active) {
      var p = Math.max(0, Math.min(1, (performance.now() - wake.start) / wake.dur));
      heroScene.setPower(p);
      if (p > 0.15 && heroScene.mood === 'off') heroScene.setMood('idle');
      if (p >= 1) finishWake();
    }
    if (screen === 'home') heroScene.draw(t, dt);
    else if (screen === 'game') gameScene.draw(t, dt);
    else if (screen === 'create') editScene.draw(t, dt);
  }
  requestAnimationFrame(frame);
}
window.addEventListener('pointermove', function (e) {
  if (screen === 'home') heroScene.lookAt(e.clientX, e.clientY);
  else if (screen === 'game') gameScene.lookAt(e.clientX, e.clientY);
});
document.documentElement.addEventListener('mouseleave', function () { heroScene.clearLook(); gameScene.clearLook(); });

function colors() { Scene.readColors(); }
try {
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (mq.addEventListener) mq.addEventListener('change', colors);
  new MutationObserver(colors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
} catch (e) { /* optional */ }
window.addEventListener('hashchange', routeHash);

/* ================================================================ START */
(function boot() {
  var l = save.lang;
  if (!l) { var nav = (navigator.language || 'en').toLowerCase(); l = nav.indexOf('es') === 0 ? 'es' : 'en'; }
  colors();
  SCENES.forEach(function (s) { s.setColor(save.color); });
  I.setLang(l); save.lang = l;
  document.documentElement.setAttribute('lang', l);
  $('lang').value = l;
  I.apply(document);
  updateSoundBtn();
  clearLog();
  renderHome();
  show('home');
  heroIntro();
  routeHash();
  requestAnimationFrame(frame);
})();

// small hooks used by the automated browser test
window.__LR = { save: function () { return save; }, go: go, startLevel: startLevel, setLang: setLang };
})();
