import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { LauncherApi } from "@shared/ipc/api";
import type { SeatSessionSnapshot, SessionInfo, UserInfo } from "@shared/schemas/auth";
import type { SystemActionItem } from "@shared/schemas/actions";
import type { CatalogSnapshot } from "@shared/schemas/catalog";
import type { Result } from "@shared/schemas/common";
import { BillingFeature, formatMinutesAsLabel } from "@renderer/features/billing/BillingFeature";
import { CatalogPanel } from "@renderer/features/catalog/CatalogPanel";
import { LoginScreen } from "@renderer/features/auth/LoginScreen";
import { AppDetailsModal } from "@renderer/features/launcher/components/AppDetailsModal";
import { BootSplash } from "@renderer/features/launcher/components/BootSplash";
import { CommandPaletteModal } from "@renderer/features/launcher/components/CommandPaletteModal";
import { ConfirmActionModal } from "@renderer/features/launcher/components/ConfirmActionModal";
import { LauncherTopBar } from "@renderer/features/launcher/components/LauncherTopBar";
import { SessionSnapshotPanel } from "@renderer/features/launcher/components/SessionSnapshotPanel";
import { ToastStack } from "@renderer/features/launcher/components/ToastStack";
import { useBootSplash } from "@renderer/features/launcher/hooks/useBootSplash";
import { useClock } from "@renderer/features/launcher/hooks/useClock";
import type { ActivityEntry, ToastMessage, UiTone } from "@renderer/features/launcher/types";
import { SystemActionsPanel } from "@renderer/features/system/SystemActionsPanel";
import { createMockLauncherApi } from "./mockLauncherApi";

const unwrap = <T,>(result: Result<T>): T => {
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
};

const createId = (): string => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

type ToastInput = Omit<ToastMessage, "id" | "createdAt">;

const resolveLauncherApi = (): LauncherApi => {
  const api = (window as Window & { launcherApi?: LauncherApi }).launcherApi;
  return api ?? createMockLauncherApi();
};

