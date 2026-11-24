// One-shot migration tool: reads reference/protocol.html (a snapshot of
// Shrey_Hypertrophy_Protocol_WORKING.html) and generates the Next.js sources:
//
//   src/styles/protocol.css          the original <style> block, untouched except
//                                    the three font stacks now point at next/font
//   src/content/program.ts           the 6 training days + 46 exercises as typed data
//   src/legacy/fragments.ts          every non-workout section as raw HTML (to be
//                                    ported to React components section by section)
//   public/legacy/protocol.js        the original <script> blocks, unchanged logic
//
// Strict by design: any markup inside an exercise card that the data model
// does not know about throws, so nothing is silently dropped. After running,
// `npm run verify:legacy` proves the React render matches the original markup.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

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

// ---------- 1. CSS ----------
const css = src.match(/<style>\n?([\s\S]*?)<\/style>/)[1];
const fontLines = {
  "--font-display: 'Anton',": '--font-display: var(--nf-anton),',
  "--font-body: 'Inter',": '--font-body: var(--nf-inter),',
  "--font-mono: 'JetBrains Mono',": '--font-mono: var(--nf-jetbrains),',
};
let outCss = css;
for (const [from, to] of Object.entries(fontLines)) {
  if (!outCss.includes(from)) throw new Error('font stack not found: ' + from);
  outCss = outCss.replace(from, to);
}
// The bundler's CSS minifier, seeing both `backdrop-filter` and a hand-written
// `-webkit-backdrop-filter`, keeps only the Safari-only prefixed one, which
// silently kills every frosted-glass blur in Chrome/Edge. Drop the manual
// prefix and let the minifier add it for the browsers that need it.
const prefixed = /\s*-webkit-backdrop-filter:[^;]*;/g;
if (!prefixed.test(outCss)) throw new Error('expected -webkit-backdrop-filter declarations');
outCss = outCss.replace(prefixed, '');
write('src/styles/protocol.css',
  '/* Ported verbatim from the original single-file protocol. Two changes:\n' +
  '   the three --font-* stacks lead with the self-hosted next/font families\n' +
  '   instead of the Google Fonts <link>, and the hand-written\n' +
  '   -webkit-backdrop-filter lines are gone (the build adds that prefix;\n' +
  '   keeping both made it drop the standard one, so Chrome lost the blur). */\n' + outCss);

// ---------- 2. Body regions ----------
const bodyStart = src.indexOf('>', src.indexOf('<body')) + 1;
const firstScript = src.indexOf('<script>', bodyStart);
const body = src.slice(bodyStart, firstScript);
const parts = body.split(/<!-- ===== (.+?) ===== -->/);
const regions = {};
for (let i = 1; i < parts.length; i += 2) regions[parts[i]] = parts[i + 1].trim();
const expected = ['NAV', 'HERO', 'MASTER WEEKLY TRACKER', 'TEMPO PROTOCOL', 'PROGRAMMING STANDARDS',
  'PRESSURE GAUGE / RIR', 'WEEKLY VOLUME AUDIT', 'WORKOUT SESSIONS', 'ANATOMY / ENGAGEMENT MAP',
  'SOURCES', 'FOOTER', 'REST TIMER', 'TEMPO PACER (3s down / 1s stretch hold / explosive up)',
  'UNDO TOAST STACK', 'STANDARDS FAB', 'SESSION HISTORY MODAL', 'GENERIC CONFIRM MODAL (replaces window.confirm)'];
const got = Object.keys(regions);
if (JSON.stringify(got) !== JSON.stringify(expected)) throw new Error('Unexpected regions: ' + JSON.stringify(got));

