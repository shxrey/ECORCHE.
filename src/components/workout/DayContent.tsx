import type { Day } from '@/content/types';
import { exerciseByKey } from '@/content/program';
import { ExerciseCard } from './ExerciseCard';

const RING_CIRCUMFERENCE = '150.8'; // 2π × r(24), as in the original markup

/** One training day (e.g. Push A): header, progress ring and its exercise cards. */
export function DayContent({ day }: { day: Day }) {
  const cap = day.id.charAt(0).toUpperCase() + day.id.slice(1); // "pushA" -> "PushA"
  return (
    <div className={day.active ? 'day-content active' : 'day-content'} id={day.id}>
      <section className="section" id={day.sectionId}>
        <div className="section-eyebrow reveal">{day.eyebrow}</div>
        <h2 className="section-title reveal">
          {day.title} <span className="accent">{day.letter}</span>
        </h2>
        <p className="section-subtitle reveal" dangerouslySetInnerHTML={{ __html: day.subtitleHtml }} />

        <div className="progress-bar-wrap reveal">
          <div className="progress-ring">
            <svg viewBox="0 0 58 58">
              <circle className="progress-ring-bg" cx="29" cy="29" r="24" />
              <circle
                className="progress-ring-fill"
                id={`ring${cap}`}
                cx="29"
                cy="29"
                r="24"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={RING_CIRCUMFERENCE}
              />
            </svg>
            <div className="progress-ring-text" id={`ringText${cap}`}>
              0/{day.totalSets}
            </div>
          </div>
          <div className="progress-info">
            <h5>{day.progressHeading}</h5>
            <p>{day.progressHint}</p>
          </div>
          <button className="reset-btn" data-legacy-onclick={`confirmResetDay('${day.id}')`}>
            {day.resetLabel}
          </button>
        </div>

        <div className="exercise-list">
          {day.exerciseKeys.map(key => (
            <ExerciseCard key={key} exercise={exerciseByKey[key]} />
          ))}
        </div>
      </section>
    </div>
  );
}
