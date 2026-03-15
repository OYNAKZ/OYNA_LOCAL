import type { LauncherApp } from "@shared/schemas/catalog";
import { Modal } from "@renderer/features/launcher/components/Modal";
import { formatRelativeTime } from "@renderer/features/launcher/utils/time";

interface AppDetailsModalProps {
  open: boolean;
  app: LauncherApp | null;
  lastLaunchedAt: string | null;
  launchingAppId: string | null;
  onClose(): void;
  onLaunch(appId: string): void;
}

export const AppDetailsModal = ({
  open,
  app,
  lastLaunchedAt,
  launchingAppId,
  onClose,
  onLaunch
}: AppDetailsModalProps) => {
  if (!open || !app) {
    return null;
  }

  const launching = launchingAppId === app.id;
  const launchLabel = lastLaunchedAt ? formatRelativeTime(lastLaunchedAt) : "never launched";

  return (
    <Modal
      open={open}
      title={app.title}
      onClose={onClose}
      footer={
        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => onLaunch(app.id)}
            disabled={!app.installed || launching}
          >
            {launching ? "Launching..." : "Launch"}
          </button>
        </div>
      }
    >
      <p className="modal-emphasis">{app.installed ? "Application ready" : "Application not found"}</p>
      <p>{app.description ?? "No description"}</p>

      <div className="details-grid">
        <div>
          <small>Category</small>
          <strong>{app.categoryId}</strong>
        </div>
        <div>
          <small>Last launch</small>
          <strong>{launchLabel}</strong>
        </div>
      </div>

      <div className="tag-row">
        {app.tags.map((tag) => (
          <span key={`${app.id}-${tag}`} className="tag-pill">
            #{tag}
          </span>
        ))}
        {app.requiresAdmin ? <span className="tag-pill tag-pill--warn">admin</span> : null}
      </div>
    </Modal>
  );
};