const fragments = {
  nav: regions['NAV'],
  hero: regions['HERO'],
  tracker: regions['MASTER WEEKLY TRACKER'],
  protocol: regions['TEMPO PROTOCOL'],
  standards: regions['PROGRAMMING STANDARDS'],
  gauge: regions['PRESSURE GAUGE / RIR'],
  volume: regions['WEEKLY VOLUME AUDIT'],
  anatomy: regions['ANATOMY / ENGAGEMENT MAP'],
  sources: regions['SOURCES'],
  footer: regions['FOOTER'],
  overlays: expected.slice(11).map(k => regions[k]).join('\n\n'),
};
// Rebrand (2026-11-23): "Shrey's Blueprint" became ÉCORCHÉ. Only visible brand
// text changes; layout and styling stay exactly as in the original.
const rebrand = [
  ['nav', `<div class="nav-logo">SHREY'S <span>BLUEPRINT</span></div>`, '<div class="nav-logo">ÉCORCHÉ<span>.</span></div>'],
  ['footer', `<div class="logo-text">SHREY'S <span>BLUEPRINT</span></div>`, '<div class="logo-text">ÉCORCHÉ<span>.</span></div>'],
  ['hero', `Shrey's Science-Backed Protocol`, 'Science-Backed Protocol'],
  ['hero', 'id="heroAccent">BLUEPRINT</span>', 'id="heroAccent">PROTOCOL</span>'],
  // Legal links (2026-11-24), just above the signature; styled in src/styles/overrides.css.
  ['footer', '\n  <p style="margin-top:18px;font-size:11px;letter-spacing:0.08em;color:var(--ink-dim);font-family:var(--font-mono);">~ shrey</p>',
    '\n  <p class="footer-links"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="mailto:support@ecorche.app">Contact</a></p>' +
    '\n  <p style="margin-top:18px;font-size:11px;letter-spacing:0.08em;color:var(--ink-dim);font-family:var(--font-mono);">~ shrey</p>'],
  // kg / lb switch (2026-11-24) beside Auto-Rest; logic in scripts/legacy-units.js,
  // styled in src/styles/overrides.css. Starts on kg; the script marks the saved unit.
  ['tracker', '<div class="tracker-settings-row">\n',
    '<div class="tracker-settings-row">\n' +
    '      <div class="unit-toggle" role="group" aria-label="Weight unit">\n' +
    '        <span class="unit-toggle-label" aria-hidden="true">Units</span>\n' +
    '        <button type="button" class="active" data-unit="kg" aria-pressed="true" onclick="setWeightUnit(\'kg\')">kg</button>\n' +
    '        <button type="button" data-unit="lb" aria-pressed="false" onclick="setWeightUnit(\'lb\')">lb</button>\n' +
    '      </div>\n'],
  // The hidden file picker behind "Import Backup" had no name (screen-reader audit, 2026-11-24).
  ['tracker', '<input type="file" id="importFileInput" accept="application/json"',
    '<input type="file" id="importFileInput" aria-label="Backup file to import" accept="application/json"'],
];
for (const [key, from, to] of rebrand) {
  if (!fragments[key].includes(from)) throw new Error(`rebrand target missing in ${key}: ${from}`);
  fragments[key] = fragments[key].replace(from, to);
}
write('src/legacy/fragments.ts',
  '// Generated by scripts/extract-legacy.mjs from reference/protocol.html.\n' +
  '// Raw HTML for every section that has not been ported to React yet.\n' +
  '// Port one section at a time into src/components/, then delete its entry.\n\n' +
  'export const fragments = ' + JSON.stringify(fragments, null, 2) + ' as const;\n\n' +
  'export type FragmentName = keyof typeof fragments;\n');

// ---------- 3. Workout data ----------
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

