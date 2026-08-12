interface SpeechBubbleProps {
  message: string;
}

export function SpeechBubble({ message }: SpeechBubbleProps) {
  return (
    <div className="speech-bubble" role="status" aria-live="polite">
      <span className="speech-bubble-tail" />
      <p>{message}</p>
    </div>
  );
}
