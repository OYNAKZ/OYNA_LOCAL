import type { ActivityEntry } from "@renderer/features/launcher/types";

interface SessionSnapshotPanelProps {
  entries: ActivityEntry[];
  walletLabel: string;
  installedApps: number;
  totalApps: number;
  adminModeEnabled: boolean;
}

const toneLabels = {
  success: "Success",
  warning: "Warnings",
  error: "Errors"
} as const;

export const SessionSnapshotPanel = ({
  entries,
  walletLabel,
  installedApps,
  totalApps,
  adminModeEnabled
}: SessionSnapshotPanelProps) => {
  const counts = {
    success: entries.filter((entry) => entry.tone === "success").length,
    warning: entries.filter((entry) => entry.tone === "warning").length,
    error: entries.filter((entry) => entry.tone === "error").length
  };

  const lastEntry = entries[0] ?? null;

  return (
    <section className="panel-card session-panel">
      <div className="panel-title-row">
        <h3>Session Snapshot</h3>
        <span>{entries.length}</span>
      </div>

      <div className="session-metric-grid">
        <article className="session-tile session-tile--wallet">
          <small>Wallet</small>
          <strong>{walletLabel}</strong>
        </article>

        <article className="session-tile session-tile--apps">
          <small>Ready Apps</small>
          <strong>
            {installedApps}/{totalApps}
          </strong>
        </article>

        <article className="session-tile session-tile--events">
          <small>Events</small>
          <strong>{entries.length}</strong>
        </article>

        <article className={`session-tile ${adminModeEnabled ? "session-tile--admin-on" : "session-tile--admin-off"}`}>
          <small>Admin</small>
          <strong>{adminModeEnabled ? "ON" : "OFF"}</strong>
        </article>
      </div>

      <div className="session-tone-row">
        {(Object.keys(counts) as Array<keyof typeof counts>).map((tone) => (
          <div key={tone} className={`session-tone session-tone--${tone}`}>
            <small>{toneLabels[tone]}</small>
            <strong>{counts[tone]}</strong>
          </div>
        ))}
      </div>

      <div className="session-last-event">
        <small>Latest event</small>
        {lastEntry ? (
          <>
            <strong>{lastEntry.title}</strong>
            <p>{lastEntry.details}</p>
          </>
        ) : (
          <p>No events yet. Launch an app to populate session stats.</p>
        )}
      </div>
    </section>
  );
};
