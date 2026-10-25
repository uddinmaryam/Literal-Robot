(function (root) {
'use strict';

/* Level editor: pick furniture, place items, set up to three goals, test it, share it. */
var G = root.Game, U = root.UI, el = U.el, $ = U.$, clear = U.clear;

var KINDS = ['at', 'in', 'on', 'toasted', 'lit', 'watered', 'full'];
var FIXED_ITEM = { toasted: 'bread', lit: 'candle', full: 'can' };

function defaultDraft() {
  return { t: '', j: '', s: ['counter', 'table'], i: { bread: 'counter' }, g: [{ k: 'at', i: 'bread', t: 'table' }], o: 0 };
}
function copy(o) { return JSON.parse(JSON.stringify(o)); }

function create(cfg) {
  // cfg: { scene, onTest(spec), t(key), onChange(draft), draft }
  var t = cfg.t, D = cfg.draft ? copy(cfg.draft) : defaultDraft();
  var scene = cfg.scene;

  function portableIds() { return G.LIB_ITEM_LIST.filter(function (d) { return !G.CONTAINERS[d.id] && D.i[d.id]; }); }
  function containerIds() { return G.LIB_ITEM_LIST.filter(function (d) { return G.CONTAINERS[d.id] && D.i[d.id]; }); }

  // Drop references to things that are no longer in the room.
  function normalize() {
    var first = D.s[0];
    Object.keys(D.i).forEach(function (id) {
      if (D.s.indexOf(D.i[id]) < 0) { if (first) D.i[id] = first; else delete D.i[id]; }
    });
    D.g = D.g.filter(function (c) {
      if (c.i && !D.i[c.i]) return false;
      if (c.k === 'at' && D.s.indexOf(c.t) < 0) return false;
      if ((c.k === 'in' || c.k === 'on') && !D.i[c.t]) return false;
      return true;
    });
  }

  function changed(resetShare) {
    normalize();
    if (cfg.onChange) cfg.onChange(D, resetShare !== false);
    renderPreview();
  }

  /* ---- furniture ---- */
  function renderStations() {
    var box = clear($('cStations'));
    G.LIB_STATION_LIST.forEach(function (s) {
      var id = 'cs-' + s.id, on = D.s.indexOf(s.id) >= 0;
      var inp = el('input', { type: 'checkbox', id: id, checked: on });
      inp.addEventListener('change', function () {
        if (inp.checked) { if (D.s.indexOf(s.id) < 0) D.s.push(s.id); }
        else D.s = D.s.filter(function (x) { return x !== s.id; });
        changed(); renderItems(); renderGoals();
      });
      box.appendChild(el('label', { class: 'check', for: id }, [inp, el('span', { text: s.name })]));
    });
  }

  /* ---- items ---- */
  function stationSelect(cur, onPick) {
    var sel = el('select', { 'aria-label': t('create.startsAt') }, D.s.map(function (id) {
      return el('option', { value: id, text: G.LIB_STATION_LIST.filter(function (x) { return x.id === id; })[0].name });
    }));
    sel.value = cur;
    sel.addEventListener('change', function () { onPick(sel.value); });
    return sel;
  }
  function renderItems() {
    var box = clear($('cItems'));
    if (!D.s.length) { box.appendChild(el('p', { class: 'muted small-text', text: t('create.needFurniture') })); return; }
    G.LIB_ITEM_LIST.forEach(function (d) {
      var id = 'ci-' + d.id, on = !!D.i[d.id];
      var inp = el('input', { type: 'checkbox', id: id, checked: on });
      inp.addEventListener('change', function () {
        if (inp.checked) D.i[d.id] = D.s[0]; else delete D.i[d.id];
        changed(); renderItems(); renderGoals();
      });
      var row = el('div', { class: 'itemrow' }, [el('label', { class: 'check', for: id }, [inp, el('span', { text: d.name })])]);
      if (on) row.appendChild(stationSelect(D.i[d.id], function (v) { D.i[d.id] = v; changed(); }));
      else row.appendChild(el('span'));
      box.appendChild(row);
    });
  }

  /* ---- goals ---- */
  function pickSelect(label, options, cur, onPick) {
    var sel = el('select', { 'aria-label': label }, options.map(function (o) { return el('option', { value: o[0], text: o[1] }); }));
    if (options.some(function (o) { return o[0] === cur; })) sel.value = cur;
    sel.addEventListener('change', function () { onPick(sel.value); });
    return sel;
  }
  function stOptions() { return D.s.map(function (id) { return [id, G.LIB_STATION_LIST.filter(function (x) { return x.id === id; })[0].name]; }); }
  function defaultGoal(kind) {
    var c = { k: kind }, p = portableIds(), cs = containerIds();
    if (FIXED_ITEM[kind]) c.i = FIXED_ITEM[kind];
    if (kind === 'at') { c.i = p.length ? p[0].id : ''; c.t = D.s[D.s.length - 1] || ''; }
    if (kind === 'in' || kind === 'on') {
      c.i = p.length ? p[0].id : '';
      var want = cs.filter(function (d) { return G.CONTAINERS[d.id].indexOf(kind) >= 0; });
      c.t = want.length ? want[0].id : '';
    }
    return c;
  }
  function renderGoals() {
    var box = clear($('cGoals'));
    D.g.forEach(function (c, gi) {
      var kindSel = pickSelect(t('create.goalKind'), KINDS.map(function (k) { return [k, t('goal.' + k)]; }), c.k, function (v) {
        D.g[gi] = defaultGoal(v); changed(); renderGoals();
      });
      var row = el('div', { class: 'goalrow' }, [kindSel]);
      if (c.k === 'at' || c.k === 'in' || c.k === 'on') {
        row.appendChild(pickSelect(t('create.goalItem'), portableIds().map(function (d) { return [d.id, d.name]; }), c.i, function (v) { c.i = v; changed(); }));
        if (c.k === 'at') row.appendChild(pickSelect(t('create.goalTarget'), stOptions(), c.t, function (v) { c.t = v; changed(); }));
        else {
          var cont = containerIds().filter(function (d) { return G.CONTAINERS[d.id].indexOf(c.k) >= 0; });
          row.appendChild(pickSelect(t('create.goalTarget'), cont.map(function (d) { return [d.id, d.name]; }), c.t, function (v) { c.t = v; changed(); }));
        }
      } else { row.appendChild(el('span')); row.appendChild(el('span')); }
      row.appendChild(el('button', { type: 'button', class: 'btn ghost small', text: '×', 'aria-label': t('create.removeGoal'), on: { click: function () { D.g.splice(gi, 1); changed(); renderGoals(); } } }));
      box.appendChild(row);
    });
    if (D.g.length < 3) {
      box.appendChild(el('div', {}, [el('button', { type: 'button', class: 'btn small', text: t('create.addGoal'), on: { click: function () { D.g.push(defaultGoal('at')); changed(); renderGoals(); } } })]));
    }
    // fill defaults for freshly added goals whose selects had no valid option
    D.g.forEach(function (c) { if ((c.k === 'at' || c.k === 'in' || c.k === 'on') && !c.i && portableIds().length) c.i = portableIds()[0].id; });
  }

  /* ---- preview ---- */
  function renderPreview() {
    var L = G.previewLevel(D);
    scene.setLevel(L, G.makeWorld(L));
    scene.snapRobot();
    var v = G.validateSpec(D), line = $('editGoal'), err = $('cError');
    err.hidden = true;
    if (v.ok) line.textContent = t('create.goalPrefix') + ' ' + v.spec.g.map(G.clausePhrase).join('; ') + '.';
    else line.textContent = t('create.notReady') + ' ' + v.error;
  }

  function readFields() {
    D.t = $('cTitle').value.slice(0, 40);
    D.j = $('cJob').value.slice(0, 140);
  }

  function wire() {
    $('cTitle').addEventListener('input', function () { readFields(); changed(); });
    $('cJob').addEventListener('input', function () { readFields(); changed(); });
    $('cTest').addEventListener('click', function () {
      readFields();
      var v = G.validateSpec(D);
      if (!v.ok) { $('cError').textContent = v.error; $('cError').hidden = false; return; }
      $('cError').hidden = true;
      cfg.onTest(v.spec);
    });
    $('cClear').addEventListener('click', function () { D = defaultDraft(); fill(); changed(); });
  }

  function fill() {
    $('cTitle').value = D.t || '';
    $('cJob').value = D.j || '';
    renderStations(); renderItems(); renderGoals(); renderPreview();
  }

  wire();
  fill();

  return {
    draft: function () { readFields(); return copy(D); },
    setDraft: function (spec) { D = copy(spec); D.o = 0; fill(); if (cfg.onChange) cfg.onChange(D, true); },
    setOptimal: function (n) { D.o = n; },
    rerender: function () { fill(); }
  };
}

root.Editor = { create: create, defaultDraft: defaultDraft };
})(typeof window !== 'undefined' ? window : globalThis);
