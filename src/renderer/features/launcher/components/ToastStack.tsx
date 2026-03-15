import type { ToastMessage } from "@renderer/features/launcher/types";

interface ToastStackProps {
  toasts: ToastMessage[];
  onDismiss(id: string): void;
}

export const ToastStack = ({ toasts, onDismiss }: ToastStackProps) => {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <aside className="toast-stack" aria-live="polite" aria-label="notifications">
      {toasts.map((toast) => (
        <article key={toast.id} className={`toast toast--${toast.tone}`}>
          <div>
            <h4>{toast.title}</h4>
            <p>{toast.message}</p>
          </div>
          <button type="button" aria-label="dismiss notification" onClick={() => onDismiss(toast.id)}>
            x
          </button>
        </article>
      ))}
    </aside>
  );
};