const ts = `// Initially generated from reference/protocol.html by scripts/extract-legacy.mjs.
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

// ---------- 4. Legacy script ----------
const scripts = [...src.matchAll(/<script>\n?([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (scripts.length !== 3) throw new Error('expected 3 script blocks, got ' + scripts.length);
let js = scripts.join('\n;\n');
const patches = [
  // Loaded after hydration, so DOMContentLoaded may already have fired.
  ["document.addEventListener('DOMContentLoaded', initSessionTimerUI);",
   "if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSessionTimerUI); else initSessionTimerUI();"],
  // Rebrand: the hero heading is rewritten on every day switch (see fragments above).
  [`'<br><span class="accent" id="heroAccent">BLUEPRINT</span>'`,
   `'<br><span class="accent" id="heroAccent">PROTOCOL</span>'`],
  // Bug fix: Workout Mode keeps the screen awake, but the OS drops that lock
  // whenever you switch apps, and it was never taken again on return, so the
  // phone could sleep mid-workout after checking music or a message.
  [`    if (document.hidden) releaseWakeLock();\n`,
   `    if (document.hidden) releaseWakeLock();\n    else if (kioskActive) requestWakeLock(); // back from another app mid-workout\n`],
  // Bug fix: downloads carried the old app name and a UTC date (a day behind
  // before 05:30 in India). todayKey() is the app's own local-date helper.
  // The 'hypertrophy-blueprint' tag inside the file stays, so old backups import.
  [`a.download = 'hypertrophy-progress-' + new Date().toISOString().slice(0, 10) + '.json';`,
   `a.download = 'ecorche-backup-' + todayKey() + '.json';`],
  [`a.download = 'hypertrophy-log-' + new Date().toISOString().slice(0, 10) + '.csv';`,
   `a.download = 'ecorche-log-' + todayKey() + '.csv';`],
  [`suggestedName: 'hypertrophy-progress-autobackup.json',`,
   `suggestedName: 'ecorche-autobackup.json',`],

  // ---- kg / lb switch (2026-11-24) ----
  // Saved weights stay in kilograms (see scripts/legacy-units.js); every place
  // that reads a weight box or prints a weight goes through its helpers.
  [`  // ===== LOCAL STORAGE — VOICE ANNOUNCEMENT PREFERENCE =====\n`,
   readFileSync(resolve(root, 'scripts/legacy-units.js'), 'utf8').replace(/\r\n/g, '\n') +
   // Screen-reader names for the log boxes (2026-11-24), which say the unit too.
   readFileSync(resolve(root, 'scripts/legacy-labels.js'), 'utf8').replace(/\r\n/g, '\n') +
   `  // ===== LOCAL STORAGE — VOICE ANNOUNCEMENT PREFERENCE =====\n`],
  [`        bodyInner.appendChild(panel);\n`,
   `        bodyInner.appendChild(panel);\n        labelLogBoxes(card); // screen-reader names (scripts/legacy-labels.js)\n`],
  // Weight boxes: what's typed is saved as kg; what's saved is shown in the chosen unit.
  [`class="log-input log-weight" placeholder="kg" data-set="' + i + '">'`,
   `class="log-input log-weight" placeholder="' + weightUnit + '" data-set="' + i + '">'`],
  [`'<textarea class="exercise-notes" placeholder="Notes — e.g. elbows flared on set 2, drop 2.5kg next time"></textarea>'`,
   `'<textarea class="exercise-notes" placeholder="' + notesPlaceholder() + '"></textarea>'`],
  [`    if (!row) return;\n    const w = row.querySelector('.log-weight').value;\n`,
   `    if (!row) return;\n    const w = weightInputToKg(row.querySelector('.log-weight'));\n`],
  [`    card.querySelectorAll('.set-log-row').forEach(row => {\n      const w = row.querySelector('.log-weight').value;\n`,
   `    card.querySelectorAll('.set-log-row').forEach(row => {\n      const w = weightInputToKg(row.querySelector('.log-weight'));\n`],
  // data-kg remembers the exact saved/suggested kg each box was filled with.
  [`wEl.value = data.w || ''; rEl.value`,
   `wEl.value = weightToInput(data.w); wEl.setAttribute('data-kg', data.w || ''); rEl.value`],
  [`wEl.value = prior && prior.w ? prior.w : '';`,
   `wEl.value = prior && prior.w ? weightToInput(prior.w) : ''; wEl.setAttribute('data-kg', prior && prior.w ? prior.w : '');`],
  // Weights shown as text.
  [`if (row.w) parts.push(row.w + 'kg');`,
   `if (row.w) parts.push(weightToInput(row.w) + weightUnit);`],
  [`el.textContent = best ? 'Est. 1RM: ~' + (Math.round(best * 10) / 10) + 'kg' : '';`,
   `el.textContent = best ? 'Est. 1RM: ~' + formatEstimate(best) : '';`],
  [`bar.title = p.d + (p.est ? ': ~' + Math.round(p.est * 10) / 10 + 'kg e1RM' : ': no weight logged');`,
   `bar.title = p.d + (p.est ? ': ~' + formatEstimate(p.est) + ' e1RM' : ': no weight logged');`],
  // ▲/▼ badges and PRs compare weights as shown, so a weight that round-trips
  // through lb (60kg → 132.3lb → 60.01kg) never reads as a tiny gain. The badge
  // keeps 2 decimals, so a 1.25lb jump no longer shows as "+1.3".
  [`    const w = parseFloat(row.querySelector('.log-weight').value);\n`,
   `    const w = toUnit(weightInputToKg(row.querySelector('.log-weight')));\n`],
  [`    const priorW = prior ? parseFloat(prior.w) : NaN;\n`,
   `    const priorW = prior ? toUnit(prior.w) : NaN;\n`],
  [`      const diff = Math.round((w - priorW) * 10) / 10;\n      badge.textContent = '▲ +' + diff + 'kg ready';`,
   `      const diff = Math.round((w - priorW) * 100) / 100;\n      badge.textContent = '▲ +' + diff + weightUnit + ' ready';`],
  [`const w = parseFloat(entry && entry.w);`,
   `const w = toUnit(entry && entry.w);`],
  [`const w = parseFloat(entry.w);`,
   `const w = toUnit(entry.w);`],
  // Warm-up steps round to the smallest plate jump: 2 × 1.25kg, or 2 × 2.5lb.
  [`    const round25 = n => Math.round(n / 2.5) * 2.5;\n`,
   `    const plate = weightUnit === 'lb' ? 5 : 2.5;\n    const round25 = n => Math.round(n / plate) * plate;\n`],
  [`'%: <b>' + w + 'kg</b></span>'`,
   `'%: <b>' + w + weightUnit + '</b></span>'`],
  // CSV export: weights in the chosen unit, and the header says which.
  [`const rows = [['date', 'exercise', 'set', 'weight_kg', 'reps', 'rir']];`,
   `const rows = [['date', 'exercise', 'set', 'weight_' + weightUnit, 'reps', 'rir']];`],
  [`rows.push([date, exKey, setIdx, s.w || '', s.r || '', s.rir || '']);`,
   `rows.push([date, exKey, setIdx, weightToInput(s.w), s.r || '', s.rir || '']);`],
  // Backups remember the unit (manual export, then auto-backup); importing restores it.
  [`      sessionsMap: sessionsMap,\n      preferences: { autoRestEnabled: autoRestEnabled, audioEnabled: audioEnabled }\n`,
   `      sessionsMap: sessionsMap,\n      preferences: { autoRestEnabled: autoRestEnabled, audioEnabled: audioEnabled, weightUnit: weightUnit }\n`],
  [`        sessionsMap: sessionsMap,\n        preferences: { autoRestEnabled: autoRestEnabled, audioEnabled: audioEnabled }\n`,
   `        sessionsMap: sessionsMap,\n        preferences: { autoRestEnabled: autoRestEnabled, audioEnabled: audioEnabled, weightUnit: weightUnit }\n`],
  [`              if (typeof updateAudioBtn === 'function') updateAudioBtn();\n            }\n`,
   `              if (typeof updateAudioBtn === 'function') updateAudioBtn();\n            }\n` +
   `            if (prefsToApply.weightUnit === 'kg' || prefsToApply.weightUnit === 'lb') {\n` +
   `              weightUnit = prefsToApply.weightUnit;\n` +
   `              saveWeightUnit(weightUnit);\n` +
   `              applyWeightUnit();\n` +
   `            }\n`],
  // Mark the stored unit on the switch at start-up.
  [`  initAutoRestToggle();\n`,
   `  initAutoRestToggle();\n  applyWeightUnit();\n`],

  // ---- Workout timer sync (2026-11-24) ----
  // The running timers live inside the session-timer block's own scope, so
  // give the sync bridge a way in: read them, and replace them (dropping any
  // too old to be a live session, exactly as loading the page does).
  [`  const sessionTimerStarts = loadSessionTimerStarts(); // dayId -> start timestamp (ms)\n`,
   `  const sessionTimerStarts = loadSessionTimerStarts(); // dayId -> start timestamp (ms)\n` +
   `  // Cloud sync (scripts/legacy-bridge.js) reads and replaces the running timers through this.\n` +
   `  window.__legacySessionTimers = {\n` +
   `    read: function () { return Object.assign({}, sessionTimerStarts); },\n` +
   `    replace: function (next) {\n` +
   `      const now = Date.now();\n` +
   `      Object.keys(sessionTimerStarts).forEach(k => delete sessionTimerStarts[k]);\n` +
   `      Object.keys(next || {}).forEach(k => {\n` +
   `        const ts = next[k];\n` +
   `        if (typeof ts === 'number' && (now - ts) < SESSION_TIMER_STALE_MS) sessionTimerStarts[k] = ts;\n` +
   `      });\n` +
   `      saveSessionTimerStarts();\n` +
   `      if (Object.keys(sessionTimerStarts).length) ensureSessionTimerInterval();\n` +
   `      refreshSessionTimerDisplay();\n` +
   `    }\n` +
   `  };\n`],
];
for (const [from, to] of patches) {
  // Exactly one match, so a patch can never land somewhere unintended.
  const hits = js.split(from).length - 1;
  if (hits !== 1) throw new Error(`patch target found ${hits} times (expected 1): ` + from);
  js = js.replace(from, to);
}
// No service worker ships yet (PWA comes back in a later step).
const swStart = js.indexOf("  if ('serviceWorker' in navigator) {");
if (swStart < 0) throw new Error('service worker block not found');
const swEnd = js.indexOf('\n  }\n', swStart) + 4;
js = js.slice(0, swStart) + '  // Service worker registration removed during the Next.js port; returns with the PWA step.\n' + js.slice(swEnd);

