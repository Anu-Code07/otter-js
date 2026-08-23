import { usePetStore } from '../store/petStore';

export function MoodIndicator(): JSX.Element {
  const stats = usePetStore((s) => s.stats);

  return (
    <div className="mood-indicator" title="Energy">
      <div className="mood-stat" title="Energy">
        <span className="mood-stat-label">⚡</span>
        <span className="mood-stat-bar">
          <span className="mood-stat-fill energy" style={{ width: `${stats.energy}%` }} />
        </span>
      </div>
    </div>
  );
}
