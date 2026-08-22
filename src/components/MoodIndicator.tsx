import { usePetStore } from '../store/petStore';
import { computeMood, MOOD_EMOJI, MOOD_LABELS } from '../services/moodLogic';

export function MoodIndicator(): JSX.Element {
  const stats = usePetStore((s) => s.stats);
  const petState = usePetStore((s) => s.petState);
  const mood = computeMood(stats, petState);

  return (
    <div className="mood-indicator" title={`Mood: ${MOOD_LABELS[mood]}`}>
      <span className="mood-emoji" aria-hidden>{MOOD_EMOJI[mood]}</span>
      <div className="mood-stats" aria-label="Pet stats">
        <div className="mood-stat" title="Energy">
          <span className="mood-stat-label">⚡</span>
          <span className="mood-stat-bar">
            <span className="mood-stat-fill energy" style={{ width: `${stats.energy}%` }} />
          </span>
        </div>
        <div className="mood-stat" title="Happiness">
          <span className="mood-stat-label">♥</span>
          <span className="mood-stat-bar">
            <span className="mood-stat-fill happiness" style={{ width: `${stats.happiness}%` }} />
          </span>
        </div>
      </div>
    </div>
  );
}
