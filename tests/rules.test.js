var G = require('../js/logic.js');
var assert = require('assert');

// Runs a whole program (with loops) against a fresh world of the given level.
function run(level, text) {
  var w = G.makeWorld(level), steps = G.plan(text), kinds = [], out = [];
  for (var i = 0; i < steps.length; i++) {
    var r = G.execStep(w, steps[i]);
    out.push({ line: steps[i].line, ok: r.ok, msg: r.msg, kind: r.kind });
    if (r.kind) kinds.push(r.kind);
    if (!r.ok) return { w: w, out: out, kinds: kinds, failed: true, won: false };
  }
  return { w: w, out: out, kinds: kinds, failed: false, won: G.check(w) };
}

/* ---- every main level has a solution ---- */
var sols = {
  toast: 'go to counter\npick up bread\ngo to toaster\nput bread in toaster\npress toaster\npick up toast\ngo to plate\nput toast on plate',
  plant: 'go to shelf\npick up can\ngo to sink\nfill can\ngo to plant\npour can on plant',
  candle: 'go to drawer\npick up candle\ngo to table\nput candle on cake\ngo to drawer\npick up matches\ngo to table\nlight candle',
  lunchbox: 'go to counter\npick up sandwich\ngo to table\nput sandwich in lunchbox\ngo to counter\npick up apple\ngo to table\nput apple in lunchbox',
  cookies: 'repeat 4 times\n  go to counter\n  pick up cookie\n  go to table\n  put cookie in jar'
};
G.LEVELS.forEach(function (L) {
  var r = run(L, sols[L.id]);
  assert.ok(r.won, 'level ' + L.id + ' not won: ' + JSON.stringify(r.out.slice(-2)));
  assert.strictEqual(G.starsFor(L, G.countLines(sols[L.id])), 3, 'level ' + L.id + ' should give 3 stars');
  var pre = run(L, L.prefill);
  assert.ok(!pre.won, 'prefill for ' + L.id + ' should not win');
  console.log('ok', L.id, 'solved in', G.countLines(sols[L.id]), 'lines; prefill ->', pre.out[pre.out.length - 1].msg.slice(0, 60));
});

/* ---- loops ---- */
var unrolled = [];
for (var i = 0; i < 4; i++) unrolled.push('go to counter\npick up cookie\ngo to table\nput cookie in jar');
var cookies = G.levelById('cookies');
var ur = run(cookies, unrolled.join('\n'));
assert.ok(ur.won, 'unrolled cookies should win');
assert.strictEqual(G.starsFor(cookies, 16), 1);
assert.strictEqual(G.starsFor(cookies, 7), 2);
assert.ok(run(cookies, 'repeat 4 times\n\tgo to counter\n\tpick up cookie\n\tgo to table\n\tput cookie in jar').won, 'tabs should indent');
assert.ok(run(cookies, 'Repeat 4 Times:\n  go to counter\n  pick up cookie\n  go to table\n  put cookie in jar').won, 'case and colon');
assert.strictEqual(G.plan('repeat 3 times\n  wait').length, 4);

/* ---- every daily puzzle: broken at first, fixable ---- */
G.DAILY.forEach(function (d, idx) {
  var L = G.levelById(d.level);
  assert.ok(L, 'daily ' + idx + ' level exists');
  var bad = run(L, d.program);
  assert.ok(!bad.won, 'daily "' + d.title + '" should start broken');
  var good = run(L, d.solution);
  assert.ok(good.won, 'daily "' + d.title + '" solution must win: ' + JSON.stringify(good.out.slice(-2)));
  console.log('daily ok', d.title, '|', bad.out[bad.out.length - 1].msg.slice(0, 55));
});
var di = G.dailyInfo('2026-10-25');
assert.strictEqual(di.number, 1);
assert.strictEqual(G.dailyInfo('2026-11-04').number, 11);
assert.strictEqual(G.dailyInfo('2026-11-04').entry, G.DAILY[0]);
assert.strictEqual(G.dailyInfo('2020-01-01').number, 1);

