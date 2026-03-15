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
  const launchLabel = lastLaunchedAt ? formatRelativeTime(lastLaunchedAt) : "ещё не запускалось";

  return (
    <Modal
      open={open}
      title={app.title}
      onClose={onClose}
      footer={
        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            Закрыть
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => onLaunch(app.id)}
            disabled={!app.installed || launching}
          >
            {launching ? "Запуск..." : "Запустить"}
          </button>
        </div>
      }
    >
      <p className="modal-emphasis">{app.installed ? "Приложение готово к запуску" : "Приложение не найдено"}</p>
      <p>{app.description ?? "Описание отсутствует"}</p>

      <div className="details-grid">
        <div>
          <small>Категория</small>
          <strong>{app.categoryId}</strong>
        </div>
        <div>
          <small>Последний запуск</small>
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
