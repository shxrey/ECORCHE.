import { days } from '@/content/program';
import { DayContent } from './DayContent';

/** All six training days. The legacy runtime shows one at a time. */
export function Workout() {
  return (
    <div id="workout">
      {days.map(day => (
        <DayContent key={day.id} day={day} />
      ))}
    </div>
  );
}