/* ---- every catalog entry is reachable, and every emitted kind is cataloged ---- */
var T = {
  multi: 'go to counter and pick up bread', unknown_word: 'make toast', bad_form: 'go counter', go_item: 'go to bread',
  go_nowhere: 'go to garage', pron: 'pick up it', nothing: 'pick up unicorn', pick_bolted: 'pick up table',
  pick_already: 'go to counter\npick up bread\npick up bread', pick_heavy: 'go to table\npick up cake', pick_far: 'pick up bread',
  pick_full: 'go to counter\npick up bread\npick up apple', pick_from: 'go to counter\npick up bread from table',
  put_unheld: 'go to table\nput bread on table', put_place: 'put table on bread',
  put_self: 'go to counter\npick up bread\nput bread on bread', put_far: 'go to counter\npick up bread\nput bread on table',
  press_far: 'press toaster', fill_wrong: 'fill bread', fill_air: 'fill can', fill_dry: 'go to shelf\npick up can\nfill can',
  pour_wrong: 'pour bread on table', pour_air: 'pour can on plant', pour_where: 'go to shelf\npick up can\npour can',
  pour_empty: 'go to shelf\npick up can\ngo to plant\npour can on plant', water_air: 'water plant',
  light_wrong: 'light bread', light_nomatch: 'light candle',
  light_far: 'go to drawer\npick up candle\ngo to table\nput candle on cake\ngo to drawer\npick up matches\nlight candle',
  loop_empty: 'repeat 3 times', loop_orphan: '  go to counter', loop_nested: 'repeat 2 times\n  repeat 2 times\n  wait',
  loop_range: 'repeat 20 times\n  wait', already_there: 'go to counter\ngo to counter',
  toaster_top: 'go to counter\npick up bread\ngo to toaster\nput bread on toaster', toast_empty: 'go to toaster\npress toaster',
  toast_warm: 'go to counter\npick up bread\ngo to toaster\nput bread in toaster\npress toaster\npress toaster',
  sink_floor: 'go to sink\npress tap', press_nothing: 'go to table\npress table',
  can_on_plant: 'go to shelf\npick up can\ngo to plant\nput can on plant',
  pour_wet: 'go to shelf\npick up can\ngo to sink\nfill can\ngo to table\npour can on table',
  candle_dark: 'go to drawer\npick up candle\ngo to table\nput candle on cake',
  already_lit: 'go to drawer\npick up candle\ngo to table\nput candle on cake\ngo to drawer\npick up matches\ngo to table\nlight candle\nlight candle',
  wait: 'wait'
};
var ids = G.CATALOG.map(function (c) { return c[0]; });
assert.strictEqual(ids.length, new Set(ids).size, 'catalog ids unique');
ids.forEach(function (id) {
  assert.ok(T[id], 'no trigger for ' + id);
  var r = run(G.SANDBOX, T[id]);
  assert.ok(r.kinds.indexOf(id) >= 0, 'catalog "' + id + '" not triggered by its program; got ' + JSON.stringify(r.kinds));
});
Object.keys(T).forEach(function (k) { assert.ok(ids.indexOf(k) >= 0, 'trigger without catalog entry ' + k); });
console.log('catalog ok:', ids.length, 'entries all reachable');

/* ---- sandbox fuzz: nothing throws ---- */
var verbs = ['go to', 'pick up', 'put', 'press', 'fill', 'pour', 'light', 'water', 'wait', 'repeat 2 times', '  pick up'];
var nouns = ['counter', 'bread', 'toaster', 'can', 'plant', 'cake', 'candle', 'matches', 'table', 'sink', 'it', 'cookie', 'unicorn', 'lunchbox', 'drawer'];
var preps = ['in', 'on', 'into', 'onto'];
var seed = 7;
function rnd(n) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; }
for (var t = 0; t < 400; t++) {
  var lines = [];
  for (var l = 0; l < 6; l++) {
    var v = verbs[rnd(verbs.length)], line = v + ' ' + nouns[rnd(nouns.length)];
    if (rnd(3) === 0) line += ' ' + preps[rnd(preps.length)] + ' ' + nouns[rnd(nouns.length)];
    lines.push(line);
  }
  var res = run(G.SANDBOX, lines.join('\n'));
  res.out.forEach(function (o) { assert.ok(typeof o.msg === 'string' && o.msg.length > 0); });
  res.kinds.forEach(function (k) { assert.ok(ids.indexOf(k) >= 0, 'unknown kind ' + k); });
}
console.log('fuzz ok');