const bootstrap = `// Original protocol logic, ported unchanged from the single-file app.
// React renders the exercise cards with data-legacy-on* attributes (React cannot
// emit inline handler strings); turn them back into real inline handlers first.
document.querySelectorAll('[data-legacy-onclick],[data-legacy-onkeydown]').forEach(function (el) {
  ['onclick', 'onkeydown'].forEach(function (evt) {
    var code = el.getAttribute('data-legacy-' + evt);
    if (code !== null) { el.setAttribute(evt, code); el.removeAttribute('data-legacy-' + evt); }
  });
});
`;
// The sync bridge must see every global it touches, or the patch silently no-ops.
const bridge = readFileSync(resolve(root, 'scripts/legacy-bridge.js'), 'utf8');
for (const name of ['saveUnifiedState', 'flushUnifiedState', 'saveAutoRest', 'saveAudioEnabled', 'saveHighContrast',
  'saveMesocycleWeek', 'updateAudioBtn', 'applyHighContrast', 'renderMesocycleBanner', 'updateSetDotAria',
  'applyStoredCompletion', 'initExerciseEnhancements', 'renderHistory', 'saveWeightUnit', 'applyWeightUnit']) {
  if (!new RegExp(`\\n  function ${name}\\(`).test(js)) throw new Error('legacy bridge: function not found: ' + name);
}
for (const name of ['doneMap', 'logMap', 'notesMap', 'sessionsMap', 'autoRestEnabled', 'audioEnabled',
  'highContrastEnabled', 'mesocycleWeek', 'weightUnit']) {
  if (!new RegExp(`\\n  let ${name} =`).test(js)) throw new Error('legacy bridge: top-level let not found: ' + name);
}
write('public/legacy/protocol.js', bootstrap + js + bridge);
