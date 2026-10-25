(function (root) {
'use strict';

/* ======================================================================
   Isometric room renderer. Create one Scene per canvas.
   ====================================================================== */

var G = root.Game;
var TW = 84, TH = 42, OX = 320, OY = 150, N = 6;
var OUT = 'rgba(15,22,30,0.38)';
var C = {};

function readColors() {
  var cs = getComputedStyle(document.documentElement);
  ['floor-a', 'floor-b', 'wall-l', 'wall-r', 'glass', 'ink', 'accent'].forEach(function (k) {
    C[k] = (cs.getPropertyValue('--' + k) || '').trim() || '#888888';
  });
}
function shade(hex, f) {
  var h = String(hex).replace('#', '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(h)) return hex;
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  var n = parseInt(h, 16);
  function c(v) { return Math.max(0, Math.min(255, Math.round(v * f))); }
  return 'rgb(' + c((n >> 16) & 255) + ',' + c((n >> 8) & 255) + ',' + c(n & 255) + ')';
}
function P(x, y, z) { return [OX + (x - y) * TW / 2, OY + (x + y) * TH / 2 - (z || 0)]; }

var CONT = { cake: { on: 17 }, lunchbox: { in: 13, on: 15 }, jar: { in: 12, on: 20 } };
function childOffset(k, n) {
  if (n <= 1) return [0, 0];
  if (n === 2) return [k === 0 ? -0.15 : 0.15, 0];
  return [(k % 2 ? 1 : -1) * 0.1, (k > 1 ? 1 : -1) * 0.1];
}

function create(canvas) {
  var ctx = canvas.getContext('2d');
  var reduce = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var S = {
    level: null, world: null, rob: { x: 3.0, y: 3.7 }, color: '#FFB703',
    mood: 'idle', moodUntil: 0, look: null, act: null, actStart: 0, power: 1,
    freePos: null, stDepth: {}, now: 0, bobZ: 0, moving: false, offX: 0
  };
  var START = [3.0, 3.7];

  function poly(pts, fill) {
    ctx.beginPath();
    for (var i = 0; i < pts.length; i++) { if (i) ctx.lineTo(pts[i][0], pts[i][1]); else ctx.moveTo(pts[i][0], pts[i][1]); }
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.stroke();
  }
  function box(gx, gy, w, d, h, z0, col) {
    var x1 = gx + w, y1 = gy + d, z1 = z0 + h;
    poly([P(gx, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(gx, y1, z1)], shade(col, 0.9));
    poly([P(x1, gy, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, gy, z1)], shade(col, 0.72));
    poly([P(gx, gy, z1), P(x1, gy, z1), P(x1, y1, z1), P(gx, y1, z1)], shade(col, 1.1));
  }
  function cyl(x, y, z0, r, h, col, topCol) {
    var c0 = P(x, y, z0), c1 = P(x, y, z0 + h), rx = r * TW * 0.7071, ry = r * TH * 0.7071;
    ctx.fillStyle = shade(col, 0.74);
    ctx.beginPath(); ctx.ellipse(c0[0], c0[1], rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = shade(col, 0.9);
    ctx.fillRect(c0[0] - rx, c1[1], rx * 2, c0[1] - c1[1]);
    ctx.fillStyle = topCol || shade(col, 1.1);
    ctx.beginPath(); ctx.ellipse(c1[0], c1[1], rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.stroke();
  }
  function dot(x, y, z, r, col) {
    var p = P(x, y, z);
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2); ctx.fill();
  }

  function drawRoom() {
    var H = 110, i, j;
    poly([P(0, 0, 0), P(N, 0, 0), P(N, 0, H), P(0, 0, H)], C['wall-r']);
    poly([P(0, 0, 0), P(0, N, 0), P(0, N, H), P(0, 0, H)], C['wall-l']);
    poly([P(2.2, 0, 58), P(3.8, 0, 58), P(3.8, 0, 98), P(2.2, 0, 98)], C.glass);
    ctx.strokeStyle = OUT; ctx.lineWidth = 2;
    var a = P(3.0, 0, 58), b = P(3.0, 0, 98), c = P(2.2, 0, 78), d = P(3.8, 0, 78);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.stroke();
    for (i = 0; i < N; i++) for (j = 0; j < N; j++) {
      poly([P(i, j, 0), P(i + 1, j, 0), P(i + 1, j + 1, 0), P(i, j + 1, 0)], ((i + j) % 2) ? C['floor-a'] : C['floor-b']);
    }
    poly([P(0, N, 0), P(N, N, 0), P(N, N, -12), P(0, N, -12)], shade(C['floor-b'], 0.62));
    poly([P(N, 0, 0), P(N, N, 0), P(N, N, -12), P(N, 0, -12)], shade(C['floor-b'], 0.46));
  }

  function drawFurniture(f) {
    f.boxes.forEach(function (b) { box(b[0], b[1], b[2], b[3], b[4], b[5], b[6]); });
    if (!f.deco) return;
    var d = f.deco;
    if (d.t === 'plate') {
      cyl(d.x, d.y, d.z, 0.36, 1.6, '#F2F5F8');
    } else if (d.t === 'plant') {
      var wat = S.world && S.world.sstate.plant && S.world.sstate.plant.watered;
      var leaf = wat ? '#3FA866' : '#A9A468';
      var off = [[0, 0, 12, 9], [-0.14, 0.06, 8, 8], [0.12, -0.08, 9, 8], [0.05, 0.14, 6, 7]];
      off.forEach(function (o) { dot(d.x + o[0], d.y + o[1], d.z + o[2] + 6, o[3], shade(leaf, 0.85)); });
      off.forEach(function (o) { dot(d.x + o[0], d.y + o[1], d.z + o[2] + 8, o[3] - 2, leaf); });
      if (wat) {
        dot(d.x - 0.14, d.y + 0.06, d.z + 22, 4, '#F56F9B');
        dot(d.x + 0.12, d.y - 0.08, d.z + 24, 4, '#FFD166');
        dot(d.x, d.y, d.z + 28, 4.5, '#F56F9B');
      }
    }
  }

  /* ---- item placement ---- */
  function stationOf(id) { return G.stationDef(S.level, id); }
  function itemsAt(stId) {
    var out = [];
    S.level.items.forEach(function (d) { if (S.world.items[d.id].loc === stId) out.push(d.id); });
    return out;
  }
  function childrenOf(parent, prep) {
    var out = [];
    S.level.items.forEach(function (d) { if (S.world.items[d.id].loc === prep + ':' + parent) out.push(d.id); });
    return out;
  }
  function itemPos(id) {
    var it = S.world.items[id], m;
    if (it.loc === 'held') return [S.rob.x + 0.05, S.rob.y + 0.36, 20 + S.bobZ];
    m = it.loc.match(/^(in|on):(.+)$/);
    if (m) {
      var bp = itemPos(m[2]), sibs = childrenOf(m[2], m[1]), k = sibs.indexOf(id);
      var off = childOffset(k, sibs.length);
      var top = (CONT[m[2]] && CONT[m[2]][m[1]]) || 10;
      return [bp[0] + off[0], bp[1] + off[1], bp[2] + top];
    }
    var st = stationOf(it.loc), at = itemsAt(it.loc), idx = at.indexOf(id);
    var sl = st.slots[Math.min(idx, st.slots.length - 1)];
    var extra = idx >= st.slots.length ? (idx - st.slots.length + 1) * 0.28 : 0;
    return [sl[0], sl[1] + extra, sl[2]];
  }
  function itemDepth(id) {
    var it = S.world.items[id], m;
    if (it.loc === 'held') return S.rob.x + S.rob.y + 0.6;
    m = it.loc.match(/^(in|on):(.+)$/);
    if (m) return itemDepth(m[2]) + 0.01;
    return (S.stDepth[it.loc] || 0) + 0.01 + itemsAt(it.loc).indexOf(id) * 0.001;
  }

  function drawItem(id) {
    var it = S.world.items[id], p = itemPos(id), x = p[0], y = p[1], z = p[2];
    if (id.indexOf('cookie') === 0) {
      cyl(x, y, z, 0.14, 3, '#C98A4B');
      dot(x - 0.05, y + 0.02, z + 3.6, 1.3, '#5A3A22'); dot(x + 0.05, y - 0.03, z + 3.6, 1.3, '#5A3A22'); dot(x + 0.02, y + 0.06, z + 3.6, 1.1, '#5A3A22');
      return;
    }
    switch (id) {
      case 'bread': {
        var col = it.state.toasted ? '#A7622B' : '#EBC78F';
        if (it.state.inside && it.loc === 'toaster') box(x - 0.13, y - 0.05, 0.26, 0.1, 12, z, col);
        else box(x - 0.18, y - 0.18, 0.36, 0.36, 6, z, col);
        break;
      }
      case 'can':
        cyl(x, y, z, 0.15, 13, it.state.full ? '#2F7BE0' : '#9AAFC6', it.state.full ? '#8EC5FF' : null);
        box(x + 0.1, y - 0.04, 0.12, 0.08, 3, z + 8, it.state.full ? '#2F7BE0' : '#9AAFC6');
        break;
      case 'cake':
        cyl(x, y, z, 0.36, 14, '#F2A6B8');
        cyl(x, y, z + 14, 0.36, 3, '#FFF1F4');
        break;
      case 'candle':
        cyl(x, y, z, 0.05, 13, '#9ED8F0');
        if (it.state.lit) {
          var fp = P(x, y, z + 20 + Math.sin(S.now / 90) * 0.8);
          ctx.fillStyle = '#FF9F1C'; ctx.beginPath(); ctx.ellipse(fp[0], fp[1], 4, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#FFE66D'; ctx.beginPath(); ctx.ellipse(fp[0], fp[1] + 1.5, 2, 4, 0, 0, Math.PI * 2); ctx.fill();
        }
        break;
      case 'matches':
        box(x - 0.14, y - 0.06, 0.28, 0.12, 5, z, '#D9B77A');
        box(x + 0.08, y - 0.06, 0.06, 0.12, 5, z, '#D6383F');
        break;
      case 'sandwich':
        box(x - 0.18, y - 0.18, 0.36, 0.36, 3, z, '#E3B77A');
        box(x - 0.17, y - 0.17, 0.34, 0.34, 2, z + 3, '#6DB36B');
        box(x - 0.18, y - 0.18, 0.36, 0.36, 3, z + 5, '#E3B77A');
        break;
      case 'apple':
        dot(x, y, z + 7, 7, '#D6383F');
        dot(x - 0.04, y - 0.04, z + 9, 2.2, 'rgba(255,255,255,0.45)');
        dot(x, y, z + 15, 2.2, '#3FA866');
        break;
      case 'lunchbox':
        box(x - 0.42, y - 0.27, 0.84, 0.54, 14, z, '#4E9FD1');
        box(x - 0.34, y - 0.2, 0.68, 0.4, 0.6, z + 14, '#1F5E8A');
        break;
      case 'jar':
        ctx.globalAlpha = 0.55; cyl(x, y, z, 0.32, 18, '#9CC7D8'); ctx.globalAlpha = 1;
        cyl(x, y, z + 18, 0.34, 2.5, '#CFE0E8');
        break;
    }
  }

  /* ---- robot ---- */
  function eyeStyle() {
    var m = S.mood;
    if (S.power < 0.25) return 'off';
    return m;
  }
  function drawRobot() {
    var x = S.rob.x + S.offX, y = S.rob.y, z = S.bobZ;
    var body = S.color;
    var s = P(x, y, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(s[0], s[1], 18, 8, 0, 0, Math.PI * 2); ctx.fill();
    box(x - 0.2, y - 0.2, 0.4, 0.4, 6, z, '#4A5663');
    box(x - 0.24, y - 0.24, 0.48, 0.48, 22, z + 6, body);
    box(x - 0.2, y - 0.2, 0.4, 0.4, 14, z + 30, '#F3F6F9');

    var st = eyeStyle(), e1 = P(x - 0.09, y + 0.2, z + 38), e2 = P(x + 0.09, y + 0.2, z + 38), mc = P(x, y + 0.2, z + 33);
    var lx = S.look ? S.look[0] : 0, ly = S.look ? S.look[1] : 0;
    var blink = (!reduce && st === 'idle' && (S.now % 3600) < 130);
    ctx.fillStyle = '#19212B'; ctx.strokeStyle = '#19212B'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    function eye(e, big) {
      var rx = 4.2 * (big || 1), ry = (blink ? 0.7 : 4.8) * (big || 1);
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(e[0], e[1], rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.stroke();
      if (!blink) { ctx.fillStyle = '#19212B'; ctx.beginPath(); ctx.arc(e[0] + lx * 1.6, e[1] + ly * 1.6, 2.2 * (big || 1), 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.lineWidth = 2; ctx.strokeStyle = '#19212B';
    if (st === 'off') {
      ctx.beginPath(); ctx.moveTo(e1[0] - 3.5, e1[1]); ctx.lineTo(e1[0] + 3.5, e1[1]); ctx.moveTo(e2[0] - 3.5, e2[1]); ctx.lineTo(e2[0] + 3.5, e2[1]); ctx.stroke();
    } else if (st === 'happy') {
      ctx.beginPath(); ctx.arc(e1[0], e1[1] + 2, 3.6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(e2[0], e2[1] + 2, 3.6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(mc[0], mc[1] - 2, 5, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
    } else if (st === 'sad') {
      eye(e1, 0.85); eye(e2, 0.85);
      ctx.strokeStyle = '#19212B'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(e1[0] - 4, e1[1] - 7); ctx.lineTo(e1[0] + 3.5, e1[1] - 5); ctx.moveTo(e2[0] + 4, e2[1] - 7); ctx.lineTo(e2[0] - 3.5, e2[1] - 5); ctx.stroke();
      ctx.beginPath(); ctx.arc(mc[0], mc[1] + 4, 4.5, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    } else if (st === 'confused') {
      eye(e1, 1.25); eye(e2, 0.75);
      ctx.strokeStyle = '#19212B'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(mc[0] - 5, mc[1]); ctx.lineTo(mc[0] - 2.5, mc[1] - 2); ctx.lineTo(mc[0], mc[1]); ctx.lineTo(mc[0] + 2.5, mc[1] - 2); ctx.lineTo(mc[0] + 5, mc[1]); ctx.stroke();
      var q = P(x + 0.1, y + 0.1, z + 62);
      ctx.fillStyle = C.ink; ctx.font = '700 20px "Figtree", system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('?', q[0], q[1] + (reduce ? 0 : Math.sin(S.now / 140) * 2));
    } else if (st === 'sleep') {
      ctx.beginPath(); ctx.arc(e1[0], e1[1] - 1, 3.4, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(e2[0], e2[1] - 1, 3.4, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
      var zz = P(x + 0.15, y + 0.1, z + 64 + (reduce ? 0 : (S.now / 40) % 10));
      ctx.fillStyle = C.ink; ctx.font = '700 16px "Figtree", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('z', zz[0], zz[1]);
    } else {
      eye(e1); eye(e2);
      ctx.strokeStyle = '#19212B'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(mc[0] - 3.5, mc[1]); ctx.lineTo(mc[0] + 3.5, mc[1]); ctx.stroke();
    }
    var a0 = P(x, y, z + 44), a1 = P(x, y, z + 54);
    ctx.strokeStyle = '#4A5663'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(a1[0], a1[1]); ctx.stroke();
    var glow = S.power > 0.5 ? body : '#6B7785';
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(a1[0], a1[1], 3.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.stroke();
    ctx.textAlign = 'start';
  }

  /* ---- public api ---- */
  S.setLevel = function (level, world) {
    S.level = level; S.world = world; S.stDepth = {};
    level.furniture.forEach(function (f) { var b = f.boxes[0]; S.stDepth[f.st] = (b[0] + b[2]) + (b[1] + b[3]); });
    var t = S.target(); S.rob.x = t[0]; S.rob.y = t[1];
  };
  S.setWorld = function (world) { S.world = world; };
  S.target = function () {
    if (S.freePos) return S.freePos;
    var at = S.world && S.world.robot.at;
    if (!at) return START;
    var st = G.stationDef(S.level, at);
    return st ? st.stand : START;
  };
  S.snapRobot = function () { var t = S.target(); S.rob.x = t[0]; S.rob.y = t[1]; };
  S.setMood = function (mood, ms) { S.mood = mood; S.moodUntil = ms ? S.now + ms : 0; };
  S.setColor = function (hex) { S.color = hex; };
  S.setPower = function (p) { S.power = p; };
  S.perform = function (name) { S.act = name; S.actStart = S.now; };
  S.lookAt = function (cx, cy) {
    var r = canvas.getBoundingClientRect();
    if (!r.width) { S.look = null; return; }
    var hp = P(S.rob.x, S.rob.y, 38);
    var rx = r.left + hp[0] / 640 * r.width, ry = r.top + hp[1] / 470 * r.height;
    var dx = cx - rx, dy = cy - ry, d = Math.sqrt(dx * dx + dy * dy) || 1;
    var k = Math.min(1, d / 160);
    S.look = [dx / d * k, dy / d * k];
  };
  S.clearLook = function () { S.look = null; };

  S.draw = function (t, dt) {
    S.now = t;
    if (S.moodUntil && t > S.moodUntil) { S.mood = 'idle'; S.moodUntil = 0; }
    var tp = S.target(), dx = tp[0] - S.rob.x, dy = tp[1] - S.rob.y, dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.02 || reduce) { S.rob.x = tp[0]; S.rob.y = tp[1]; S.moving = false; }
    else { var step = Math.min(dist, 2.6 * dt); S.rob.x += dx / dist * step; S.rob.y += dy / dist * step; S.moving = true; }
    var bob = reduce ? 0 : (S.moving ? Math.abs(Math.sin(t / 90)) * 5 : Math.sin(t / 400) * 1.4);
    S.offX = 0;
    if (S.act) {
      var p = (t - S.actStart) / 900;
      if (p >= 1 || reduce) S.act = null;
      else {
        if (S.act === 'hop' || S.act === 'dance') bob += Math.abs(Math.sin(p * Math.PI * (S.act === 'dance' ? 3 : 2))) * 16;
        if (S.act === 'wiggle' || S.act === 'dance') S.offX = Math.sin(p * 38) * 0.05;
        if (S.act === 'nod') bob += Math.sin(p * Math.PI * 4) * 3;
      }
    }
    S.bobZ = bob;

    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, 640, 470);
    drawRoom();
    if (!S.level || !S.world) return;
    var list = [];
    S.level.furniture.forEach(function (f) {
      list.push({ d: S.stDepth[f.st] || 0, f: function () { drawFurniture(f); } });
    });
    S.level.items.forEach(function (d) { list.push({ d: itemDepth(d.id), f: function () { drawItem(d.id); } }); });
    list.push({ d: S.rob.x + S.rob.y + 0.45, f: drawRobot });
    list.sort(function (a, b) { return a.d - b.d; });
    list.forEach(function (e) { e.f(); });
  };
  return S;
}

/* ------------------------------------------------------------- confetti */
var Confetti = (function () {
  var raf = 0;
  function burst(canvas) {
    if (!canvas || (root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    var ctx = canvas.getContext('2d'), dpr = Math.min(2, root.devicePixelRatio || 1);
    var W = root.innerWidth, H = root.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    var colors = ['#FFB703', '#4E9FD1', '#F56F9B', '#3FA866', '#FFFFFF', '#D6383F'];
    var ps = [], i;
    for (i = 0; i < 150; i++) {
      var a = -Math.PI / 2 + (Math.random() - 0.5) * 1.5, v = 7 + Math.random() * 9;
      ps.push({ x: W / 2 + (Math.random() - 0.5) * 120, y: H * 0.55, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 4 + Math.random() * 5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: colors[i % colors.length] });
    }
    var start = 0;
    cancelAnimationFrame(raf);
    function tick(t) {
      if (!start) start = t;
      var age = (t - start) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ps.forEach(function (p) {
        p.vy += 0.32; p.vx *= 0.992; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, 1 - age / 3);
        ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 3, p.r, p.r * 0.66);
        ctx.restore();
      });
      if (age < 3) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    }
    raf = requestAnimationFrame(tick);
  }
  return { burst: burst };
})();

root.Scene = { create: create, readColors: readColors, shade: shade };
root.Confetti = Confetti;
})(window);
