import { ATTENTION_SOURCE_LABELS } from '../types/attention';
import type { AttentionSignal } from '../types/attention';
import { usePetStore } from '../store/petStore';

interface AlertBannerProps {
  signal: AttentionSignal;
  onSnooze?: () => void;
}

export function AlertBanner({ signal, onSnooze }: AlertBannerProps): JSX.Element {
  const title = signal.title ?? ATTENTION_SOURCE_LABELS[signal.sourceId];
  const message = signal.message ?? 'Something needs your attention.';

  return (
    <div className="alert-banner" role="alert" aria-live="assertive">
      <span className="alert-banner-pulse" aria-hidden />
      <div className="alert-banner-body">
        <span className="alert-banner-source">{ATTENTION_SOURCE_LABELS[signal.sourceId]}</span>
        <strong className="alert-banner-title">{title}</strong>
        <p className="alert-banner-message">{message}</p>
      </div>
      {onSnooze && (
        <button
          type="button"
          className="alert-banner-snooze"
          onClick={onSnooze}
          title="Snooze alerts for 10 minutes"
        >
          Snooze
        </button>
      )}
    </div>
  );
}

export function AlertBannerFromStore(): JSX.Element | null {
  const activeAlert = usePetStore((s) => s.activeAlert);
  if (!activeAlert) return null;

  const snooze = () => {
    usePetStore.getState().snoozeAlerts(10 * 60 * 1000);
    usePetStore.getState().hideAlert();
  };

  return <AlertBanner signal={activeAlert} onSnooze={snooze} />;
}
