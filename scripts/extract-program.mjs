// Regenerates src/content/program.ts (the 6 training days and 46 exercises
// as typed data) from the workout in reference/protocol.html, a snapshot of
// Shrey_Hypertrophy_Protocol_WORKING.html:  npm run extract:program
//
// Strict by design: any markup inside an exercise card that the data model
// does not know about throws, so nothing is silently dropped. After running,
// `npm run verify:legacy` proves the page still renders the original markup.
//
// (Until Phase 4 of docs/react-rebuild-plan.md this was extract-legacy.mjs and
// also generated the stylesheet, the sections not yet in React and the old
// page script; those are gone or maintained by hand now.)


import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { legacyRegions } from './legacy-fragments.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(resolve(root, 'reference/protocol.html'), 'utf8').replace(/\r\n/g, '\n');

function write(rel, content) {
  const p = resolve(root, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
  console.log('wrote', rel, `(${content.length.toLocaleString()} chars)`);
}
let $ = null; // set once the workout region is loaded
function fail(msg, el) {
  const snippet = el && $ ? $.html(el).slice(0, 400) : '';
  throw new Error(msg + (snippet ? '\n' + snippet : ''));
}


// ---------- the workout ----------
const { regions } = legacyRegions(src);
$ = cheerio.load(regions['WORKOUT SESSIONS'], null, false);
const text = el => $(el).text();
const inner = el => $(el).html().trim();
const classesOf = el => ($(el).attr('class') || '').split(/\s+/).filter(Boolean);
function onlyChildren(el, allowed, ctx) {
  $(el).children().each((_, c) => {
    if (!allowed.includes(c.tagName)) fail(`${ctx}: unexpected <${c.tagName}>`, c);
  });
}

const days = [];
const exercises = [];
const workoutRoot = $('#workout');
if (workoutRoot.length !== 1) throw new Error('#workout not found');

workoutRoot.children('div.day-content').each((_, dayEl) => {
  const id = $(dayEl).attr('id');
  const m = id.match(/^(push|pull|legs)(A|B)$/);
  if (!m) fail('bad day id ' + id);
  const section = $(dayEl).children('section.section');
  const kids = section.children().toArray();
  const [eyebrow, title, subtitle, progress, list] = kids;
  if (kids.length !== 5) fail(`${id}: expected 5 section children, got ${kids.length}`);
  if (!$(eyebrow).is('div.section-eyebrow.reveal')) fail(id + ' eyebrow', eyebrow);
  if (!$(title).is('h2.section-title.reveal')) fail(id + ' title', title);
  if (!$(subtitle).is('p.section-subtitle.reveal')) fail(id + ' subtitle', subtitle);
  if (!$(progress).is('div.progress-bar-wrap.reveal')) fail(id + ' progress', progress);
  if (!$(list).is('div.exercise-list')) fail(id + ' list', list);

  const titleClone = $(title).clone();
  const accent = titleClone.find('span.accent');
  if (accent.text() !== m[2]) fail(id + ' title accent', title);
  accent.remove();

  const ringText = $(progress).find('.progress-ring-text').text(); // "0/21"
  const totalSets = Number(ringText.split('/')[1]);
  const progressInfo = $(progress).find('.progress-info');
  const resetBtn = $(progress).find('button.reset-btn');

  const day = {
    id,
    group: m[1],
    letter: m[2],
    sectionId: section.attr('id'),
    active: classesOf(dayEl).includes('active'),
    eyebrow: text(eyebrow),
    title: titleClone.text().trim(),
    subtitleHtml: inner(subtitle),
    totalSets,
    progressHeading: progressInfo.find('h5').text(),
    progressHint: progressInfo.find('p').text(),
    resetLabel: resetBtn.text(),
    exerciseKeys: [],
  };
  if (resetBtn.attr('onclick') !== `confirmResetDay('${id}')`) fail(id + ' reset handler', resetBtn[0]);

  $(list).children().each((_, card) => {
    if (!$(card).is('div.exercise-card.reveal')) fail(id + ': unexpected child in exercise-list', card);
    exercises.push(parseCard(card, id));
    day.exerciseKeys.push($(card).attr('data-exercise'));
  });
  days.push(day);
});

function parseCard(card, dayId) {
  const key = $(card).attr('data-exercise');
  const ctx = `${dayId}/${key}`;
  const header = $(card).children('.exercise-header');
  const body = $(card).children('.exercise-body');
  if (header.length !== 1 || body.length !== 1 || $(card).children().length !== 2) fail(ctx + ' card shape', card);
  onlyChildren(header, ['div'], ctx + ' header');

  const h3 = header.find('.exercise-info > h3');
  const h3Clone = h3.clone();
  const suffixSpan = h3Clone.children('span');
  if (suffixSpan.length > 1) fail(ctx + ' multiple h3 spans', h3[0]);
  let nameSuffix = null;
  if (suffixSpan.length) {
    const tones = {
      'color:var(--ink-muted);font-weight:600;': 'muted',
      'color:var(--danger-bright);font-weight:600;': 'danger',
    };
    const tone = tones[suffixSpan.attr('style')];
    if (!tone) fail(ctx + ' h3 span style', h3[0]);
    nameSuffix = { text: suffixSpan.text(), tone };
    suffixSpan.remove();
  }
  const name = h3Clone.text().trim();

  const tags = header.find('.muscle-tags > span').toArray().map(t => {
    const cls = classesOf(t).filter(c => c !== 'muscle-tag');
    if (cls.length !== 1) fail(ctx + ' tag class', t);
    return { tone: cls[0].replace(/^tag-/, ''), label: text(t) };
  });

  const pills = header.find('.exercise-meta > .meta-pill').toArray().map(p => {
    const variant = classesOf(p).filter(c => c !== 'meta-pill');
    if (variant.length > 1) fail(ctx + ' pill variant', p);
    return { label: $(p).find('.label').text(), value: $(p).find('.value').text(), variant: variant[0] || null };
  });
  const labels = pills.map(p => p.label).join(',');
  if (labels !== 'Sets,Reps,RIR') fail(ctx + ' pills ' + labels);
  const variants = new Set(pills.map(p => p.variant));
  if (variants.size !== 1) fail(ctx + ' mixed pill variants');

  const dots = header.find('.set-tracker > button.set-dot').toArray().map(d => {
    if ($(d).attr('onclick') !== 'toggleSet(this)') fail(ctx + ' dot handler', d);
    return { idx: $(d).attr('data-set-idx'), label: text(d) };
  });
  if (header.find('.set-tracker').children().length !== dots.length) fail(ctx + ' set-tracker children');

  const number = Number(header.find('.exercise-number').text());
  const bodyGrid = body.find('> .exercise-body-inner > .body-grid');
  if (bodyGrid.length !== 1 || body.find('> .exercise-body-inner').children().length !== 1) fail(ctx + ' body shape', body[0]);

  const blocks = bodyGrid.children().toArray().map(block => {
    if (!$(block).is('div.detail-block')) fail(ctx + ' non detail-block', block);
    const items = [];
    let heading = null;
    $(block).children().each((i, c) => {
      const $c = $(c);
      if (i === 0) {
        if (c.tagName !== 'h4') fail(ctx + ' detail-block must start with h4', block);
        heading = $c.text();
        return;
      }
      if ($c.is('span.sub-label')) items.push({ kind: 'subLabel', html: inner(c) });
      else if ($c.is('p.detail-text')) items.push({ kind: 'text', html: inner(c) });
      else if ($c.is('p.source-note')) items.push({ kind: 'sourceNote', html: inner(c) });
      else if ($c.is('div.intensity-badge')) {
        const lvl = classesOf(c).filter(x => x !== 'intensity-badge');
        if (lvl.length !== 1) fail(ctx + ' intensity class', c);
        items.push({ kind: 'intensity', level: lvl[0].replace(/^intensity-/, ''), html: inner(c) });
      } else if ($c.is('div.superset-divider')) {
        if ($c.children().length !== 1 || !$c.children().first().is('span')) fail(ctx + ' divider', c);
        items.push({ kind: 'divider', html: inner($c.children().first()) });
      } else if ($c.is('span.cite')) {
        if ($c.attr('style') !== 'display:block;margin-top:8px;') fail(ctx + ' cite style', c);
        items.push({ kind: 'cite', html: inner(c) });
      } else if ($c.is('div.activation-chart')) {
        const rows = $c.children().toArray().map(r => {
          if (!$(r).is('div.activation-row')) fail(ctx + ' activation row', r);
          const label = $(r).children('span.activation-label').text();
          const bar = $(r).find('> .activation-bar-wrap > .activation-bar');
          if (bar.length !== 1) fail(ctx + ' bar', r);
          const barCls = classesOf(bar[0]).filter(x => x !== 'activation-bar');
          if (barCls.length !== 1) fail(ctx + ' bar class', bar[0]);
          const style = bar.attr('style') || '';
          const sm = style.match(/^transform:scaleX\(([\d.]+)\)(?:;filter:(hue-rotate\(-?\d+deg\)))?$/);
          if (!sm) fail(ctx + ' bar style ' + style, bar[0]);
          const pct = Number(bar.find('.pct').text().replace('%', ''));
          if (Math.round(Number(sm[1]) * 100) !== pct) fail(`${ctx} scale ${sm[1]} != ${pct}%`, bar[0]);
          const aria = `${label} activation: ${pct} percent of MVIC`;
          if (bar.attr('aria-label') !== aria) fail(ctx + ' aria-label: ' + bar.attr('aria-label'), bar[0]);
          return { label, tone: barCls[0].replace(/^bar-/, ''), pct, scale: sm[1], filter: sm[2] || null };
        });
        items.push({ kind: 'activation', rows });
      } else fail(`${ctx}: unknown element in detail-block`, c);
    });
    return { heading, items };
  });

  return {
    key, number, name, nameSuffix, tags,
    sets: pills[0].value, reps: pills[1].value, rir: pills[2].value,
    pillVariant: pills[0].variant,
    setDots: dots,
    blocks,
  };
}

const totalSets = days.reduce((a, d) => a + d.totalSets, 0);
const dotTotal = exercises.reduce((a, e) => a + e.setDots.length, 0);
if (exercises.length !== 46) throw new Error('expected 46 exercises, got ' + exercises.length);
if (totalSets !== 132 || dotTotal !== 132) throw new Error(`set totals: rings ${totalSets}, dots ${dotTotal}`);

const ts = `// Initially generated from reference/protocol.html by scripts/extract-program.mjs.
// This file is now the source of truth for the program: edit it here.
// Exercise keys ("push-a1" ... "legs-b7") and set indices are permanent IDs:
// saved logs and old JSON backups reference them, so never rename them.

import type { Day, Exercise } from './types';

export const days: Day[] = ${JSON.stringify(days, null, 2)};

export const exercises: Exercise[] = ${JSON.stringify(exercises, null, 2)};

export const exerciseByKey: Record<string, Exercise> = Object.fromEntries(
  exercises.map(e => [e.key, e]),
);
`;
write('src/content/program.ts', ts);
console.log(`days: ${days.length}, exercises: ${exercises.length}, sets: ${totalSets}`);
