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
}: AdminPanelProps) => (
  <section className="panel panel--side">
    <h2>Admin</h2>

    <div className="admin-state">
      <label className="toggle-row">
        <input
          type="checkbox"
          checked={adminState?.adminModeEnabled ?? false}
          onChange={(event) => onToggleMode(event.target.checked)}
        />
        <span>Admin mode</span>
      </label>

      <span className={`badge ${adminState?.processElevated ? "badge--ok" : "badge--warn"}`}>
        {adminState?.processElevated ? "Process elevated" : "Process non-elevated"}
      </span>
    </div>

    <div className="action-list">
      {actions.map((action) => {
        const disabled = !adminState?.adminModeEnabled || runningActionId === action.id;

        return (
          <button
            key={action.id}
            type="button"
            className="action-button"
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
