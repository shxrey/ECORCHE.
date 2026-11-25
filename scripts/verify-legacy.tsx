// Proves the page's server HTML is the same DOM as the original single-file
// page (reference/protocol.html): renders each component to HTML, normalizes
// both sides (attribute order, style spacing, comments) and compares node by
// node.
//
//   npm run verify:legacy
//
// Covers the workout and every other section of the original page, against
// its original HTML with the rebrand edits applied (scripts/legacy-fragments.mjs).
// Where the original had an inline on… handler and React handles that event
// now, the attribute may be missing; each section reports how many kinds.
//
// Spaces matter where a browser shows them: "the <strong>top</strong> of"
// must keep both spaces, so text keeps a leading/trailing space (shown as ␣)
// unless it starts or ends its element, and a space-only text node between
// two inline pieces is kept. Indentation between block elements is ignored.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as cheerio from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import { Anatomy } from '../src/components/sections/Anatomy';
import { Gauge } from '../src/components/sections/Gauge';
import { Protocol } from '../src/components/sections/Protocol';
import { SiteFooter } from '../src/components/sections/SiteFooter';
import { Sources } from '../src/components/sections/Sources';
import { Standards } from '../src/components/sections/Standards';
import { Volume } from '../src/components/sections/Volume';
import { Overlays } from '../src/components/overlays/Overlays';
import { Tracker } from '../src/components/training/Tracker';
import { TrainingMinibar } from '../src/components/training/TrainingMinibar';
import { TrainingWorkout } from '../src/components/training/TrainingWorkout';
import { Hero } from '../src/components/shell/Hero';
import { TopNav } from '../src/components/shell/TopNav';
import { legacyFragments } from './legacy-fragments.mjs';

/** The component(s) for each section of the original page, in page order. */
const SECTIONS: Record<string, ReactElement> = {
  nav: (
    <>
      <TopNav />
      <TrainingMinibar />
    </>
  ),
  hero: <Hero />,
  tracker: <Tracker />,
  protocol: <Protocol />,
  standards: <Standards />,
  gauge: <Gauge />,
  volume: <Volume />,
  anatomy: <Anatomy />,
  sources: <Sources />,
  footer: <SiteFooter />,
  overlays: <Overlays />,
};

const INLINE = new Set(['a', 'abbr', 'b', 'br', 'code', 'em', 'i', 'mark', 'small', 'span', 'strong', 'sub', 'sup', 'u']);
const isInline = (n: AnyNode | undefined) => !!n && (n.type === 'text' || (n.type === 'tag' && INLINE.has((n as Element).tagName)));

function canon(html: string): string[] {
  const $ = cheerio.load(html, null, false);
  const out: string[] = [];
  const walk = (node: AnyNode, depth: number, siblings: AnyNode[]) => {
    const pad = '  '.repeat(depth);
    if (node.type === 'text') {
      const raw = (node as unknown as { data: string }).data;
      const i = siblings.indexOf(node);
      const prev = siblings[i - 1];
      const next = siblings[i + 1];
      if (!raw.trim()) {
        if (isInline(prev) && isInline(next)) out.push(pad + '"␣"');
        return;
      }
      let t = raw.replace(/\s+/g, ' ');
      t = prev ? t.replace(/^ /, '␣') : t.trimStart();
      t = next ? t.replace(/ $/, '␣') : t.trimEnd();
      out.push(pad + '"' + t + '"');
      return;
    }
    if (node.type !== 'tag') return;
    const el = node as Element;
    const attrs = Object.entries(el.attribs)
      .map(([name, v]) => {
        const value = name === 'style' ? v.replace(/\s+/g, '').replace(/;$/, '') : v;
        return ` ${name}="${value}"`;
      })
      .sort();
    out.push(pad + `<${el.tagName}${attrs.join('')}>`);
    const kids = el.children.filter((c) => c.type !== 'comment');
    kids.forEach((c) => walk(c, depth + 1, kids));
  };
  const top: AnyNode[] = $.root().children().toArray();
  top.forEach((n) => walk(n, 0, top));
  return out;
}

/**
 * An element may lose its inline on* handlers when that event is a React
 * handler now; they're collected in `moved`.
 */
function compare(name: string, original: string, rendered: string, moved: Set<string>): number {
  const a = canon(original);
  const b = canon(rendered);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      const handlers = a[i]?.match(/ on[a-z]+="[^"]*"/g) ?? [];
      if (handlers.length && handlers.reduce((line, h) => line.replace(h, ''), a[i]) === b[i]) {
        handlers.forEach((h) => moved.add(h.trim()));
        continue;
      }
      console.error(`${name}: MISMATCH at node ${i}:`);
      console.error('  original:', a[i]);
      console.error('  rendered:', b[i]);
      console.error('context (original):\n' + a.slice(Math.max(0, i - 4), i + 3).join('\n'));
      process.exit(1);
    }
  }
  return a.length;
}

// The workout, against the original page.
const src = readFileSync(resolve(__dirname, '../reference/protocol.html'), 'utf8').replace(/\r\n/g, '\n');
const workoutHtml = src.slice(src.indexOf('<!-- ===== WORKOUT SESSIONS ===== -->'), src.indexOf('<!-- ===== ANATOMY / ENGAGEMENT MAP ===== -->'));
const rendered = renderToStaticMarkup(<TrainingWorkout />);
const workoutMoved = new Set<string>();
const nodes = compare('workout', workoutHtml, rendered, workoutMoved);
const cards = (rendered.match(/class="exercise-card reveal"/g) || []).length;
const dots = (rendered.match(/class="set-dot"/g) || []).length;
console.log(`OK workout: identical to the original (${nodes} nodes, ${cards} exercise cards, ${dots} set dots; ${workoutMoved.size} kinds of inline handler now in React).`);

// Every other section, against its original HTML.
const fragments: Record<string, string> = legacyFragments();
const missing = Object.keys(fragments).filter((n) => !SECTIONS[n]);
const unknown = Object.keys(SECTIONS).filter((n) => !(n in fragments));
if (missing.length || unknown.length) {
  console.error('Every section of the original page (scripts/legacy-fragments.mjs) needs its component in SECTIONS.', { missing, unknown });
  process.exit(1);
}
for (const [name, element] of Object.entries(SECTIONS)) {
  const moved = new Set<string>();
  const count = compare(name, fragments[name], renderToStaticMarkup(element), moved);
  console.log(`OK ${name}: identical to the original (${count} nodes; ${moved.size} kinds of inline handler now in React).`);
}
