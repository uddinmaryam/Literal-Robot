(function (root) {
'use strict';

/* ======================================================================
   Literal Robot, game rules. No DOM code in this file.
   ====================================================================== */

var STOP = ['the', 'a', 'an', 'my', 'your', 'some', 'please'];
var PRON = ['it', 'them', 'that', 'this', 'those', 'these', 'one', 'thing', 'things', 'stuff', 'something', 'everything'];

var FORMS = {};
(function () {
  var groups = [
    ['go to the ___', ['go', 'walk', 'move', 'run', 'head', 'travel']],
    ['pick up the ___', ['pick', 'pickup', 'grab', 'take', 'get', 'fetch', 'lift']],
    ['put the ___ in (or on) the ___', ['put', 'place', 'set', 'insert', 'add']],
    ['press the ___', ['press', 'push', 'hit', 'click', 'flip', 'activate', 'start', 'switch', 'turn']],
    ['fill the ___', ['fill']],
    ['pour the ___ on the ___', ['pour', 'empty', 'dump']],
    ['water the ___', ['water']],
    ['light the ___', ['light', 'ignite']],
    ['repeat 3 times (then indent the lines to repeat)', ['repeat']],
    ['wait', ['wait', 'rest', 'pause', 'stand']]
  ];
  groups.forEach(function (g) { g[1].forEach(function (v) { FORMS[v] = g[0]; }); });
})();

/* ------------------------------------------- catalog of things that happen */
// [id, type, title, hint]  type: blunder (Robot stops) or quirk (Robot carries on, oddly)
var CATALOG = [
  ['multi', 'blunder', 'Too many verbs', 'Put two actions on one line.'],
  ['unknown_word', 'blunder', 'Unknown word', 'Ask Robot to do something it has no word for, like "make".'],
  ['bad_form', 'blunder', 'Right verb, wrong sentence', 'Use a known verb the wrong way, like "go" without "to".'],
  ['go_item', 'blunder', 'Walking into a thing', 'Tell Robot to go to a thing instead of a place.'],
  ['go_nowhere', 'blunder', 'Lost in the room', 'Send Robot to a place that does not exist.'],
  ['pron', 'blunder', 'Goldfish memory', 'Use the word "it" in a command.'],
  ['nothing', 'blunder', 'Nothing by that name', 'Name something that is not in the room.'],
  ['pick_bolted', 'blunder', 'Hugging the furniture', 'Try to pick up a piece of furniture.'],
  ['pick_already', 'blunder', 'Already got it', 'Pick up something Robot is already holding.'],
  ['pick_heavy', 'blunder', 'Too precious to move', 'Try to pick up the cake, the jar or the lunchbox.'],
  ['pick_far', 'blunder', 'Short arms', 'Pick up something from across the room.'],
  ['pick_full', 'blunder', 'Not an octopus', 'Try to carry a second thing.'],
  ['pick_from', 'blunder', 'Wrong shelf', 'Take something "from" the wrong place.'],
  ['put_unheld', 'blunder', 'Mind powers', 'Put something somewhere without holding it.'],
  ['put_place', 'blunder', 'A place is not a thing', 'Try to put a place somewhere.'],
  ['put_self', 'blunder', 'Physics says no', 'Put an object on itself.'],
  ['put_far', 'blunder', 'Throwing arm', 'Put something in a target on the other side of the room.'],
  ['press_far', 'blunder', 'Remote control', 'Press something from across the room.'],
  ['fill_wrong', 'blunder', 'Unfillable', 'Try to fill something that is not a can.'],
  ['fill_air', 'blunder', 'Filling the air', 'Fill the can without holding it.'],
  ['fill_dry', 'blunder', 'Hoping for rain', 'Fill the can away from the sink.'],
  ['pour_wrong', 'blunder', 'Unpourable', 'Try to pour something that is not a can.'],
  ['pour_air', 'blunder', 'Air pouring', 'Pour the can without holding it.'],
  ['pour_where', 'blunder', 'Pour where?', 'Pour without saying where.'],
  ['pour_empty', 'blunder', 'Empty promises', 'Pour an empty can.'],
  ['water_air', 'blunder', 'Good intentions', 'Water the plant without a can.'],
  ['light_wrong', 'blunder', 'Not flammable', 'Try to light something that is not the candle.'],
  ['light_nomatch', 'blunder', 'Rubbing hands', 'Light the candle without holding the matches.'],
  ['light_far', 'blunder', 'Long-distance fire', 'Light the candle from across the room.'],
  ['loop_empty', 'blunder', 'Repeating nothing', 'Write a repeat line with no indented lines under it.'],
  ['loop_orphan', 'blunder', 'Stray indent', 'Indent a line with no repeat above it.'],
  ['loop_nested', 'blunder', 'Dizzy loops', 'Put a loop inside a loop.'],
  ['loop_range', 'blunder', 'Too much repeating', 'Repeat more than 10 times, or zero times.'],
  ['already_there', 'quirk', 'Standing extra hard', 'Tell Robot to go to the place it is already at.'],
  ['toaster_top', 'quirk', 'Bread on a toaster', 'Put the bread on top of the toaster instead of in it.'],
  ['toast_empty', 'quirk', 'Proud toaster', 'Press the toaster with nothing in it.'],
  ['toast_warm', 'quirk', 'Warm toast', 'Press the toaster twice.'],
  ['sink_floor', 'quirk', 'Wet floor', 'Press the tap without holding the can.'],
  ['press_nothing', 'quirk', 'Not that kind of thing', 'Press something that has no button.'],
  ['can_on_plant', 'quirk', 'Plant under a can', 'Put the watering can on the plant.'],
  ['pour_wet', 'quirk', 'Wrong target, wet target', 'Pour water on something that is not the plant.'],
  ['candle_dark', 'quirk', 'Festive but dark', 'Put the candle on the cake without lighting it.'],
  ['already_lit', 'quirk', 'Lighting it again', 'Light a candle that is already lit.'],
  ['wait', 'quirk', 'Excellent waiter', 'Tell Robot to wait.']
];

/* --------------------------------------------------------- item building */
function mk(id, names, loc, o) {
  o = o || {};
  var label = o.label || function () { return names[0]; };
  return {
    id: id, names: names, loc: loc, portable: o.portable !== false, heavy: o.heavy,
    state: o.state || {}, pick: o.pick || [names[0]], label: label
  };
}
var CAKE_HEAVY = 'The cake is far too precious to move. Robot respects the cake.';
var LUNCH_HEAVY = 'The lunchbox is stuck to the table with old jam. It is not going anywhere.';
var JAR_HEAVY = 'The jar is glued to the table by a century of crumbs.';

function breadItem(loc) {
  return mk('bread', ['bread', 'toast', 'slice of bread', 'bread slice'], loc, {
    state: { toasted: false, inside: false }, pick: ['bread', 'toast'],
    label: function (w) { return w.items.bread.state.toasted ? 'toast' : 'bread'; }
  });
}
function canItem(loc) {
  return mk('can', ['watering can', 'can'], loc, { state: { full: false }, pick: ['can'], label: function () { return 'watering can'; } });
}
function cookieItem(id, loc) { return mk(id, ['cookie', 'cookies'], loc, { pick: ['cookie'] }); }

/* ---------------------------------------------------------- main levels */
var LEVELS = [
  {
    id: 'toast', title: 'Toast', optimal: 8,
    job: 'Get toast onto the plate.',
    goal: 'The bread starts on the counter. Finish with toasted bread on the plate.',
    greet: 'Hi. I do exactly what you write, nothing more. Press Run and see what "make toast" means to me.',
    prefill: 'make toast',
    vocab: ['go', 'pick', 'put', 'press', 'wait'],
    hints: [
      'Robot only knows a few verbs. Open the dictionary below the log.',
      'Robot can only pick something up when it is standing next to it.',
      'Order of work: fetch the bread, toast it, take it out, then put it on the plate.'
    ],
    stations: [
      { id: 'counter', names: ['counter', 'kitchen counter', 'bench'], stand: [1.8, 1.5], slots: [[0.55, 1.35, 36], [0.55, 1.85, 36]] },
      { id: 'toaster', names: ['toaster'], stand: [1.8, 3.85], slots: [[0.55, 3.85, 47]] },
      { id: 'plate', names: ['plate', 'table'], stand: [4.0, 1.75], slots: [[4.0, 0.65, 31]] }
    ],
    furniture: [
      { st: 'counter', boxes: [[0.1, 0.5, 0.9, 1.7, 36, 0, '#B98A5E']] },
      { st: 'toaster', boxes: [[0.1, 3.0, 0.9, 1.7, 36, 0, '#7F96AD'], [0.3, 3.5, 0.5, 0.7, 15, 36, '#C9D1D9']] },
      { st: 'plate', boxes: [[3.1, 0.1, 1.8, 1.1, 30, 0, '#D8B07A']], deco: { t: 'plate', x: 4.0, y: 0.65, z: 30 } }
    ],
    sstate: {},
    items: [breadItem('counter')],
    check: function (w) { var b = w.items.bread; return b.state.toasted && b.loc === 'plate'; },
    explain: function (w) {
      var b = w.items.bread, out = [];
      if (!b.state.toasted) out.push('the bread was never toasted');
      if (b.loc !== 'plate') out.push('the ' + itemName(w, 'bread') + ' is ' + where(w, 'bread') + ', not on the plate');
      return out.join(', and ');
    }
  },
  {
    id: 'plant', title: 'Thirsty Plant', optimal: 6,
    job: 'Water the plant.',
    goal: 'The watering can is on the shelf. The tap is at the sink. The plant is across the room.',
    greet: 'The plant looks thirsty. I will follow your words to the letter. Press Run to see how that goes.',
    prefill: 'water the plant',
    vocab: ['go', 'pick', 'put', 'press', 'fill', 'pour'],
    hints: [
      'Robot cannot fill a can it is not holding.',
      'Robot only has one pair of hands. Fetch the can first, then go to the water.',
      'Shelf, pick up the can, sink, fill the can, plant, pour the can on the plant.'
    ],
    stations: [
      { id: 'shelf', names: ['shelf', 'closet'], stand: [1.7, 1.2], slots: [[0.5, 1.2, 44]] },
      { id: 'sink', names: ['sink', 'tap', 'faucet'], stand: [1.7, 3.3], slots: [[0.55, 3.3, 38]] },
      { id: 'plant', names: ['plant', 'flower', 'pot'], stand: [3.9, 1.55], slots: [[3.9, 0.7, 21]] }
    ],
    furniture: [
      { st: 'shelf', boxes: [[0.1, 0.5, 0.8, 1.4, 44, 0, '#9A7B5B']] },
      { st: 'sink', boxes: [[0.1, 2.5, 0.9, 1.6, 36, 0, '#8FA6B8'], [0.25, 2.75, 0.6, 1.1, 1.5, 36, '#5E7587'], [0.15, 3.25, 0.16, 0.16, 14, 37, '#C9D1D9']] },
      { st: 'plant', boxes: [[3.5, 0.3, 0.8, 0.8, 20, 0, '#C26A4B']], deco: { t: 'plant', x: 3.9, y: 0.7, z: 20 } }
    ],
    sstate: { plant: { watered: false } },
    items: [canItem('shelf')],
    check: function (w) { return w.sstate.plant.watered; },
    explain: function (w) {
      var out = ['the plant is still thirsty'];
      if (w.items.can.state.full) out.push('the can is full but was never poured');
      return out.join(', and ');
    }
  },
  {
    id: 'candle', title: 'Birthday Candle', optimal: 8,
    job: 'Put a lit candle on the cake.',
    goal: 'The cake is on the table. The candle and the matches are in the drawer.',
    greet: 'It is somebody\'s birthday. I have no pockets and one pair of hands. Press Run to try your first idea.',
    prefill: 'put a candle on the cake',
    vocab: ['go', 'pick', 'put', 'light', 'wait'],
    hints: [
      'Robot can carry only one thing at a time. Expect two trips to the drawer.',
      'The candle goes on the cake first. Then fetch the matches.',
      'Robot must be holding the matches, and standing by the candle, to light it.'
    ],
    stations: [
      { id: 'drawer', names: ['drawer', 'cabinet'], stand: [1.8, 1.35], slots: [[0.55, 1.1, 32], [0.55, 1.65, 32]] },
      { id: 'table', names: ['table'], stand: [3.9, 1.85], slots: [[3.9, 0.7, 30]] }
    ],
    furniture: [
      { st: 'drawer', boxes: [[0.1, 0.6, 0.9, 1.5, 32, 0, '#6F8FB8']] },
      { st: 'table', boxes: [[3.0, 0.1, 2.0, 1.2, 30, 0, '#D8B07A']] }
    ],
    sstate: {},
    items: [
      mk('cake', ['cake', 'birthday cake'], 'table', { portable: false, heavy: CAKE_HEAVY }),
      mk('candle', ['candle'], 'drawer', { state: { lit: false } }),
      mk('matches', ['matches', 'match', 'lighter'], 'drawer')
    ],
    check: function (w) { return w.items.candle.loc === 'on:cake' && w.items.candle.state.lit; },
    explain: function (w) {
      var c = w.items.candle, out = [];
      if (c.loc !== 'on:cake') out.push('the candle is ' + where(w, 'candle') + ', not on the cake');
      if (!c.state.lit) out.push('the candle is not lit');
      return out.join(', and ');
    }
  },
  {
    id: 'lunchbox', title: 'Fix the Lunchbox', optimal: 8,
    job: 'Debug this program so both snacks end up in the lunchbox.',
    goal: 'The sandwich and the apple are on the counter. The lunchbox is on the table. Read the program, run it, find the line that breaks.',
    greet: 'Somebody wrote this program for me, and I do not think it works. Press Run and watch where I get stuck.',
    prefill: 'go to counter\npick up sandwich\npick up apple\ngo to table\nput sandwich in lunchbox\nput apple in lunchbox',
    vocab: ['go', 'pick', 'put'],
    hints: [
      'Read the program like Robot does: one line at a time, no guessing.',
      'Robot has one pair of hands. One snack per trip.',
      'After the first snack is in the lunchbox, go back to the counter for the second.'
    ],
    stations: [
      { id: 'counter', names: ['counter', 'kitchen counter'], stand: [1.8, 1.8], slots: [[0.55, 1.4, 36], [0.55, 2.2, 36]] },
      { id: 'table', names: ['table'], stand: [3.9, 1.85], slots: [[3.9, 0.7, 30]] }
    ],
    furniture: [
      { st: 'counter', boxes: [[0.1, 0.8, 0.9, 2.0, 36, 0, '#B98A5E']] },
      { st: 'table', boxes: [[3.0, 0.1, 2.0, 1.2, 30, 0, '#D8B07A']] }
    ],
    sstate: {},
    items: [
      mk('sandwich', ['sandwich'], 'counter'),
      mk('apple', ['apple'], 'counter'),
      mk('lunchbox', ['lunchbox', 'lunch box'], 'table', { portable: false, heavy: LUNCH_HEAVY })
    ],
    check: function (w) { return w.items.sandwich.loc === 'in:lunchbox' && w.items.apple.loc === 'in:lunchbox'; },
    explain: function (w) {
      var out = [];
      ['sandwich', 'apple'].forEach(function (id) {
        if (w.items[id].loc !== 'in:lunchbox') out.push('the ' + id + ' is ' + where(w, id) + ', not in the lunchbox');
      });
      return out.join(', and ');
    }
  },
  {
    id: 'cookies', title: 'Cookie Jar', optimal: 5,
    job: 'Put all four cookies in the jar.',
    goal: 'The cookies are on the counter and the jar is on the table. Robot has one pair of hands, so it needs four trips. Can you say that in fewer lines?',
    greet: 'Four cookies. One pair of hands. I could do this with sixteen lines, but I hear there is a shortcut called repeat.',
    prefill: 'go to counter\npick up cookie\ngo to table\nput cookie in jar',
    vocab: ['go', 'pick', 'put', 'repeat'],
    hints: [
      'Writing the same four lines four times works, but earns fewer stars.',
      'Try "repeat 4 times" and then indent the lines to repeat by two spaces.',
      'Indented lines belong to the repeat line above them. Lines that are not indented run once, after the loop.'
    ],
    stations: [
      { id: 'counter', names: ['counter', 'kitchen counter'], stand: [1.8, 2.0], slots: [[0.55, 1.0, 36], [0.55, 1.6, 36], [0.55, 2.2, 36], [0.55, 2.8, 36]] },
      { id: 'table', names: ['table'], stand: [3.9, 1.85], slots: [[3.9, 0.7, 30]] }
    ],
    furniture: [
      { st: 'counter', boxes: [[0.1, 0.5, 0.9, 3.2, 36, 0, '#B98A5E']] },
      { st: 'table', boxes: [[3.0, 0.1, 2.0, 1.2, 30, 0, '#D8B07A']] }
    ],
    sstate: {},
    items: [
      cookieItem('cookie1', 'counter'), cookieItem('cookie2', 'counter'), cookieItem('cookie3', 'counter'), cookieItem('cookie4', 'counter'),
      mk('jar', ['jar', 'cookie jar'], 'table', { portable: false, heavy: JAR_HEAVY })
    ],
    check: function (w) {
      return ['cookie1', 'cookie2', 'cookie3', 'cookie4'].every(function (id) { return w.items[id].loc === 'in:jar'; });
    },
    explain: function (w) {
      var left = ['cookie1', 'cookie2', 'cookie3', 'cookie4'].filter(function (id) { return w.items[id].loc !== 'in:jar'; }).length;
      return left + (left === 1 ? ' cookie is' : ' cookies are') + ' still not in the jar';
    }
  }
];

/* ---------------------------------------------- sandbox and custom library */
var SB_STATIONS = [
  { id: 'shelf', names: ['shelf', 'closet'], stand: [1.6, 0.7], slots: [[0.5, 0.7, 44]] },
  { id: 'counter', names: ['counter', 'kitchen counter', 'bench'], stand: [1.8, 2.1], slots: [[0.55, 1.5, 36], [0.55, 1.8, 36], [0.55, 2.1, 36], [0.55, 2.4, 36], [0.55, 2.7, 36]] },
  { id: 'toaster', names: ['toaster'], stand: [1.8, 3.7], slots: [[0.55, 3.7, 47]] },
  { id: 'sink', names: ['sink', 'tap', 'faucet'], stand: [1.8, 5.05], slots: [[0.55, 5.05, 38]] },
  { id: 'drawer', names: ['drawer', 'cabinet'], stand: [2.4, 1.4], slots: [[2.25, 0.5, 32], [2.55, 0.5, 32]] },
  { id: 'table', names: ['table', 'plate'], stand: [4.0, 1.75], slots: [[3.6, 0.65, 30], [4.4, 0.65, 30], [4.0, 0.65, 30]] },
  { id: 'plant', names: ['plant', 'flower', 'pot'], stand: [5.5, 1.4], slots: [[5.5, 0.65, 21]] }
];
var SB_FURNITURE = [
  { st: 'shelf', boxes: [[0.1, 0.3, 0.8, 0.8, 44, 0, '#9A7B5B']] },
  { st: 'counter', boxes: [[0.1, 1.2, 0.9, 1.8, 36, 0, '#B98A5E']] },
  { st: 'toaster', boxes: [[0.1, 3.1, 0.9, 1.2, 36, 0, '#7F96AD'], [0.3, 3.4, 0.5, 0.6, 15, 36, '#C9D1D9']] },
  { st: 'sink', boxes: [[0.1, 4.4, 0.9, 1.4, 36, 0, '#8FA6B8'], [0.25, 4.65, 0.6, 0.9, 1.5, 36, '#5E7587'], [0.15, 5.0, 0.16, 0.16, 14, 37, '#C9D1D9']] },
  { st: 'drawer', boxes: [[2.0, 0.1, 0.8, 0.8, 32, 0, '#6F8FB8']] },
  { st: 'table', boxes: [[3.1, 0.1, 1.8, 1.1, 30, 0, '#D8B07A']] },
  { st: 'plant', boxes: [[5.15, 0.3, 0.7, 0.7, 20, 0, '#C26A4B']], deco: { t: 'plant', x: 5.5, y: 0.65, z: 20 } }
];
var SB_DEFAULT_LOC = {
  bread: 'counter', sandwich: 'counter', apple: 'counter', cookie1: 'counter', cookie2: 'counter',
  can: 'shelf', candle: 'drawer', matches: 'drawer', cake: 'table', lunchbox: 'table'
};
function libItems(locMap) {
  var m = locMap || SB_DEFAULT_LOC, out = [];
  function add(def) { if (m[def.id]) { def.loc = m[def.id]; out.push(def); } }
  add(breadItem('x'));
  add(mk('sandwich', ['sandwich'], 'x'));
  add(mk('apple', ['apple'], 'x'));
  add(cookieItem('cookie1', 'x'));
  add(cookieItem('cookie2', 'x'));
  add(canItem('x'));
  add(mk('candle', ['candle'], 'x', { state: { lit: false } }));
  add(mk('matches', ['matches', 'match', 'lighter'], 'x'));
  add(mk('cake', ['cake', 'birthday cake'], 'x', { portable: false, heavy: CAKE_HEAVY }));
  add(mk('lunchbox', ['lunchbox', 'lunch box'], 'x', { portable: false, heavy: LUNCH_HEAVY }));
  return out;
}
var ALL_VOCAB = ['go', 'pick', 'put', 'press', 'fill', 'pour', 'light', 'wait', 'repeat'];

var SANDBOX = {
  id: 'sandbox', sandbox: true, title: 'Sandbox', optimal: 0,
  job: 'Free play. No goal, no stars.',
  goal: 'Every object is in the room. Try things, break things, and see what Robot does. Everything you find goes in your collection.',
  greet: 'The whole room is yours. I will do whatever you tell me, exactly as you tell me.',
  prefill: '',
  vocab: ALL_VOCAB,
  hints: ['Try the cake, the toaster and the plant. Robot reacts differently to each.', 'Try pressing the tap without holding the can.', 'Try repeat 3 times with indented lines under it.'],
  stations: SB_STATIONS, furniture: SB_FURNITURE,
  sstate: { plant: { watered: false } },
  items: libItems(),
  check: function () { return false; },
  explain: function () { return ''; }
};

var LIB_ITEM_LIST = [
  { id: 'bread', name: 'Bread' }, { id: 'sandwich', name: 'Sandwich' }, { id: 'apple', name: 'Apple' },
  { id: 'cookie1', name: 'Cookie 1' }, { id: 'cookie2', name: 'Cookie 2' }, { id: 'can', name: 'Watering can' },
  { id: 'candle', name: 'Candle' }, { id: 'matches', name: 'Matches' }, { id: 'cake', name: 'Cake' }, { id: 'lunchbox', name: 'Lunchbox' }
];
var LIB_STATION_LIST = SB_STATIONS.map(function (s) { return { id: s.id, name: s.names[0] }; });
var CONTAINERS = { cake: ['on'], lunchbox: ['in', 'on'] };
var ITEM_LABEL = { bread: 'bread', sandwich: 'sandwich', apple: 'apple', cookie1: 'cookie 1', cookie2: 'cookie 2', can: 'watering can', candle: 'candle', matches: 'matches', cake: 'cake', lunchbox: 'lunchbox' };

/* -------------------------------------------------------------- helpers */
function stationDef(L, id) {
  for (var i = 0; i < L.stations.length; i++) if (L.stations[i].id === id) return L.stations[i];
  return null;
}
function stName(L, id) { var s = stationDef(L, id); return s ? s.names[0] : id; }
function itemDef(L, id) {
  for (var i = 0; i < L.items.length; i++) if (L.items[i].id === id) return L.items[i];
  return null;
}
function nameMatches(names, input) {
  for (var i = 0; i < names.length; i++) {
    var n = names[i];
    if (input === n) return true;
    if (input.length > n.length && input.slice(-(n.length + 1)) === ' ' + n) return true;
  }
  return false;
}
function findStation(L, name) {
  for (var i = 0; i < L.stations.length; i++) if (nameMatches(L.stations[i].names, name)) return L.stations[i];
  return null;
}
function findItems(L, name) {
  var out = [];
  for (var i = 0; i < L.items.length; i++) if (nameMatches(L.items[i].names, name)) out.push(L.items[i]);
  return out;
}
function chooseItem(w, name, mode) {
  var c = findItems(w.level, name), i;
  if (!c.length) return null;
  if (mode === 'pick') {
    for (i = 0; i < c.length; i++) if (c[i].portable && w.items[c[i].id].loc !== 'held' && stationOfItem(w, c[i].id) === w.robot.at) return c[i];
    for (i = 0; i < c.length; i++) if (w.items[c[i].id].loc !== 'held') return c[i];
  }
  if (mode === 'put') {
    for (i = 0; i < c.length; i++) if (w.items[c[i].id].loc === 'held') return c[i];
  }
  return c[0];
}
function itemName(w, id) {
  var d = itemDef(w.level, id);
  return d.label ? d.label(w) : d.names[0];
}
function isPron(n) {
  var ws = n.split(' ');
  for (var i = 0; i < ws.length; i++) if (PRON.indexOf(ws[i]) < 0) return false;
  return true;
}
function stationOfItem(w, id) {
  var loc = w.items[id].loc;
  if (loc === 'held') return w.robot.at;
  var m = loc.match(/^(in|on):(.+)$/);
  if (m) return stationOfItem(w, m[2]);
  return loc;
}
function where(w, id) {
  var it = w.items[id], loc = it.loc, m = loc.match(/^(in|on):(.+)$/);
  if (loc === 'held') return 'in Robot\'s hands';
  if (m) return (m[1] === 'in' ? 'inside the ' : 'on top of the ') + itemName(w, m[2]);
  if (it.state && it.state.inside) return 'inside the ' + stName(w.level, loc);
  return 'at the ' + stName(w.level, loc);
}

function makeWorld(L) {
  var w = { level: L, robot: { at: null, holding: null }, items: {}, sstate: {} };
  L.items.forEach(function (d) {
    var st = {};
    for (var k in d.state) st[k] = d.state[k];
    w.items[d.id] = { loc: d.loc, state: st };
  });
  for (var s in L.sstate) {
    w.sstate[s] = {};
    for (var k2 in L.sstate[s]) w.sstate[s][k2] = L.sstate[s][k2];
  }
  return w;
}
function cloneWorld(w) {
  var c = { level: w.level, robot: { at: w.robot.at, holding: w.robot.holding }, items: {}, sstate: {} };
  for (var id in w.items) {
    var st = {};
    for (var k in w.items[id].state) st[k] = w.items[id].state[k];
    c.items[id] = { loc: w.items[id].loc, state: st };
  }
  for (var s in w.sstate) { c.sstate[s] = {}; for (var k2 in w.sstate[s]) c.sstate[s][k2] = w.sstate[s][k2]; }
  return c;
}

/* --------------------------------------------------------------- parser */
function normalizeLine(raw) {
  var s = raw.toLowerCase();
  if (/[,;]/.test(s)) return { multi: true };
  s = s.replace(/[.!?:"]/g, ' ').replace(/\s+/g, ' ').trim();
  s = s.replace(/^(then|and) /, '');
  if (/\b(and|then)\b/.test(s)) return { multi: true };
  var words = s.split(' ').filter(function (x) { return x && STOP.indexOf(x) < 0; });
  return { text: words.join(' ') };
}

function parse(raw) {
  var n = normalizeLine(raw);
  if (n.multi) return { op: 'multi' };
  var s = n.text, m;
  if (!s) return { op: 'blank' };
  if ((m = s.match(/^repeat (\d+)(?: times?)?$/))) {
    var cnt = parseInt(m[1], 10);
    return (cnt >= 1 && cnt <= 10) ? { op: 'repeat', n: cnt } : { op: 'badrepeat', n: cnt };
  }
  if ((m = s.match(/^(?:go|walk|move|run|head|travel) (?:to|towards|toward|over to) (.+)$/))) return { op: 'go', a: m[1] };
  if ((m = s.match(/^pick (.+) up$/))) return { op: 'pick', a: m[1] };
  if ((m = s.match(/^(?:pick up|pickup|grab|take|get|fetch|lift) (.+?)(?: (?:from|off|out of) (.+))?$/))) return { op: 'pick', a: m[1], from: m[2] };
  if ((m = s.match(/^(?:put|place|set|insert|add) (.+?) (in|into|inside|on|onto) (.+)$/))) {
    return { op: 'put', a: m[1], prep: (m[2] === 'on' || m[2] === 'onto') ? 'on' : 'in', b: m[3] };
  }
  if ((m = s.match(/^(?:press|push|hit|click|flip|activate|start|switch on|turn on) (.+)$/))) return { op: 'press', a: m[1] };
  if ((m = s.match(/^fill(?: up)? (.+?)(?: (?:at|from|with|in) (.+))?$/))) return { op: 'fill', a: m[1] };
  if ((m = s.match(/^(?:pour|empty|dump) (.+?)(?: (?:on|onto|in|into|over) (.+))?$/))) return { op: 'pour', a: m[1], b: m[2] };
  if ((m = s.match(/^water (.+)$/))) return { op: 'water', a: m[1] };
  if ((m = s.match(/^(?:light|ignite) (.+)$/))) return { op: 'light', a: m[1] };
  if (/^(?:wait|rest|pause|stand)(?: \d+)?(?: seconds?)?$/.test(s)) return { op: 'wait' };
  return { op: 'unknown', word: s.split(' ')[0], text: s };
}

/* ----------------------------------------------- program plan (with loops) */
function plan(text) {
  var lines = String(text).split('\n'), items = [], i;
  for (i = 0; i < lines.length; i++) {
    var raw = lines[i];
    if (!raw.trim()) continue;
    var lead = raw.match(/^[ \t]*/)[0].replace(/\t/g, '  ').length;
    items.push({ line: i, raw: raw, indent: lead > 0 ? 1 : 0, cmd: parse(raw) });
  }
  var steps = [], k = 0;
  function err(it, kind, msg) { return { line: it.line, raw: it.raw, type: 'error', kind: kind, msg: msg }; }
  while (k < items.length) {
    var it = items[k];
    if (it.cmd.op === 'repeat') {
      if (it.indent > 0) { steps.push(err(it, 'loop_nested', 'Robot can only keep track of one loop at a time. A loop inside a loop makes Robot dizzy.')); break; }
      var body = [], j = k + 1;
      while (j < items.length && items[j].indent > 0) { body.push(items[j]); j++; }
      if (!body.length) {
        steps.push(err(it, 'loop_empty', 'Robot repeats nothing ' + it.cmd.n + ' times. Very efficient, but no job gets done. Indent the lines to repeat under the repeat line.'));
        break;
      }
      steps.push({ line: it.line, raw: it.raw, type: 'repeat', n: it.cmd.n });
      for (var r = 1; r <= it.cmd.n; r++) {
        for (var b = 0; b < body.length; b++) steps.push({ line: body[b].line, raw: body[b].raw, type: 'cmd', cmd: body[b].cmd, iter: r });
      }
      k = j;
    } else if (it.indent > 0) {
      steps.push(err(it, 'loop_orphan', 'Robot sees an indented line but no loop above it. Robot is confused about why it is indented.'));
      break;
    } else {
      steps.push({ line: it.line, raw: it.raw, type: 'cmd', cmd: it.cmd, iter: 0 });
      k++;
    }
  }
  return steps.length > 400 ? steps.slice(0, 400) : steps;
}

/* ------------------------------------------------------------ execution */
function exec(w, c) {
  var L = w.level, R = w.robot;
  function ok(m, kind) { return { ok: true, msg: m, kind: kind || null }; }
  function bad(m, kind) { return { ok: false, msg: m, kind: kind || null }; }
  function nothing(n) { return bad('Robot looks for "' + n + '" and finds nothing by that name.', 'nothing'); }
  function pron(n) {
    return isPron(n) ? bad('Robot has no idea what "' + n + '" means. Robot forgets every line as soon as it reads it. Name the thing.', 'pron') : null;
  }
  function far(label, stId, kind) {
    var here = R.at ? 'the ' + stName(L, R.at) : 'the middle of the room';
    var there = stName(L, stId);
    var head = label === there ? 'The ' + label + ' is over there' : 'The ' + label + ' is at the ' + there;
    return bad(head + ', but Robot is at ' + here + '. Robot\'s arms are not that long.', kind);
  }
  function ref(name) {
    var st = findStation(L, name);
    if (st) return { kind: 'st', id: st.id, label: st.names[0] };
    var d = chooseItem(w, name, 'any');
    if (d) return { kind: 'it', id: d.id, label: itemName(w, d.id) };
    return null;
  }
  function refStation(r) { return r.kind === 'st' ? r.id : stationOfItem(w, r.id); }
  var r, p, def, it, at;

  switch (c.op) {
    case 'multi':
      return bad('Robot can do only one thing per line. It heard several and froze. Put each action on its own line.', 'multi');

    case 'repeat':
      return bad('Robot can only keep track of one loop at a time. A loop inside a loop makes Robot dizzy.', 'loop_nested');

    case 'badrepeat':
      return bad('Robot will repeat between 1 and 10 times. Anything else is a lot to ask of a robot.', 'loop_range');

    case 'unknown':
      if (FORMS[c.word]) return bad('Robot knows the word "' + c.word + '" but not the way you used it. Try: ' + FORMS[c.word] + '.', 'bad_form');
      return bad('Robot does not know the word "' + c.word + '". It stares at you politely. Check the dictionary for the words it does know.', 'unknown_word');

    case 'go': {
      if ((p = pron(c.a))) return p;
      r = ref(c.a);
      if (!r) {
        var places = L.stations.map(function (s) { return s.names[0]; }).join(', ');
        return bad('Robot looked everywhere for a place called "' + c.a + '". Places here: ' + places + '.', 'go_nowhere');
      }
      if (r.kind === 'it') return bad('"' + c.a + '" is not a place, it is a ' + r.label + '. Robot walked at it anyway and bonked into the wall.', 'go_item');
      if (R.at === r.id) return ok('Robot is already at the ' + r.label + '. Robot stands there extra hard.', 'already_there');
      R.at = r.id;
      return ok('Robot walks to the ' + r.label + '.');
    }

    case 'pick': {
      if ((p = pron(c.a))) return p;
      def = chooseItem(w, c.a, 'pick');
      if (!def) {
        var st0 = findStation(L, c.a);
        if (st0) return bad('The ' + st0.names[0] + ' is bolted to the floor. Robot gives it a hug instead.', 'pick_bolted');
        return nothing(c.a);
      }
      it = w.items[def.id];
      if (it.loc === 'held') return bad('Robot is already holding the ' + itemName(w, def.id) + '.', 'pick_already');
      if (!def.portable) return bad(def.heavy || ('The ' + itemName(w, def.id) + ' is too heavy to lift.'), 'pick_heavy');
      at = stationOfItem(w, def.id);
      if (c.from) {
        var fr = ref(c.from);
        if (fr && refStation(fr) !== at) return bad('The ' + itemName(w, def.id) + ' is not at the ' + fr.label + '. Robot checks anyway, which takes a while.', 'pick_from');
      }
      if (at !== R.at) return far(itemName(w, def.id), at, 'pick_far');
      if (R.holding) return bad('Robot\'s hands are full (it is holding the ' + itemName(w, R.holding) + '). Robot is not an octopus.', 'pick_full');
      it.loc = 'held'; it.state.inside = false; R.holding = def.id;
      return ok('Robot picks up the ' + itemName(w, def.id) + '.');
    }

    case 'put': {
      if ((p = pron(c.a))) return p;
      if ((p = pron(c.b))) return p;
      def = chooseItem(w, c.a, 'put');
      if (!def) {
        return findStation(L, c.a) ? bad('Robot cannot put the ' + c.a + ' anywhere. It is a place, not a thing.', 'put_place') : nothing(c.a);
      }
      it = w.items[def.id];
      var nmItem = itemName(w, def.id);
      if (it.loc !== 'held') {
        return bad('Robot is not holding the ' + nmItem + '. It tries to put it ' + c.prep + ' the ' + c.b + ' using mind powers. Mind powers are not installed.', 'put_unheld');
      }
      var tst = findStation(L, c.b), tdef = tst ? null : chooseItem(w, c.b, 'any');
      if (!tst && !tdef) return nothing(c.b);
      if (!tst && tdef.id === def.id) return bad('Robot tries to put the ' + nmItem + ' ' + c.prep + ' itself. Physics says no.', 'put_self');
      var tStation = tst ? tst.id : stationOfItem(w, tdef.id);
      var tLabel = tst ? tst.names[0] : itemName(w, tdef.id);
      if (tStation !== R.at) return far(tLabel, tStation, 'put_far');
      R.holding = null;
      var extra = '', quirk = null;
      if (tst) {
        it.loc = tst.id; it.state.inside = (c.prep === 'in');
        if (tst.id === 'toaster') {
          if (c.prep === 'in') extra = ' It slides into the slot.';
          else { extra = ' It sits on top. It is not toasting.'; quirk = 'toaster_top'; }
        }
        if (tst.id === 'plant' && def.id === 'can') { extra = ' The plant is now under a watering can. The plant did not ask for this.'; quirk = 'can_on_plant'; }
      } else {
        it.loc = c.prep + ':' + tdef.id;
        if (tdef.id === 'cake' && def.id === 'candle') { extra = ' It looks very festive. It is not lit.'; quirk = 'candle_dark'; }
      }
      return ok('Robot puts the ' + nmItem + ' ' + c.prep + ' the ' + tLabel + '.' + extra, quirk);
    }

    case 'press': {
      if ((p = pron(c.a))) return p;
      r = ref(c.a);
      if (!r) return nothing(c.a);
      at = refStation(r);
      if (at !== R.at) return far(r.label, at, 'press_far');
      if (r.id === 'toaster') {
        var b = w.items.bread;
        if (b && b.loc === 'toaster' && b.state.inside) {
          if (b.state.toasted) return ok('Ding. The toast is already toast. Now it is warm toast.', 'toast_warm');
          b.state.toasted = true;
          return ok('Ding. The bread is toast now, which was the plan all along.');
        }
        return ok('The toaster heats up and toasts nothing. It seems proud of itself.', 'toast_empty');
      }
      if (r.id === 'sink') {
        var cn = w.items.can;
        if (cn && cn.loc === 'held') { cn.state.full = true; return ok('Water runs into the can. The can is full.'); }
        return ok('Water runs onto the floor. Robot watches it. The floor is now wet.', 'sink_floor');
      }
      return ok('Robot presses the ' + r.label + '. Nothing happens. It is not that kind of thing.', 'press_nothing');
    }

    case 'fill': {
      if ((p = pron(c.a))) return p;
      def = chooseItem(w, c.a, 'any');
      if (!def) return nothing(c.a);
      if (def.id !== 'can') return bad('Robot cannot fill the ' + itemName(w, def.id) + '. Try something that holds water.', 'fill_wrong');
      if (w.items.can.loc !== 'held') return bad('Robot is not holding the can. It tries to fill the air. The air is not impressed.', 'fill_air');
      if (R.at !== 'sink') return bad('There is no water here. Robot holds the can up and hopes for rain.', 'fill_dry');
      w.items.can.state.full = true;
      return ok('The can fills up. Robot is very proud of this.');
    }

    case 'pour': {
      if ((p = pron(c.a))) return p;
      def = chooseItem(w, c.a, 'any');
      if (!def) return nothing(c.a);
      if (def.id !== 'can') return bad('Robot cannot pour the ' + itemName(w, def.id) + '. It is not a pourable thing.', 'pour_wrong');
      if (w.items.can.loc !== 'held') return bad('Robot is not holding the can. It mimes pouring. Nothing is watered.', 'pour_air');
      if (!c.b) return bad('Pour it onto what? Robot is waiting, can raised, until you say.', 'pour_where');
      if ((p = pron(c.b))) return p;
      var tgt = findStation(L, c.b);
      if (!tgt) return nothing(c.b);
      if (tgt.id !== R.at) return far(tgt.names[0], tgt.id, 'put_far');
      if (!w.items.can.state.full) return bad('Robot tips the can over the ' + tgt.names[0] + '. Nothing comes out. The can is empty, and the plant knows it.', 'pour_empty');
      w.items.can.state.full = false;
      if (tgt.id === 'plant') { w.sstate.plant.watered = true; return ok('Water pours onto the plant. The plant perks up and looks relieved.'); }
      return ok('Robot pours water on the ' + tgt.names[0] + '. It is now wet. That was not the plan.', 'pour_wet');
    }

    case 'water': {
      if ((p = pron(c.a))) return p;
      var ws = findStation(L, c.a);
      if (!ws) return nothing(c.a);
      var cn2 = w.items.can;
      if (!cn2 || cn2.loc !== 'held') return bad('Robot waters the ' + ws.names[0] + ' with nothing but good intentions. The plant is not fooled.', 'water_air');
      return exec(w, { op: 'pour', a: 'can', b: c.a });
    }

    case 'light': {
      if ((p = pron(c.a))) return p;
      r = ref(c.a);
      if (!r) return nothing(c.a);
      if (r.id !== 'candle') return bad('Robot cannot light the ' + r.label + '. It is not that kind of thing.', 'light_wrong');
      if (w.items.candle.state.lit) return ok('The candle is already lit. Robot lights it again for good measure.', 'already_lit');
      var mt = w.items.matches;
      if (!mt || mt.loc !== 'held') return bad('Robot has nothing to light it with. Robot rubs its hands together. Nothing happens.', 'light_nomatch');
      at = stationOfItem(w, 'candle');
      if (at !== R.at) return far('candle', at, 'light_far');
      w.items.candle.state.lit = true;
      return ok('Fwoosh. The candle is lit. Robot takes a moment to appreciate fire.');
    }

    case 'wait':
      return ok('Robot waits. Robot is very good at this.', 'wait');
  }
  return bad('Robot is confused and has gone quiet.', 'unknown_word');
}

// Runs one planned step (cmd, repeat header, or error) against the world.
function execStep(w, step) {
  if (step.type === 'repeat') return { ok: true, msg: 'Robot will repeat the next lines ' + step.n + (step.n === 1 ? ' time.' : ' times.'), kind: null };
  if (step.type === 'error') return { ok: false, msg: step.msg, kind: step.kind };
  return exec(w, step.cmd);
}

function check(w) { return !!w.level.check(w); }
function explain(w) { return w.level.explain(w); }
function countLines(text) {
  return String(text).split('\n').filter(function (l) { return l.trim(); }).length;
}
function starsFor(level, lines) {
  var opt = level.optimal;
  return lines <= opt ? 3 : (lines <= opt + 2 ? 2 : 1);
}
function levelById(id) {
  for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === id) return LEVELS[i];
  return id === 'sandbox' ? SANDBOX : null;
}

/* ------------------------------------------------------- custom levels */
var CLAUSE_KINDS = ['at', 'in', 'on', 'toasted', 'lit', 'watered', 'full'];
function validateSpec(raw) {
  function fail(e) { return { ok: false, error: e }; }
  if (!raw || typeof raw !== 'object') return fail('This level code is not valid.');
  var stIds = LIB_STATION_LIST.map(function (s) { return s.id; });
  var itIds = LIB_ITEM_LIST.map(function (s) { return s.id; });
  var s = { t: String(raw.t || 'My level').slice(0, 40), j: String(raw.j || '').slice(0, 140), s: [], i: {}, g: [], o: 0 };
  (Array.isArray(raw.s) ? raw.s : []).forEach(function (id) { if (stIds.indexOf(id) >= 0 && s.s.indexOf(id) < 0) s.s.push(id); });
  if (!s.s.length) return fail('Add at least one piece of furniture to the room.');
  var ri = raw.i && typeof raw.i === 'object' ? raw.i : {};
  itIds.forEach(function (id) { if (ri[id] && s.s.indexOf(ri[id]) >= 0) s.i[id] = ri[id]; });
  if (!Object.keys(s.i).length) return fail('Place at least one item in the room.');
  var rg = Array.isArray(raw.g) ? raw.g.slice(0, 3) : [];
  for (var n = 0; n < rg.length; n++) {
    var c = rg[n];
    if (!c || CLAUSE_KINDS.indexOf(c.k) < 0) return fail('One of the goals is not valid.');
    var clause = { k: c.k };
    if (c.k === 'at' || c.k === 'in' || c.k === 'on' || c.k === 'toasted' || c.k === 'lit' || c.k === 'full') {
      if (c.k === 'toasted') c.i = 'bread'; if (c.k === 'lit') c.i = 'candle'; if (c.k === 'full') c.i = 'can';
      if (!s.i[c.i]) return fail('A goal mentions an item that is not in the room.');
      clause.i = c.i;
    }
    if (c.k === 'at') {
      if (s.s.indexOf(c.t) < 0) return fail('A goal mentions furniture that is not in the room.');
      if (CONTAINERS[c.i]) return fail('The ' + ITEM_LABEL[c.i] + ' cannot be moved, so it cannot be a goal destination.');
      clause.t = c.t;
    }
    if (c.k === 'in' || c.k === 'on') {
      if (!CONTAINERS[c.t] || CONTAINERS[c.t].indexOf(c.k) < 0) return fail('Things can only go in the lunchbox, or on the cake or lunchbox.');
      if (!s.i[c.t]) return fail('A goal mentions a container that is not in the room.');
      if (c.i === c.t || CONTAINERS[c.i]) return fail('A goal puts something where it cannot go.');
      clause.t = c.t;
    }
    if (c.k === 'toasted' && s.s.indexOf('toaster') < 0) return fail('A toasted goal needs a toaster in the room.');
    if (c.k === 'lit' && !s.i.matches) return fail('A lit candle goal needs the matches in the room.');
    if (c.k === 'watered') {
      if (s.s.indexOf('plant') < 0 || !s.i.can || s.s.indexOf('sink') < 0) return fail('A watered plant goal needs a plant, a sink and a watering can.');
    }
    if (c.k === 'full' && s.s.indexOf('sink') < 0) return fail('A full can goal needs a sink in the room.');
    rg[n] = clause;
  }
  if (!rg.length) return fail('Add at least one goal.');
  s.g = rg;
  s.o = Math.max(0, Math.min(40, parseInt(raw.o, 10) || 0));
  return { ok: true, spec: s };
}

function clausePhrase(c) {
  var stName2 = function (id) { for (var i = 0; i < SB_STATIONS.length; i++) if (SB_STATIONS[i].id === id) return SB_STATIONS[i].names[0]; return id; };
  switch (c.k) {
    case 'at': return 'the ' + ITEM_LABEL[c.i] + ' is at the ' + stName2(c.t);
    case 'in': return 'the ' + ITEM_LABEL[c.i] + ' is inside the ' + ITEM_LABEL[c.t];
    case 'on': return 'the ' + ITEM_LABEL[c.i] + ' is on top of the ' + ITEM_LABEL[c.t];
    case 'toasted': return 'the bread is toasted';
    case 'lit': return 'the candle is lit';
    case 'watered': return 'the plant is watered';
    case 'full': return 'the watering can is full';
  }
  return '';
}
function clauseOk(w, c) {
  var it = c.i ? w.items[c.i] : null;
  switch (c.k) {
    case 'at': return it.loc === c.t;
    case 'in': return it.loc === 'in:' + c.t;
    case 'on': return it.loc === 'on:' + c.t;
    case 'toasted': return !!it.state.toasted;
    case 'lit': return !!it.state.lit;
    case 'watered': return !!(w.sstate.plant && w.sstate.plant.watered);
    case 'full': return !!it.state.full;
  }
  return false;
}

function compileCustom(raw) {
  var v = validateSpec(raw);
  if (!v.ok) return null;
  var s = v.spec;
  var locMap = {};
  for (var id in s.i) locMap[id] = s.i[id];
  var phrases = s.g.map(clausePhrase);
  var L = {
    id: 'custom', custom: true, title: s.t, optimal: s.o || 99, spec: s,
    job: s.j || 'Make it so: ' + phrases.join(', and ') + '.',
    goal: 'Goal: ' + phrases.join(', and ') + '. This room was built by a player. Read it carefully.',
    greet: 'Somebody built this room for me. I have not seen it before, and I will do exactly what you write.',
    prefill: '', vocab: ALL_VOCAB,
    hints: ['Read the goal again. Every part of it has to be true when Robot finishes.', 'Robot carries only one thing at a time.', 'Try the Step button to see exactly where things go wrong.'],
    stations: SB_STATIONS.filter(function (x) { return s.s.indexOf(x.id) >= 0; }),
    furniture: SB_FURNITURE.filter(function (x) { return s.s.indexOf(x.st) >= 0; }),
    sstate: s.s.indexOf('plant') >= 0 ? { plant: { watered: false } } : {},
    items: libItems(locMap),
    check: function (w) { return s.g.every(function (c) { return clauseOk(w, c); }); },
    explain: function (w) {
      return s.g.filter(function (c) { return !clauseOk(w, c); }).map(function (c) { return 'not yet: ' + clausePhrase(c); }).join(', and ');
    }
  };
  return L;
}


// Lenient room for the level editor's live preview: no goals required.
function previewLevel(raw) {
  raw = raw || {};
  var stIds = LIB_STATION_LIST.map(function (x) { return x.id; });
  var sel = (Array.isArray(raw.s) ? raw.s : []).filter(function (id, k, a) { return stIds.indexOf(id) >= 0 && a.indexOf(id) === k; });
  var locMap = {};
  var ri = raw.i && typeof raw.i === 'object' ? raw.i : {};
  LIB_ITEM_LIST.forEach(function (d) { if (ri[d.id] && sel.indexOf(ri[d.id]) >= 0) locMap[d.id] = ri[d.id]; });
  return {
    id: 'preview', custom: true, title: String(raw.t || 'My level').slice(0, 40), optimal: 99, job: '', goal: '', greet: '', prefill: '',
    vocab: ALL_VOCAB, hints: ['', '', ''],
    stations: SB_STATIONS.filter(function (x) { return sel.indexOf(x.id) >= 0; }),
    furniture: SB_FURNITURE.filter(function (x) { return sel.indexOf(x.st) >= 0; }),
    sstate: sel.indexOf('plant') >= 0 ? { plant: { watered: false } } : {},
    items: libItems(locMap), check: function () { return false; }, explain: function () { return ''; }
  };
}

function b64enc(str) {
  var b = (typeof Buffer !== 'undefined') ? Buffer.from(str, 'utf8').toString('base64') : btoa(unescape(encodeURIComponent(str)));
  return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64dec(s) {
  s = String(s).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return (typeof Buffer !== 'undefined') ? Buffer.from(s, 'base64').toString('utf8') : decodeURIComponent(escape(atob(s)));
}
function encodeSpec(spec) { return b64enc(JSON.stringify(spec)); }
function decodeSpec(code) {
  try {
    var o = JSON.parse(b64dec(String(code).trim()));
    var v = validateSpec(o);
    return v.ok ? v.spec : null;
  } catch (e) { return null; }
}

/* --------------------------------------------------------- Bug of the Day */
var DAILY_EPOCH = '2026-10-25';
var DAILY = [
  { level: 'toast', title: 'Pale toast',
    program: 'go to counter\npick up bread\ngo to toaster\nput bread in toaster\npick up bread\ngo to plate\nput bread on plate',
    solution: 'go to counter\npick up bread\ngo to toaster\nput bread in toaster\npress toaster\npick up bread\ngo to plate\nput bread on plate' },
  { level: 'toast', title: 'Toast on top',
    program: 'go to counter\npick up bread\ngo to toaster\nput bread on toaster\npress toaster\npick up bread\ngo to plate\nput bread on plate',
    solution: 'go to counter\npick up bread\ngo to toaster\nput bread in toaster\npress toaster\npick up bread\ngo to plate\nput bread on plate' },
  { level: 'plant', title: 'Empty can',
    program: 'go to shelf\npick up can\ngo to plant\npour can on plant',
    solution: 'go to shelf\npick up can\ngo to sink\nfill can\ngo to plant\npour can on plant' },
  { level: 'plant', title: 'Long arms',
    program: 'go to shelf\npick up can\ngo to sink\nfill can\npour can on plant',
    solution: 'go to shelf\npick up can\ngo to sink\nfill can\ngo to plant\npour can on plant' },
  { level: 'candle', title: 'Two hands',
    program: 'go to drawer\npick up candle\npick up matches\ngo to table\nput candle on cake\nlight candle',
    solution: 'go to drawer\npick up candle\ngo to table\nput candle on cake\ngo to drawer\npick up matches\ngo to table\nlight candle' },
  { level: 'candle', title: 'Long-distance fire',
    program: 'go to drawer\npick up candle\ngo to table\nput candle on cake\ngo to drawer\npick up matches\nlight candle',
    solution: 'go to drawer\npick up candle\ngo to table\nput candle on cake\ngo to drawer\npick up matches\ngo to table\nlight candle' },
  { level: 'lunchbox', title: 'Lid on top',
    program: 'go to counter\npick up sandwich\ngo to table\nput sandwich on lunchbox\ngo to counter\npick up apple\ngo to table\nput apple on lunchbox',
    solution: 'go to counter\npick up sandwich\ngo to table\nput sandwich in lunchbox\ngo to counter\npick up apple\ngo to table\nput apple in lunchbox' },
  { level: 'lunchbox', title: 'Greedy robot',
    program: 'go to counter\npick up sandwich\npick up apple\ngo to table\nput sandwich in lunchbox\nput apple in lunchbox',
    solution: 'go to counter\npick up sandwich\ngo to table\nput sandwich in lunchbox\ngo to counter\npick up apple\ngo to table\nput apple in lunchbox' },
  { level: 'cookies', title: 'Only three',
    program: 'repeat 3 times\n  go to counter\n  pick up cookie\n  go to table\n  put cookie in jar',
    solution: 'repeat 4 times\n  go to counter\n  pick up cookie\n  go to table\n  put cookie in jar' },
  { level: 'cookies', title: 'Flat program',
    program: 'repeat 4 times\ngo to counter\npick up cookie\ngo to table\nput cookie in jar',
    solution: 'repeat 4 times\n  go to counter\n  pick up cookie\n  go to table\n  put cookie in jar' }
];
function daysBetween(a, b) {
  function ms(s) { var p = s.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  return Math.round((ms(b) - ms(a)) / 86400000);
}
function dailyInfo(dateStr) {
  var n = Math.max(1, daysBetween(DAILY_EPOCH, dateStr) + 1);
  var entry = DAILY[(n - 1) % DAILY.length];
  return { number: n, entry: entry, level: levelById(entry.level), date: dateStr };
}

var api = {
  LEVELS: LEVELS, SANDBOX: SANDBOX, DAILY: DAILY, CATALOG: CATALOG, FORMS: FORMS,
  LIB_ITEM_LIST: LIB_ITEM_LIST, LIB_STATION_LIST: LIB_STATION_LIST, CONTAINERS: CONTAINERS, ITEM_LABEL: ITEM_LABEL,
  ALL_VOCAB: ALL_VOCAB, SB_STATIONS: SB_STATIONS,
  makeWorld: makeWorld, cloneWorld: cloneWorld, parse: parse, plan: plan, exec: exec, execStep: execStep,
  check: check, explain: explain, countLines: countLines, starsFor: starsFor, levelById: levelById,
  stationOfItem: stationOfItem, itemName: itemName, where: where, stationDef: stationDef, itemDef: itemDef,
  validateSpec: validateSpec, compileCustom: compileCustom, encodeSpec: encodeSpec, decodeSpec: decodeSpec,
  clausePhrase: clausePhrase, previewLevel: previewLevel, dailyInfo: dailyInfo, daysBetween: daysBetween
};
root.Game = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
