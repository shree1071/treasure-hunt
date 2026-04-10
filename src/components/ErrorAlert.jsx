function ErrorAlert({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="alert error">
      <span>{message}</span>
      {onClose && (
        <button className="alert-close" onClick={onClose} aria-label="Dismiss">✕</button>
      )}
    </div>
  );
}

export default ErrorAlert;
