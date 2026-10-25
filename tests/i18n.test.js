var fs = require('fs'), path = require('path'), assert = require('assert');
global.window = global;
require('../js/i18n.js');
var D = global.I18N._dicts, EN = D.en, ES = D.es;
var root = path.join(__dirname, '..');
var src = ['js/app.js', 'js/blocks.js', 'js/editor.js', 'index.html'].map(function (f) { return fs.readFileSync(path.join(root, f), 'utf8'); }).join('\n');

var keys = {};
var m, re = /\b(?:T|t|setI18n|setBtn)\((?:[a-zA-Z$()]+, )?'([a-z0-9_.]+)'/g;
while ((m = re.exec(src))) keys[m[1]] = 1;
re = /data-i18n(?:-ph|-aria)?="([^"]+)"/g;
while ((m = re.exec(src))) keys[m[1]] = 1;
re = /setBtn\([^,]+, '([a-z0-9_.]+)'/g;
while ((m = re.exec(src))) keys[m[1]] = 1;
re = /'(win\.[a-z0-9]+|game\.[a-zA-Z]+|home\.[a-zA-Z]+|daily\.[a-zA-Z0-9]+|share\.[a-z0-9]+)'/g;
while ((m = re.exec(src))) keys[m[1]] = 1;
// computed keys
['yellow', 'blue', 'pink', 'green', 'purple', 'red'].forEach(function (c) { keys['col.' + c] = 1; });
['at', 'in', 'on', 'toasted', 'lit', 'watered', 'full'].forEach(function (c) { keys['goal.' + c] = 1; });
[0, 1, 2, 3].forEach(function (i) { keys['poke.tap' + i] = 1; });
fs.readFileSync(path.join(root, 'js/app.js'), 'utf8').match(/\['([a-z_0-9]+)', function \(\) \{ return/g).forEach(function (s) {
  var id = s.match(/\['([a-z_0-9]+)'/)[1]; keys['ach.' + id + '.t'] = 1; keys['ach.' + id + '.d'] = 1;
});
delete keys['ach.']; delete keys['poke.tap']; delete keys['col.']; delete keys['goal.'];
var missing = [];
Object.keys(keys).forEach(function (k) { if (!(k in EN)) missing.push('EN:' + k); if (!(k in ES)) missing.push('ES:' + k); });
assert.deepStrictEqual(missing, [], 'missing keys: ' + missing.join(', '));
var onlyEn = Object.keys(EN).filter(function (k) { return !(k in ES); }), onlyEs = Object.keys(ES).filter(function (k) { return !(k in EN); });
assert.deepStrictEqual(onlyEn, [], 'not in ES: ' + onlyEn); assert.deepStrictEqual(onlyEs, [], 'not in EN: ' + onlyEs);
// placeholders match between languages
Object.keys(EN).forEach(function (k) {
  var a = (EN[k].match(/\{\w+\}/g) || []).sort().join(), b = (ES[k].match(/\{\w+\}/g) || []).sort().join();
  assert.strictEqual(a, b, 'placeholder mismatch in ' + k + ': ' + a + ' vs ' + b);
});
// every referenced key actually used (just info)
var unused = Object.keys(EN).filter(function (k) { return !keys[k]; });
console.log('i18n ok:', Object.keys(EN).length, 'keys; referenced', Object.keys(keys).length, '; possibly unused:', unused.join(' ') || 'none');
// level text coverage
var G = require('../js/logic.js');
G.LEVELS.concat([G.SANDBOX]).forEach(function (L) {
  var o = global.I18N._levels[L.id];
  assert.ok(o, 'es level ' + L.id);
  ['title', 'job', 'goal', 'greet'].forEach(function (f) { assert.ok(o[f], L.id + '.' + f); });
  assert.strictEqual(o.hints.length, L.hints.length);
});
console.log('level text ok');