const formatElapsed = (startedAt: string): string => {
  const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

type AppStage = "booting" | "login" | "launcher";

export const App = () => {
  const [stage, setStage] = useState<AppStage>("booting");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [seatSnapshot, setSeatSnapshot] = useState<SeatSessionSnapshot | null>(null);
  const [sessionElapsed, setSessionElapsed] = useState<string | null>(null);

  const [catalog, setCatalog] = useState<CatalogSnapshot | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [systemActions, setSystemActions] = useState<SystemActionItem[]>([]);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [launchingAppId, setLaunchingAppId] = useState<string | null>(null);
  const [runningSystemActionId, setRunningSystemActionId] = useState<string | null>(null);
  const [refreshingCatalog, setRefreshingCatalog] = useState(false);
  const [bootReady, setBootReady] = useState(false);

  const [confirmAction, setConfirmAction] = useState<SystemActionItem | null>(null);
  const [inspectAppId, setInspectAppId] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [walletMinutes, setWalletMinutes] = useState(0);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  const { visible: splashVisible, progress: splashProgress, phase: splashPhase } = useBootSplash(bootReady);
  const { dateLabel, timeLabel } = useClock();

  const snapshotPollRef = useRef<number | null>(null);

  const pushToast = useCallback((payload: ToastInput) => {
    const next: ToastMessage = { id: createId(), createdAt: Date.now(), ...payload };
    setToasts((c) => [next, ...c].slice(0, 5));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((c) => c.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const id = window.setInterval(() => {
      const now = Date.now();
      setToasts((c) => c.filter((t) => now - t.createdAt < 5_000));
    }, 400);
    return () => window.clearInterval(id);
  }, [toasts.length]);

  const pushActivity = useCallback((tone: UiTone, title: string, details: string) => {
    const next: ActivityEntry = { id: createId(), tone, title, details, createdAt: Date.now() };
    setActivity((c) => [next, ...c].slice(0, 14));
  }, []);

  // Session elapsed timer
  useEffect(() => {
    const activeSession = seatSnapshot?.session;
    const isRunning =
      activeSession &&
      !activeSession.ended_at &&
      activeSession.status !== "finished" &&
      activeSession.status !== "completed";

    if (!isRunning) {
      setSessionElapsed(null);
      return;
    }
    const tick = () => setSessionElapsed(formatElapsed(activeSession.started_at));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [seatSnapshot]);

  const fetchSeatSnapshot = useCallback(async () => {
    try {
      const result = await resolveLauncherApi().authGetSeatSession();
      if (result.ok) setSeatSnapshot(result.data);
    } catch {
      // silent
    }
  }, []);

  const startSnapshotPolling = useCallback(() => {
    if (snapshotPollRef.current !== null) return;
    void fetchSeatSnapshot();
    snapshotPollRef.current = window.setInterval(() => void fetchSeatSnapshot(), 30_000);
  }, [fetchSeatSnapshot]);

  const stopSnapshotPolling = useCallback(() => {
    if (snapshotPollRef.current !== null) {
      window.clearInterval(snapshotPollRef.current);
      snapshotPollRef.current = null;
    }
  }, []);

  const loadLauncherData = useCallback(async () => {
    try {
      const api = resolveLauncherApi();
      const [catalogResult, systemResult] = await Promise.all([api.getCatalog(), api.getSystemActions()]);
      setCatalog(unwrap(catalogResult));
      setSystemActions(unwrap(systemResult));
      setCatalogError(null);
      pushActivity("success", "Initialization Complete", "All panels are ready.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to initialize launcher";
      setCatalogError(message);
      pushActivity("error", "Initialization Failed", message);
      window.setTimeout(() => void loadLauncherData(), 2_000);
    }
  }, [pushActivity]);

  // Boot: try to restore session from stored token
  useEffect(() => {
    const boot = async () => {
      try {
        const api = resolveLauncherApi();
        const meResult = await api.authMe();
        if (meResult.ok) {
          setCurrentUser(meResult.data);
          await loadLauncherData();
          setStage("launcher");
          startSnapshotPolling();
        } else {
          setStage("login");
        }
      } catch {
        setStage("login");
      } finally {
        setBootReady(true);
      }
    };
    void boot();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = useCallback(async (email: string, password: string) => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const api = resolveLauncherApi();
      const result = await api.authLogin(email, password);
      if (!result.ok) throw new Error(result.error.message);
      setCurrentUser(result.data);
      await loadLauncherData();
      setStage("launcher");
      startSnapshotPolling();
      pushActivity("success", "Signed In", result.data.full_name ?? result.data.email);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoginLoading(false);
    }
  }, [loadLauncherData, pushActivity, startSnapshotPolling]);

  const handleLogout = useCallback(() => {
    void resolveLauncherApi().authLogout();
    stopSnapshotPolling();
    setCurrentUser(null);
    setSeatSnapshot(null);
    setSessionElapsed(null);
    setStage("login");
    pushActivity("info", "Signed Out", "");
  }, [pushActivity, stopSnapshotPolling]);

  const handleStartSession = useCallback(async (reservationId: number) => {
    try {
      const result = await resolveLauncherApi().authStartSession(reservationId);
      const session = unwrap(result) as SessionInfo;
      setSeatSnapshot((prev) =>
        prev
          ? { ...prev, session, reservation: prev.reservation ? { ...prev.reservation, status: "session_started" } : null }
          : prev
      );
      pushActivity("success", "Session Started", `Reservation #${reservationId}`);
      pushToast({ tone: "success", title: "Session Started", message: "Timer is running." });
    } catch (error) {
      pushToast({ tone: "error", title: "Start Session Failed", message: error instanceof Error ? error.message : "Unknown error" });
    }
  }, [pushActivity, pushToast]);

  const handleEndSession = useCallback(async (sessionId: number) => {
    try {
      const result = await resolveLauncherApi().authEndSession(sessionId);
      const session = unwrap(result) as SessionInfo;
      setSeatSnapshot((prev) => (prev ? { ...prev, session } : prev));
      pushActivity("success", "Session Ended", `Session #${sessionId}`);
      pushToast({ tone: "success", title: "Session Ended", message: "Have a great day!" });
      await fetchSeatSnapshot();
    } catch (error) {
      pushToast({ tone: "error", title: "End Session Failed", message: error instanceof Error ? error.message : "Unknown error" });
    }
  }, [fetchSeatSnapshot, pushActivity, pushToast]);

  const refreshCatalog = useCallback(async (options?: { silent?: boolean }) => {
    try {
      setRefreshingCatalog(true);
      const refreshed = await resolveLauncherApi().refreshCatalog();
      setCatalog(unwrap(refreshed));
      if (!options?.silent) {
        pushToast({ tone: "success", title: "Catalog Updated", message: "Launcher data has been synced." });
        pushActivity("success", "Catalog Updated", "Applications and categories were refreshed.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to refresh catalog";
      pushToast({ tone: "error", title: "Refresh Error", message });
    } finally {
      setRefreshingCatalog(false);
    }
  }, [pushActivity, pushToast]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandQuery("");
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const appById = useMemo(() => new Map(catalog?.apps.map((app) => [app.id, app]) ?? []), [catalog]);

  const recentMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of catalog?.recent ?? []) map.set(entry.appId, entry.launchedAt);
    return map;
  }, [catalog]);

  const selectedApp = inspectAppId ? (appById.get(inspectAppId) ?? null) : null;

  const handleLaunch = useCallback(async (appId: string) => {
    const appTitle = appById.get(appId)?.title ?? appId;
    try {
      setLaunchingAppId(appId);
      pushActivity("info", "Launch Requested", appTitle);
      const launchResult = await resolveLauncherApi().launchApp(appId);
      unwrap(launchResult);
      const updatedCatalog = await resolveLauncherApi().getCatalog();
      setCatalog(unwrap(updatedCatalog));
      pushToast({ tone: "success", title: "Application Launched", message: `${appTitle} started successfully.` });
      pushActivity("success", "Launch Complete", appTitle);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Launch failed";
      pushToast({ tone: "error", title: "Launch Error", message });
      pushActivity("error", "Launch Failed", `${appTitle}: ${message}`);
    } finally {
      setLaunchingAppId(null);
    }
  }, [appById, pushActivity, pushToast]);

  const executeSystemAction = useCallback(async (action: SystemActionItem) => {
    try {
      setRunningSystemActionId(action.id);
      pushActivity("info", "System Action", action.title);
      const result = await resolveLauncherApi().runSystemAction(action.id);
      unwrap(result);
      pushToast({ tone: "success", title: "Action Completed", message: action.title });
      pushActivity("success", "System Action Completed", action.title);
    } catch (error) {
      const message = error instanceof Error ? error.message : "System action failed";
      pushToast({ tone: "error", title: "System Action Error", message });
      pushActivity("error", "System Action Failed", `${action.title}: ${message}`);
    } finally {
      setRunningSystemActionId(null);
    }
  }, [pushActivity, pushToast]);

  const handleRunSystemAction = useCallback((action: SystemActionItem) => {
    if (action.requiresConfirmation) { setConfirmAction(action); return; }
    void executeSystemAction(action);
  }, [executeSystemAction]);

  const handleConfirmSystemAction = useCallback(() => {
    if (!confirmAction) return;
    const pending = confirmAction;
    setConfirmAction(null);
    void executeSystemAction(pending);
  }, [confirmAction, executeSystemAction]);

  const installedAppsCount = catalog?.apps.filter((a) => a.installed).length ?? 0;
  const totalAppsCount = catalog?.apps.length ?? 0;
  const categoriesCount = catalog?.categories.length ?? 0;

  return (
    <>
      <BootSplash visible={splashVisible} progress={splashProgress} phase={splashPhase} />

      {stage === "login" && !splashVisible && (
        <LoginScreen onLogin={handleLogin} error={loginError} loading={loginLoading} />
      )}

      {stage === "launcher" && (
        <main className="oyna-shell" aria-hidden={splashVisible}>
          <div className="oyna-backdrop" aria-hidden="true" />

          <LauncherTopBar
            totalApps={totalAppsCount}
            installedApps={installedAppsCount}
            categoryCount={categoriesCount}
            walletLabel={formatMinutesAsLabel(walletMinutes)}
            dateLabel={dateLabel}
            timeLabel={timeLabel}
            refreshing={refreshingCatalog}
            currentUser={currentUser}
            seatSnapshot={seatSnapshot}
            sessionElapsed={sessionElapsed}
            onOpenBilling={() => setIsBillingOpen(true)}
            onRefreshCatalog={() => void refreshCatalog()}
            onStartSession={(id) => void handleStartSession(id)}
            onEndSession={(id) => void handleEndSession(id)}
            onLogout={handleLogout}
          />

          <section className="oyna-grid">
            <CatalogPanel
              catalog={catalog}
              catalogError={catalogError}
              search={search}
              selectedCategory={selectedCategory}
              launchingAppId={launchingAppId}
              onSearchChange={setSearch}
              onCategoryChange={setSelectedCategory}
              onLaunch={(appId) => void handleLaunch(appId)}
              onInspectApp={setInspectAppId}
            />

            <aside className="oyna-side-column">
              <SystemActionsPanel
                actions={systemActions}
                runningActionId={runningSystemActionId}
                onRunAction={handleRunSystemAction}
              />
              <SessionSnapshotPanel
                entries={activity}
                walletLabel={formatMinutesAsLabel(walletMinutes)}
                installedApps={installedAppsCount}
                totalApps={totalAppsCount}
              />
            </aside>
          </section>

          <ToastStack toasts={toasts} onDismiss={dismissToast} />

          <ConfirmActionModal
            open={Boolean(confirmAction)}
            action={confirmAction}
            running={runningSystemActionId === confirmAction?.id}
            onCancel={() => setConfirmAction(null)}
            onConfirm={handleConfirmSystemAction}
          />

          <AppDetailsModal
            open={Boolean(selectedApp)}
            app={selectedApp}
            lastLaunchedAt={selectedApp ? (recentMap.get(selectedApp.id) ?? null) : null}
            launchingAppId={launchingAppId}
            onClose={() => setInspectAppId(null)}
            onLaunch={(appId) => { setInspectAppId(null); void handleLaunch(appId); }}
          />

          <CommandPaletteModal
            open={isCommandPaletteOpen}
            catalog={catalog}
            query={commandQuery}
            launchingAppId={launchingAppId}
            onClose={() => { setIsCommandPaletteOpen(false); setCommandQuery(""); }}
            onQueryChange={setCommandQuery}
            onLaunch={(appId) => { setIsCommandPaletteOpen(false); setCommandQuery(""); void handleLaunch(appId); }}
          />

          <BillingFeature
            open={isBillingOpen}
            walletMinutes={walletMinutes}
            onClose={() => setIsBillingOpen(false)}
            onWalletChange={setWalletMinutes}
            onToast={pushToast}
            onActivity={pushActivity}
          />
        </main>
      )}
    </>
  );
};
