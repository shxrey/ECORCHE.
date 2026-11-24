// The original page's sections as HTML (from reference/protocol.html), with the
// rebrand edits applied. Shared by extract-legacy.mjs, which ships the sections
// not yet ported to React as src/legacy/fragments.ts, and verify-legacy.tsx,
// which proves each ported React section still renders the same markup.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Sections now rendered by React components (src/components/sections/). Their
 * HTML is left out of src/legacy/fragments.ts but still checked by verify:legacy.
 */
export const PORTED = ['protocol', 'standards', 'gauge', 'volume', 'footer'];

export function readReference() {
  return readFileSync(resolve(root, 'reference/protocol.html'), 'utf8').replace(/\r\n/g, '\n');
}

/** The page body split at its "<!-- ===== NAME ===== -->" markers. */
export function legacyRegions(src = readReference()) {
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
  return { regions, expected };
}

/** Every section's HTML, keyed by fragment name, rebrand edits applied. */
export function legacyFragments(src = readReference()) {
  const { regions, expected } = legacyRegions(src);
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
  // Same plain link as FEEDBACK_HREF in src/lib/feedback.ts (this script can't import TypeScript).
  const FEEDBACK_HREF = 'mailto:support@ecorche.app?subject=' + encodeURIComponent('ÉCORCHÉ feedback');
  const rebrand = [
    ['nav', `<div class="nav-logo">SHREY'S <span>BLUEPRINT</span></div>`, '<div class="nav-logo">ÉCORCHÉ<span>.</span></div>'],
    ['footer', `<div class="logo-text">SHREY'S <span>BLUEPRINT</span></div>`, '<div class="logo-text">ÉCORCHÉ<span>.</span></div>'],
    ['hero', `Shrey's Science-Backed Protocol`, 'Science-Backed Protocol'],
    ['hero', 'id="heroAccent">BLUEPRINT</span>', 'id="heroAccent">PROTOCOL</span>'],
    // Legal links (2026-11-24), just above the signature; styled in src/styles/overrides.css.
    ['footer', '\n  <p style="margin-top:18px;font-size:11px;letter-spacing:0.08em;color:var(--ink-dim);font-family:var(--font-mono);">~ shrey</p>',
      '\n  <p class="footer-links"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="mailto:support@ecorche.app">Contact</a>' +
      `<a href="${FEEDBACK_HREF}" data-feedback>Feedback</a></p>` +
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
    // "Send feedback" at the bottom of the phone menu (2026-11-24); src/components/FeedbackLinks.tsx
    // fills in the page and device details on click. Styled in src/styles/overrides.css.
    ['nav', '  <a href="#sources" onclick="toggleDrawer(false)">Sources</a>\n</div>',
      '  <a href="#sources" onclick="toggleDrawer(false)">Sources</a>\n' +
      `  <a href="${FEEDBACK_HREF}" class="drawer-feedback" data-feedback onclick="toggleDrawer(false)">Send feedback</a>\n</div>`],
    // The hidden file picker behind "Import Backup" had no name (screen-reader audit, 2026-11-24).
    ['tracker', '<input type="file" id="importFileInput" accept="application/json"',
      '<input type="file" id="importFileInput" aria-label="Backup file to import" accept="application/json"'],
  ];
  for (const [key, from, to] of rebrand) {
    if (!fragments[key].includes(from)) throw new Error(`rebrand target missing in ${key}: ${from}`);
    fragments[key] = fragments[key].replace(from, to);
  }
  return fragments;
}
