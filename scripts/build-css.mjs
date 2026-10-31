// Tailwind CSS v4 ilə www/css/app.css faylını qurur (CLI tələb etmir).
// İstifadə: node scripts/build-css.mjs
import { compile } from 'tailwindcss';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const require = createRequire(import.meta.url);
const twDir = path.dirname(require.resolve('tailwindcss/package.json'));

const input = fs.readFileSync(path.join(root, 'src/app.css'), 'utf8');
const compiler = await compile(input, {
  base: root,
  loadStylesheet: async (id, base) => {
    const file = id === 'tailwindcss' ? path.join(twDir, 'index.css') : path.resolve(base, id);
    return { path: file, base: path.dirname(file), content: fs.readFileSync(file, 'utf8') };
  },
});
const files = ['www/index.html', ...fs.readdirSync(path.join(root, 'www/js')).map(f => 'www/js/' + f)];
const candidates = new Set();
for (const f of files) {
  const src = fs.readFileSync(path.join(root, f), 'utf8');
  for (const m of src.matchAll(/[A-Za-z0-9_\-:/.\[\]%#()!@]+/g)) candidates.add(m[0]);
}
const css = compiler.build([...candidates]);
fs.writeFileSync(path.join(root, 'www/css/app.css'), css);
console.log('www/css/app.css:', (css.length / 1024).toFixed(1), 'KB');
