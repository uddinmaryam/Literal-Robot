(function (root) {
'use strict';

/* Small DOM helpers. All text goes in through textContent, never innerHTML. */
function el(tag, attrs, kids) {
  var n = document.createElement(tag);
  if (attrs) {
    for (var k in attrs) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k === 'on') { for (var ev in v) n.addEventListener(ev, v[ev]); }
      else if (k === 'style') n.style.cssText = v;
      else if (k === 'value') n.value = v;
      else if (k === 'checked') n.checked = !!v;
      else if (k === 'disabled') n.disabled = !!v;
      else n.setAttribute(k, v === true ? '' : v);
    }
  }
  (kids || []).forEach(function (c) {
    if (c === null || c === undefined || c === false) return;
    n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return n;
}
function $(id) { return document.getElementById(id); }
function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); return n; }

var SVGNS = 'http://www.w3.org/2000/svg';
function starSvg(on, size) {
  var s = document.createElementNS(SVGNS, 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', size); s.setAttribute('height', size); s.setAttribute('aria-hidden', 'true');
  var p = document.createElementNS(SVGNS, 'path');
  p.setAttribute('d', 'M12 2.5l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 18.3 5.8 21.6 7 14.7 2 9.8l6.9-1z');
  p.setAttribute('fill', on ? 'var(--accent)' : 'none');
  p.setAttribute('stroke', 'var(--ink)'); p.setAttribute('stroke-width', '1.6'); p.setAttribute('stroke-linejoin', 'round');
  s.appendChild(p);
  return s;
}
function starRow(n, size) {
  var w = el('span', { class: 'starrow' });
  for (var i = 1; i <= 3; i++) w.appendChild(starSvg(n >= i, size));
  return w;
}

root.UI = { el: el, $: $, clear: clear, starSvg: starSvg, starRow: starRow };
})(typeof window !== 'undefined' ? window : globalThis);
