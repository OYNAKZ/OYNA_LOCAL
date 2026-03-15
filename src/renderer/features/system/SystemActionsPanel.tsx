import type { SystemActionItem } from "@shared/schemas/actions";

interface SystemActionsPanelProps {
  actions: SystemActionItem[];
  runningActionId: string | null;
  onRunAction(action: SystemActionItem): void;
}

export const SystemActionsPanel = ({
  actions,
  runningActionId,
  onRunAction
}: SystemActionsPanelProps) => (
  <section className="panel panel--side">
    <h2>System Actions</h2>
    <div className="action-list">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          className="action-button"
          onClick={() => onRunAction(action)}
          disabled={runningActionId === action.id}
        >
          <div>
            <strong>{action.title}</strong>
            <p>{action.description}</p>
          </div>
          <span>{runningActionId === action.id ? "..." : "Run"}</span>
        </button>
      ))}
    </div>
  </section>
);
