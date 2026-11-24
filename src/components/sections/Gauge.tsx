import { Accent, SectionIntro } from './SectionIntro';

const RIR_STEPS = [
  { num: '0 RIR', label: 'Failure', color: 'var(--danger-bright)', recommended: false },
  { num: '1 RIR', label: '1 Rep Left', color: 'var(--moss-bright)', recommended: true },
  { num: '2 RIR', label: '2 Reps Left', color: 'var(--gold-bright)', recommended: true },
  { num: '3+ RIR', label: 'Too Easy', color: 'var(--steel-bright)', recommended: false },
];

/** Reps in Reserve, as a pressure gauge with its needle on 1–2 RIR. */
export function Gauge() {
  return (
    <section className="section" id="gauge">
      <SectionIntro eyebrow="Effort Calibration" title={<>Reading The <Accent>Pressure Gauge</Accent></>}>
        Every set in this program is prescribed by Reps in Reserve (RIR) — how many more reps you could have done before your form broke down. This is the needle you're aiming for, on every one of the 6 days.
      </SectionIntro>
      <div className="gauge-panel reveal">
        <div className="gauge-svg-wrap">
          <svg viewBox="0 0 300 200" className="gauge-svg">
            <path className="gauge-seg-fail" d="M30,170 A120,120 0 0 1 65.15,85.15" strokeWidth="26" fill="none" strokeLinecap="round" />
            <path className="gauge-seg-1" d="M65.15,85.15 A120,120 0 0 1 150,50" strokeWidth="26" fill="none" />
            <path className="gauge-seg-2" d="M150,50 A120,120 0 0 1 234.85,85.15" strokeWidth="26" fill="none" />
            <path className="gauge-seg-3" d="M234.85,85.15 A120,120 0 0 1 270,170" strokeWidth="26" fill="none" strokeLinecap="round" />
            <line className="gauge-needle" x1="150" y1="170" x2="111.7" y2="77.6" strokeWidth="4" strokeLinecap="round" />
            <circle cx="150" cy="170" r="10" fill="var(--ink)" />
            <circle cx="150" cy="170" r="4" fill="var(--bg-card)" />
          </svg>
          <p className="gauge-caption">
            Needle resting on <strong>1–2 RIR</strong> — where most working sets in this program live.
          </p>
        </div>
        <div>
          <div className="rir-scale">
            {RIR_STEPS.map((s) => (
              <div key={s.num} className={s.recommended ? 'rir-step recommended' : 'rir-step'} style={{ color: s.color }}>
                <span className="rir-num">{s.num}</span>
                <span className="rir-label">{s.label}</span>
              </div>
            ))}
          </div>
          <p className="gauge-note">
            <strong>Training recommendation:</strong> the majority of sets across all 6 sessions sit at 1–2 RIR. A meta-analysis of 11 controlled trials found no significant difference in hypertrophy between sets taken to complete failure versus stopping 1–2 reps short, provided effort was genuinely high — meaning you don't need to grind every set to zero to grow. This program reserves true 0-RIR failure for a small number of strategic moments per session — single heavy compounds, drop-set burnouts and small-muscle finishers — where the extra fatigue cost is cheapest.
          </p>
          <span className="cite">
            Helms, Cronin, Storey &amp; Zourdos (2016), Strength &amp; Cond J 38(4); Grgic, Schoenfeld, Orazem &amp; Sabol (2022), J Sport Health Sci 11(2)
          </span>
        </div>
      </div>
    </section>
  );
}
