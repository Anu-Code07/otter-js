import { usePetStore } from '../store/petStore';

export function StatusIndicator() {
  const petState = usePetStore((s) => s.petState);
  const active = usePetStore((s) => s.attentionSnapshot.active);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="status-indicator">
      <span>{petState}</span>
      <span>{active ? `${active.sourceId}:${active.status}` : 'no attention'}</span>
    </div>
  );
}
