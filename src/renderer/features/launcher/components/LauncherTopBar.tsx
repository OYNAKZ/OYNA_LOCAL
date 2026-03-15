interface LauncherTopBarProps {
  totalApps: number;
  installedApps: number;
  categoryCount: number;
  adminModeEnabled: boolean;
  processElevated: boolean;
  dateLabel: string;
  timeLabel: string;
  refreshing: boolean;
  onOpenPalette(): void;
  onRefreshCatalog(): void;
}

export const LauncherTopBar = ({
  totalApps,
  installedApps,
  categoryCount,
  adminModeEnabled,
  processElevated,
  dateLabel,
  timeLabel,
  refreshing,
  onOpenPalette,
  onRefreshCatalog
}: LauncherTopBarProps) => (
  <header className="oyna-topbar panel-card">
    <div className="oyna-brand">
      <p className="oyna-brand__kicker">OYNA // LAUNCHER</p>
      <h1>Игровая станция клуба</h1>
      <p className="oyna-brand__subtitle">Локальная консоль запуска и управления рабочим местом</p>
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
          Категории {categoryCount}
        </span>
        <span className={`stat-chip ${adminModeEnabled ? "stat-chip--active" : ""}`} role="listitem">
          Admin {adminModeEnabled ? "ON" : "OFF"}
        </span>
        <span className={`stat-chip ${processElevated ? "stat-chip--ok" : "stat-chip--warn"}`} role="listitem">
          {processElevated ? "Elevated" : "Standard"}
        </span>
      </div>

      <div className="oyna-topbar__actions">
        <button type="button" className="ghost-button" onClick={onOpenPalette}>
          Команды (Ctrl+K)
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={onRefreshCatalog}
          disabled={refreshing}
        >
          {refreshing ? "Обновление..." : "Обновить каталог"}
        </button>
      </div>
    </div>
  </header>
);
