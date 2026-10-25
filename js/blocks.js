(function (root) {
'use strict';

/* Drag-and-drop block editor. The program text stays the single source of truth:
   every block is one line of text, and any line that is not a known block shows as a plain text block. */
var G = root.Game, U = root.UI, el = U.el, clear = U.clear;

var TYPES = {
  go:     { tpl: ['go to ', 'stations'],                            re: /^go to (.+)$/,                       label: 'go to …' },
  pick:   { tpl: ['pick up ', 'portable'],                          re: /^pick up (.+)$/,                     label: 'pick up …' },
  put:    { tpl: ['put ', 'portable', ' ', 'prep', ' ', 'targets'], re: /^put (.+?) (in|on) (.+)$/,           label: 'put … in/on …' },
  press:  { tpl: ['press ', 'stations'],                            re: /^press (.+)$/,                       label: 'press …' },
  fill:   { tpl: ['fill ', 'can'],                                  re: /^fill (.+)$/,                        label: 'fill …' },
  pour:   { tpl: ['pour ', 'can', ' on ', 'stations'],              re: /^pour (.+?) on (.+)$/,               label: 'pour … on …' },
  light:  { tpl: ['light ', 'lightable'],                           re: /^light (.+)$/,                       label: 'light …' },
  wait:   { tpl: ['wait'],                                          re: /^wait$/,                             label: 'wait' },
  repeat: { tpl: ['repeat ', 'num', ' times'],                      re: /^repeat (\d+) times$/,               label: 'repeat … times' }
};
var ORDER = ['go', 'pick', 'put', 'press', 'fill', 'pour', 'light', 'wait', 'repeat'];

function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }

function optionSets(level) {
  var stations = level.stations.map(function (s) { return s.names[0]; });
  var portable = uniq(level.items.filter(function (d) { return d.portable; }).map(function (d) { return d.pick[0]; }));
  var containers = uniq(level.items.filter(function (d) { return !d.portable; }).map(function (d) { return d.pick[0]; }));
  var hasCan = level.items.some(function (d) { return d.id === 'can'; });
  var hasCandle = level.items.some(function (d) { return d.id === 'candle'; });
  return {
    stations: stations, portable: portable, targets: stations.concat(containers), prep: ['in', 'on'],
    can: hasCan ? ['can'] : [], lightable: hasCandle ? ['candle'] : [],
    num: ['2', '3', '4', '5', '6', '7', '8', '9', '10']
  };
}

function create(cfg) {
  // cfg: { list, palette, getText, setText, onAdd }
  var level = null, sets = null, lines = [], dragFrom = -1;
  var t = function (k) { return root.I18N ? root.I18N.t(k) : k; };

  function readLines() { lines = String(cfg.getText()).split('\n').filter(function (l) { return l.trim(); }); }
  function commit() { cfg.setText(lines.join('\n')); render(); }
  function isInd(l) { return /^[ \t]/.test(l); }

  function defaultLine(type, indent) {
    var d = TYPES[type], s = '';
    d.tpl.forEach(function (p) { s += (sets[p] ? (type === 'repeat' ? '4' : sets[p][0]) : p); });
    return (indent ? '  ' : '') + s;
  }
  function addAt(type, idx) {
    if (!sets) return;
    var prev = idx > 0 ? lines[idx - 1] : '';
    var indent = prev && (isInd(prev) || /^\s*repeat\b/i.test(prev)) && type !== 'repeat';
    lines.splice(idx, 0, defaultLine(type, indent));
    if (cfg.onAdd) cfg.onAdd(type);
    commit();
  }

  function parseBlock(line) {
    var body = line.replace(/^[ \t]+/, '');
    for (var i = 0; i < ORDER.length; i++) {
      var type = ORDER[i], d = TYPES[type], m = body.match(d.re);
      if (!m) continue;
      var vals = [], mi = 1, ok = true;
      d.tpl.forEach(function (p) {
        if (!sets[p]) return;
        var v = m[mi++];
        if (sets[p].indexOf(v) < 0) ok = false;
        vals.push(v);
      });
      if (ok) return { type: type, vals: vals };
    }
    return null;
  }

  function buildLine(type, vals, indent) {
    var d = TYPES[type], k = 0, s = '';
    d.tpl.forEach(function (p) { s += sets[p] ? vals[k++] : p; });
    return (indent ? '  ' : '') + s;
  }

  function btn(txt, label, fn, disabled) {
    return el('button', { type: 'button', 'aria-label': label, title: label, text: txt, disabled: disabled, on: { click: fn } });
  }

  function card(line, i) {
    var info = parseBlock(line), ind = isInd(line);
    var li = el('li', { class: 'blk' + (ind ? ' ind' : '') + (info && info.type === 'repeat' ? ' rep' : ''), 'data-i': String(i) });
    var grip = el('span', { class: 'grip', 'aria-hidden': 'true', text: '⠇' });
    grip.addEventListener('mousedown', function () { li.draggable = true; });
    li.addEventListener('dragstart', function (e) {
      dragFrom = i;
      try { e.dataTransfer.setData('text/plain', 'move:' + i); e.dataTransfer.effectAllowed = 'move'; } catch (x) { /* ignore */ }
    });
    li.addEventListener('dragend', function () { li.draggable = false; dragFrom = -1; clearMarks(); });
    li.appendChild(grip);

    if (info) {
      var d = TYPES[info.type], vi = 0, selects = [];
      d.tpl.forEach(function (p) {
        if (!sets[p]) { li.appendChild(document.createTextNode(p)); return; }
        var cur = info.vals[vi++];
        var sel = el('select', { 'aria-label': p }, sets[p].map(function (o) { return el('option', { value: o, text: o }); }));
        sel.value = cur;
        selects.push(sel);
        sel.addEventListener('change', function () {
          lines[i] = buildLine(info.type, selects.map(function (s) { return s.value; }), isInd(lines[i]));
          commit();
        });
        li.appendChild(sel);
      });
    } else {
      var inp = el('input', { type: 'text', class: 'raw', value: line.replace(/^[ \t]+/, ''), 'aria-label': t('blk.raw'), spellcheck: 'false' });
      inp.addEventListener('change', function () { lines[i] = (isInd(lines[i]) ? '  ' : '') + inp.value; commit(); });
      li.appendChild(inp);
    }

    var ops = el('span', { class: 'ops' }, [
      btn('↑', t('blk.up'), function () { if (i > 0) { var x = lines[i - 1]; lines[i - 1] = lines[i]; lines[i] = x; commit(); } }, i === 0),
      btn('↓', t('blk.down'), function () { if (i < lines.length - 1) { var x = lines[i + 1]; lines[i + 1] = lines[i]; lines[i] = x; commit(); } }, i === lines.length - 1),
      btn(ind ? '⇤' : '⇥', ind ? t('blk.outdent') : t('blk.indent'), function () { lines[i] = ind ? lines[i].replace(/^[ \t]+/, '') : '  ' + lines[i]; commit(); }),
      btn('×', t('blk.del'), function () { lines.splice(i, 1); commit(); })
    ]);
    li.appendChild(ops);
    return li;
  }

  function clearMarks() {
    for (var k = 0; k < cfg.list.children.length; k++) {
      var c = cfg.list.children[k];
      if (c.classList) { c.classList.remove('drop-before'); c.classList.remove('drop-after'); }
    }
    cfg.list.classList.remove('over');
  }
  function indexFor(y) {
    var kids = cfg.list.children;
    for (var k = 0; k < kids.length; k++) {
      var c = kids[k];
      if (!c.getAttribute || c.getAttribute('data-i') === null) continue;
      var r = c.getBoundingClientRect();
      if (y < r.top + r.height / 2) return parseInt(c.getAttribute('data-i'), 10);
    }
    return lines.length;
  }

  function renderPalette() {
    clear(cfg.palette);
    if (!level) return;
    level.vocab.forEach(function (v) {
      if (!TYPES[v]) return;
      var d = TYPES[v], usable = d.tpl.every(function (p) { return !sets[p] || sets[p].length; });
      if (!usable) return;
      var chip = el('button', { type: 'button', class: 'pchip', draggable: 'true', text: d.label, 'aria-label': t('blk.add') + ' ' + d.label });
      chip.addEventListener('click', function () { readLines(); addAt(v, lines.length); });
      chip.addEventListener('dragstart', function (e) {
        try { e.dataTransfer.setData('text/plain', 'new:' + v); e.dataTransfer.effectAllowed = 'copy'; } catch (x) { /* ignore */ }
      });
      cfg.palette.appendChild(chip);
    });
  }

  function render() {
    readLines();
    clear(cfg.list);
    if (!lines.length) cfg.list.appendChild(el('li', { class: 'empty', text: t('blk.empty') }));
    lines.forEach(function (l, i) { cfg.list.appendChild(card(l, i)); });
  }

  cfg.list.addEventListener('dragover', function (e) {
    e.preventDefault();
    clearMarks();
    cfg.list.classList.add('over');
    var idx = indexFor(e.clientY), kids = cfg.list.children;
    for (var k = 0; k < kids.length; k++) {
      if (kids[k].getAttribute && kids[k].getAttribute('data-i') === String(idx)) { kids[k].classList.add('drop-before'); return; }
    }
    if (kids.length && kids[kids.length - 1].classList && kids[kids.length - 1].getAttribute('data-i') !== null) kids[kids.length - 1].classList.add('drop-after');
  });
  cfg.list.addEventListener('dragleave', function (e) { if (e.target === cfg.list) clearMarks(); });
  cfg.list.addEventListener('drop', function (e) {
    e.preventDefault();
    var data = '';
    try { data = e.dataTransfer.getData('text/plain') || ''; } catch (x) { /* ignore */ }
    var idx = indexFor(e.clientY);
    clearMarks();
    readLines();
    if (data.indexOf('new:') === 0 && TYPES[data.slice(4)]) { addAt(data.slice(4), idx); return; }
    var from = data.indexOf('move:') === 0 ? parseInt(data.slice(5), 10) : dragFrom;
    if (from >= 0 && from < lines.length) {
      var moved = lines.splice(from, 1)[0];
      if (idx > from) idx--;
      lines.splice(Math.max(0, Math.min(lines.length, idx)), 0, moved);
      commit();
    }
  });

  return {
    setLevel: function (L) { level = L; sets = optionSets(L); renderPalette(); render(); },
    render: function () { if (level) { renderPalette(); render(); } },
    // exposed for tests
    _parse: function (line) { return parseBlock(line); },
    _add: function (type) { readLines(); addAt(type, lines.length); }
  };
}

root.Blocks = { create: create, TYPES: TYPES };
})(typeof window !== 'undefined' ? window : globalThis);