/* ---- custom levels ---- */
var spec = { t: 'Toast to table', j: '', s: ['counter', 'toaster', 'table'], i: { bread: 'counter' }, g: [{ k: 'toasted' }, { k: 'at', i: 'bread', t: 'table' }], o: 0 };
var v = G.validateSpec(spec);
assert.ok(v.ok, v.error);
var CL = G.compileCustom(spec);
assert.ok(CL && CL.custom);
var cs = 'go to counter\npick up bread\ngo to toaster\nput bread in toaster\npress toaster\npick up bread\ngo to table\nput bread on table';
assert.ok(run(CL, cs).won, 'custom solvable');
assert.ok(!run(CL, 'go to counter').won);
assert.ok(/not yet/.test(G.explain(run(CL, 'go to counter').w)));
var code = G.encodeSpec(v.spec);
assert.ok(/^[A-Za-z0-9_-]+$/.test(code), 'url safe');
var back = G.decodeSpec(code);
assert.deepStrictEqual(back, v.spec);
assert.strictEqual(G.decodeSpec('not a code!!'), null);
assert.strictEqual(G.decodeSpec(G.encodeSpec({ t: 'x', s: ['nope'], i: {}, g: [] })), null);
// bad specs
function bad(o, re) { var r = G.validateSpec(o); assert.ok(!r.ok && re.test(r.error), JSON.stringify(o) + ' -> ' + JSON.stringify(r)); }
bad(null, /not valid/);
bad({ s: [], i: {}, g: [] }, /furniture/);
bad({ s: ['counter'], i: {}, g: [] }, /item/);
bad({ s: ['counter'], i: { bread: 'counter' }, g: [] }, /goal/);
bad({ s: ['counter'], i: { bread: 'counter' }, g: [{ k: 'toasted' }] }, /toaster/);
bad({ s: ['counter'], i: { bread: 'counter' }, g: [{ k: 'at', i: 'bread', t: 'table' }] }, /furniture/);
bad({ s: ['counter'], i: { bread: 'counter' }, g: [{ k: 'in', i: 'bread', t: 'lunchbox' }] }, /lunchbox|container|cake/);
bad({ s: ['counter', 'table'], i: { bread: 'counter', cake: 'table' }, g: [{ k: 'at', i: 'cake', t: 'counter' }] }, /cannot be moved/);
bad({ s: ['counter'], i: { candle: 'counter' }, g: [{ k: 'lit' }] }, /matches/);
bad({ s: ['counter'], i: { can: 'counter' }, g: [{ k: 'watered' }] }, /plant/);
// hostile strings stay plain text and capped
var long = G.validateSpec({ t: '<img src=x onerror=alert(1)>'.repeat(10), j: 'x'.repeat(500), s: ['counter'], i: { bread: 'counter' }, g: [{ k: 'at', i: 'bread', t: 'counter' }] });
assert.ok(long.ok && long.spec.t.length <= 40 && long.spec.j.length <= 140);
// in/on on a container
var cspec = { t: 'Lunch', s: ['counter', 'table'], i: { apple: 'counter', lunchbox: 'table' }, g: [{ k: 'in', i: 'apple', t: 'lunchbox' }] };
var CL2 = G.compileCustom(cspec);
assert.ok(CL2);
assert.ok(run(CL2, 'go to counter\npick up apple\ngo to table\nput apple in lunchbox').won);
assert.ok(!run(CL2, 'go to counter\npick up apple\ngo to table\nput apple on lunchbox').won);
console.log('custom levels ok');
console.log('ALL OK');
// preview level for the editor
(function () {
  var pv = G.previewLevel({ s: ['counter', 'table', 'nope'], i: { bread: 'counter', apple: 'plant' } });
  assert.strictEqual(pv.stations.length, 2);
  assert.strictEqual(pv.items.length, 1);
  assert.ok(G.makeWorld(pv));
  assert.strictEqual(G.previewLevel(null).stations.length, 0);
  console.log('preview ok');
})();
