interface LauncherTopBarProps {
  totalApps: number;
  installedApps: number;
  categoryCount: number;
  adminModeEnabled: boolean;
  processElevated: boolean;
  walletLabel: string;
  dateLabel: string;
  timeLabel: string;
  refreshing: boolean;
  onOpenBilling(): void;
  onRefreshCatalog(): void;
}

export const LauncherTopBar = ({
  totalApps,
  installedApps,
  categoryCount,
  adminModeEnabled,
  processElevated,
  walletLabel,
  dateLabel,
  timeLabel,
  refreshing,
  onOpenBilling,
  onRefreshCatalog
}: LauncherTopBarProps) => (
  <header className="oyna-topbar panel-card">
    <div className="oyna-brand">
      <p className="oyna-brand__kicker">OYNA</p>
      <h1>Control Panel</h1>
    </div>

    <div className="oyna-topbar__right">
      <div className="oyna-meta-clock">
        <span>{dateLabel}</span>
        <strong>{timeLabel}</strong>
      </div>

      <div className="oyna-stats-row" role="list" aria-label="launcher metrics">
        <span className="stat-chip" role="listitem">
          Apps {installedApps}/{totalApps}
        </span>
        <span className="stat-chip" role="listitem">
          Groups {categoryCount}
        </span>
        <span className="stat-chip" role="listitem">
          Wallet {walletLabel}
        </span>
        <span className={`stat-chip ${adminModeEnabled ? "stat-chip--active" : ""}`} role="listitem">
          Admin {adminModeEnabled ? "ON" : "OFF"}
        </span>
        <span className={`stat-chip ${processElevated ? "stat-chip--ok" : "stat-chip--warn"}`} role="listitem">
          {processElevated ? "Elevated" : "Standard"}
        </span>
      </div>

      <div className="oyna-topbar__actions">
        <button type="button" className="ghost-button" onClick={onOpenBilling}>
          Tariffs
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={onRefreshCatalog}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
    </div>
  </header>
);
