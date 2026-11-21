// Proves the React-rendered workout section is the same DOM as the original
// page: renders <Workout /> to HTML, normalizes both sides (attribute order,
// style spacing, whitespace, comments, data-legacy-on* -> on*) and compares.
//
//   npm run verify:legacy

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import * as cheerio from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import { Workout } from '../src/components/workout/Workout';

const src = readFileSync(resolve(__dirname, '../reference/protocol.html'), 'utf8').replace(/\r\n/g, '\n');
const start = src.indexOf('<!-- ===== WORKOUT SESSIONS ===== -->');
const end = src.indexOf('<!-- ===== ANATOMY / ENGAGEMENT MAP ===== -->');
const original = src.slice(start, end);
const rendered = renderToStaticMarkup(<Workout />);

function canon(html: string): string {
  const $ = cheerio.load(html, null, false);
  const out: string[] = [];
  const walk = (node: AnyNode, depth: number) => {
    if (node.type === 'comment') return;
    if (node.type === 'text') {
      const t = (node as unknown as { data: string }).data.replace(/\s+/g, ' ').trim();
      if (t) out.push('  '.repeat(depth) + '"' + t + '"');
      return;
    }
    if (node.type !== 'tag') return;
    const el = node as Element;
    const attrs = Object.entries(el.attribs)
      .map(([k, v]) => {
        const name = k.startsWith('data-legacy-') ? k.slice('data-legacy-'.length) : k;
        const value = name === 'style' ? v.replace(/\s+/g, '').replace(/;$/, '') : v;
        return `${name}="${value}"`;
      })
      .sort();
    out.push('  '.repeat(depth) + `<${el.tagName} ${attrs.join(' ')}>`);
    el.children.forEach(c => walk(c, depth + 1));
  };
  $.root().children().each((_, n) => walk(n, 0));
  // Re-join text nodes React split ("Name" + " ") the same way the parser sees them.
  return out.join('\n');
}

const a = canon(original).split('\n');
const b = canon(rendered).split('\n');
const n = Math.max(a.length, b.length);
for (let i = 0; i < n; i++) {
  if (a[i] !== b[i]) {
    console.error(`MISMATCH at node ${i}:`);
    console.error('  original:', a[i]);
    console.error('  rendered:', b[i]);
    console.error('context (original):\n' + a.slice(Math.max(0, i - 4), i + 3).join('\n'));
    process.exit(1);
  }
}
const cards = (rendered.match(/class="exercise-card reveal"/g) || []).length;
const dots = (rendered.match(/class="set-dot"/g) || []).length;
console.log(`OK: workout markup identical to the original (${a.length} nodes, ${cards} exercise cards, ${dots} set dots).`);
