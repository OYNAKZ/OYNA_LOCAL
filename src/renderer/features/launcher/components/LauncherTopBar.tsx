import type { SeatSessionSnapshot, UserInfo } from "@shared/schemas/auth";

interface LauncherTopBarProps {
  totalApps: number;
  installedApps: number;
  categoryCount: number;
  walletLabel: string;
  dateLabel: string;
  timeLabel: string;
  refreshing: boolean;
  currentUser: UserInfo | null;
  seatSnapshot: SeatSessionSnapshot | null;
  sessionElapsed: string | null;
  onOpenBilling(): void;
  onRefreshCatalog(): void;
  onStartSession(reservationId: number): void;
  onEndSession(sessionId: number): void;
  onLogout(): void;
}

const statusLabel = (status: string) => {
  if (status === "session_started" || status === "active") return { text: "Active", cls: "session-badge--active" };
  if (status === "checked_in") return { text: "Checked In", cls: "session-badge--active" };
  if (status === "confirmed" || status === "pending_payment") return { text: "Upcoming", cls: "session-badge--upcoming" };
  return { text: status, cls: "session-badge--default" };
};

export const LauncherTopBar = ({
  totalApps,
  installedApps,
  categoryCount,
  walletLabel,
  dateLabel,
  timeLabel,
  refreshing,
  currentUser,
  seatSnapshot,
  sessionElapsed,
  onOpenBilling,
  onRefreshCatalog,
  onStartSession,
  onEndSession,
  onLogout
}: LauncherTopBarProps) => {
  const { reservation, session, reservationUser } = seatSnapshot ?? {};

  const canStart =
    reservation &&
    !session &&
    ["confirmed", "pending_payment", "checked_in"].includes(reservation.status);

  const isRunning = session && !session.ended_at && session.status !== "finished" && session.status !== "completed";

  const guestName = reservationUser?.full_name ?? reservationUser?.email ?? null;

  return (
    <header className="oyna-topbar panel-card">
      <div className="oyna-brand">
        <p className="oyna-brand__kicker">OYNA</p>
        <h1>Control Panel</h1>
      </div>

      {/* Session strip */}
      {(reservation || session) && (
        <div className="oyna-session-strip">
          {guestName && <span className="session-guest">{guestName}</span>}

          {reservation && (
            <span className={`session-badge ${statusLabel(reservation.status).cls}`}>
              {statusLabel(reservation.status).text}
            </span>
          )}

          {isRunning && sessionElapsed && (
            <span className="session-elapsed">⏱ {sessionElapsed}</span>
          )}

          {isRunning && session.planned_end_at && (
            <span className="session-end-label">
              until{" "}
              {new Date(session.planned_end_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}

          {canStart && (
            <button
              type="button"
              className="primary-button session-action-btn"
              onClick={() => onStartSession(reservation.id)}
            >
              Start Session
            </button>
          )}

          {isRunning && (
            <button
              type="button"
              className="ghost-button session-action-btn session-action-btn--end"
              onClick={() => onEndSession(session.id)}
            >
              End Session
            </button>
          )}
        </div>
      )}

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
        </div>

        <div className="oyna-topbar__actions">
          {currentUser && (
            <span className="topbar-user">
              {currentUser.full_name ?? currentUser.email}
            </span>
          )}
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
          {currentUser && (
            <button type="button" className="ghost-button" onClick={onLogout}>
              Sign Out
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
