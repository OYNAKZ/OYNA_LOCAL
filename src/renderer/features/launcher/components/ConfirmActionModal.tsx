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
      title="Confirm System Action"
      onClose={running ? () => undefined : onCancel}
      footer={
        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onCancel} disabled={running}>
            Cancel
          </button>
          <button type="button" className="danger-button" onClick={onConfirm} disabled={running}>
            {running ? "Running..." : "Confirm"}
          </button>
        </div>
      }
    >
      <p className="modal-emphasis">{action.title}</p>
      <p>{action.description}</p>
      <p className="muted">This action can affect the current session and workstation state.</p>
    </Modal>
  );
};
