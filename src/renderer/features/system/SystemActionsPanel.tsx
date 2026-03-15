import type { SystemActionItem } from "@shared/schemas/actions";

interface SystemActionsPanelProps {
  actions: SystemActionItem[];
  runningActionId: string | null;
  onRunAction(action: SystemActionItem): void;
}

const toneClassMap: Partial<Record<SystemActionItem["id"], string>> = {
  restart: "action-entry--warn",
  shutdown: "action-entry--danger",
  signOut: "action-entry--warn"
};

export const SystemActionsPanel = ({
  actions,
  runningActionId,
  onRunAction
}: SystemActionsPanelProps) => (
  <section className="panel-card side-panel">
    <div className="panel-title-row">
      <h3>System Actions</h3>
      <span>{actions.length}</span>
    </div>

    <div className="action-list">
      {actions.map((action) => {
        const toneClass = toneClassMap[action.id] ?? "";

        return (
          <button
            key={action.id}
            type="button"
            className={`action-entry ${toneClass}`.trim()}
            onClick={() => onRunAction(action)}
            disabled={runningActionId === action.id}
          >
            <div>
              <strong>{action.title}</strong>
              <p>{action.description}</p>
            </div>
            <span>{runningActionId === action.id ? "..." : action.requiresConfirmation ? "Confirm" : "Run"}</span>
          </button>
        );
      })}
    </div>
  </section>
);
