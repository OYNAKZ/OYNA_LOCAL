import type { AdminActionItem, AdminState } from "@shared/schemas/actions";

interface AdminPanelProps {
  adminState: AdminState | null;
  actions: AdminActionItem[];
  runningActionId: string | null;
  onToggleMode(enabled: boolean): void;
  onRunAction(actionId: AdminActionItem["id"]): void;
}

export const AdminPanel = ({
  adminState,
  actions,
  runningActionId,
  onToggleMode,
  onRunAction
}: AdminPanelProps) => {
  const adminEnabled = adminState?.adminModeEnabled ?? false;

  return (
    <section className="panel-card side-panel">
      <div className="panel-title-row">
        <h3>Admin Control</h3>
        <span className={`state-pill ${adminState?.processElevated ? "state-pill--ok" : "state-pill--warn"}`}>
          {adminState?.processElevated ? "Elevated" : "Standard"}
        </span>
      </div>

      <label className="admin-switch" htmlFor="admin-toggle">
        <input
          id="admin-toggle"
          type="checkbox"
          checked={adminEnabled}
          onChange={(event) => onToggleMode(event.target.checked)}
        />
        <span className="admin-switch__track" aria-hidden="true" />
        <span>{adminEnabled ? "Admin mode is enabled" : "Admin mode is disabled"}</span>
      </label>

      <div className="action-list">
        {actions.map((action) => {
          const disabled = !adminEnabled || runningActionId === action.id;

          return (
            <button
              key={action.id}
              type="button"
              className="action-entry"
              onClick={() => onRunAction(action.id)}
              disabled={disabled}
            >
              <div>
                <strong>{action.title}</strong>
                <p>{action.description}</p>
              </div>
              <span>{runningActionId === action.id ? "..." : "Run"}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
