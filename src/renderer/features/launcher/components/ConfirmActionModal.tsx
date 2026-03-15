import type { SystemActionItem } from "@shared/schemas/actions";
import { Modal } from "@renderer/features/launcher/components/Modal";

interface ConfirmActionModalProps {
  open: boolean;
  action: SystemActionItem | null;
  running: boolean;
  onCancel(): void;
  onConfirm(): void;
}

export const ConfirmActionModal = ({
  open,
  action,
  running,
  onCancel,
  onConfirm
}: ConfirmActionModalProps) => {
  if (!open || !action) {
    return null;
  }

  return (
    <Modal
      open={open}
      title="Подтверждение системного действия"
      onClose={running ? () => undefined : onCancel}
      footer={
        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onCancel} disabled={running}>
            Отмена
          </button>
          <button type="button" className="danger-button" onClick={onConfirm} disabled={running}>
            {running ? "Выполнение..." : "Подтвердить"}
          </button>
        </div>
      }
    >
      <p className="modal-emphasis">{action.title}</p>
      <p>{action.description}</p>
      <p className="muted">Действие может повлиять на текущую игровую сессию и работу станции.</p>
    </Modal>
  );
};
