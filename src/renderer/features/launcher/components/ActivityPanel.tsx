import { formatActivityTime } from "@renderer/features/launcher/utils/time";
import type { ActivityEntry } from "@renderer/features/launcher/types";

interface ActivityPanelProps {
  entries: ActivityEntry[];
}

export const ActivityPanel = ({ entries }: ActivityPanelProps) => (
  <section className="panel-card activity-panel">
    <div className="panel-title-row">
      <h3>Activity Feed</h3>
      <span>{entries.length}</span>
    </div>

    {entries.length === 0 ? (
      <p className="muted">No events yet. Launch an app or run a system action.</p>
    ) : (
      <ul className="activity-list">
        {entries.map((entry) => (
          <li key={entry.id} className="activity-item">
            <span className={`tone-dot tone-dot--${entry.tone}`} aria-hidden="true" />
            <div>
              <strong>{entry.title}</strong>
              <p>{entry.details}</p>
              <small>{formatActivityTime(entry.createdAt)}</small>
            </div>
          </li>
        ))}
      </ul>
    )}
  </section>
);
