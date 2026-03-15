import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose(): void;
}

export const Modal = ({ open, title, children, footer, onClose }: ModalProps) => {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <section
        className="modal-window"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <header className="modal-window__header">
          <h3>{title}</h3>
          <button type="button" onClick={onClose} aria-label="close modal">
            x
          </button>
        </header>

        <div className="modal-window__content">{children}</div>
        {footer ? <footer className="modal-window__footer">{footer}</footer> : null}
      </section>
    </div>
  );
};
