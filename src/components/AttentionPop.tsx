export function AttentionPop(): JSX.Element {
  return (
    <div className="attention-pop" role="alert" aria-live="assertive">
      <span className="attention-pop-pulse" aria-hidden />
      <span className="attention-pop-text">Attention!</span>
    </div>
  );
}
