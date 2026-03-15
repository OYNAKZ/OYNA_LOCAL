import { useCallback, useEffect, useMemo, useState } from "react";

import type { AdminActionItem, AdminState, SystemActionItem } from "@shared/schemas/actions";
import type { CatalogSnapshot } from "@shared/schemas/catalog";
import type { Result } from "@shared/schemas/common";
import { AdminPanel } from "@renderer/features/admin/AdminPanel";
import { CatalogPanel } from "@renderer/features/catalog/CatalogPanel";
import { ActivityPanel } from "@renderer/features/launcher/components/ActivityPanel";
import { AppDetailsModal } from "@renderer/features/launcher/components/AppDetailsModal";
import { BootSplash } from "@renderer/features/launcher/components/BootSplash";
import { CommandPaletteModal } from "@renderer/features/launcher/components/CommandPaletteModal";
import { ConfirmActionModal } from "@renderer/features/launcher/components/ConfirmActionModal";
import { LauncherTopBar } from "@renderer/features/launcher/components/LauncherTopBar";
import { ToastStack } from "@renderer/features/launcher/components/ToastStack";
import { useBootSplash } from "@renderer/features/launcher/hooks/useBootSplash";
import { useClock } from "@renderer/features/launcher/hooks/useClock";
import type { ActivityEntry, ToastMessage, UiTone } from "@renderer/features/launcher/types";
import { SystemActionsPanel } from "@renderer/features/system/SystemActionsPanel";

const unwrap = <T,>(result: Result<T>): T => {
  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.data;
};

const createId = (): string => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

type ToastInput = Omit<ToastMessage, "id" | "createdAt">;

export const App = () => {
  const [catalog, setCatalog] = useState<CatalogSnapshot | null>(null);
  const [systemActions, setSystemActions] = useState<SystemActionItem[]>([]);
  const [adminActions, setAdminActions] = useState<AdminActionItem[]>([]);
  const [adminState, setAdminState] = useState<AdminState | null>(null);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [launchingAppId, setLaunchingAppId] = useState<string | null>(null);
  const [runningSystemActionId, setRunningSystemActionId] = useState<string | null>(null);
  const [runningAdminActionId, setRunningAdminActionId] = useState<string | null>(null);

  const [refreshingCatalog, setRefreshingCatalog] = useState(false);
  const [bootReady, setBootReady] = useState(false);

  const [confirmAction, setConfirmAction] = useState<SystemActionItem | null>(null);
  const [inspectAppId, setInspectAppId] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  const { visible: splashVisible, progress: splashProgress, phase: splashPhase } = useBootSplash(bootReady);
  const { dateLabel, timeLabel } = useClock();

  const pushToast = useCallback((payload: ToastInput) => {
    const nextToast: ToastMessage = {
      id: createId(),
      createdAt: Date.now(),
      ...payload
    };

    setToasts((current) => [nextToast, ...current].slice(0, 5));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }

    const timerId = window.setInterval(() => {
      const now = Date.now();
      setToasts((current) => current.filter((item) => now - item.createdAt < 5_000));
    }, 400);

    return () => {
      window.clearInterval(timerId);
    };
  }, [toasts.length]);

  const pushActivity = useCallback((tone: UiTone, title: string, details: string) => {
    const nextEntry: ActivityEntry = {
      id: createId(),
      tone,
      title,
      details,
      createdAt: Date.now()
    };

    setActivity((current) => [nextEntry, ...current].slice(0, 14));
  }, []);

  const refreshCatalog = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        setRefreshingCatalog(true);
        const refreshed = await window.launcherApi.refreshCatalog();
        setCatalog(unwrap(refreshed));

        if (!options?.silent) {
          pushToast({
            tone: "success",
            title: "Catalog Updated",
            message: "Launcher data has been synced."
          });
          pushActivity("success", "Catalog Updated", "Applications and categories were refreshed.");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to refresh catalog";
        pushToast({
          tone: "error",
          title: "Refresh Error",
          message
        });
        pushActivity("error", "Catalog Refresh Failed", message);
      } finally {
        setRefreshingCatalog(false);
      }
    },
    [pushActivity, pushToast]
  );

  const loadInitialData = useCallback(async () => {
    try {
      const [catalogResult, systemResult, adminActionsResult, adminStateResult] = await Promise.all([
        window.launcherApi.getCatalog(),
        window.launcherApi.getSystemActions(),
        window.launcherApi.getAdminActions(),
        window.launcherApi.getAdminState()
      ]);

      setCatalog(unwrap(catalogResult));
      setSystemActions(unwrap(systemResult));
      setAdminActions(unwrap(adminActionsResult));
      setAdminState(unwrap(adminStateResult));

      pushToast({
        tone: "success",
        title: "OYNA Ready",
        message: "Launcher is loaded and waiting for commands."
      });
      pushActivity("success", "Initialization Complete", "All panels are ready.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to initialize launcher";
      pushToast({
        tone: "error",
        title: "Initialization Error",
        message
      });
      pushActivity("error", "Initialization Failed", message);
    } finally {
      setBootReady(true);
    }
  }, [pushActivity, pushToast]);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandQuery("");
        setIsCommandPaletteOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const appById = useMemo(() => new Map(catalog?.apps.map((app) => [app.id, app]) ?? []), [catalog]);

  const recentMap = useMemo(() => {
    const map = new Map<string, string>();

    for (const entry of catalog?.recent ?? []) {
      map.set(entry.appId, entry.launchedAt);
    }

    return map;
  }, [catalog]);

  const selectedApp = inspectAppId ? (appById.get(inspectAppId) ?? null) : null;

  const handleLaunch = useCallback(
    async (appId: string) => {
      const appTitle = appById.get(appId)?.title ?? appId;

      try {
        setLaunchingAppId(appId);
        pushActivity("info", "Launch Requested", appTitle);

        const launchResult = await window.launcherApi.launchApp(appId);
        unwrap(launchResult);

        const updatedCatalog = await window.launcherApi.getCatalog();
        setCatalog(unwrap(updatedCatalog));

        pushToast({
          tone: "success",
          title: "Application Launched",
          message: `${appTitle} started successfully.`
        });
        pushActivity("success", "Launch Complete", appTitle);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Launch failed";
        pushToast({
          tone: "error",
          title: "Launch Error",
          message
        });
        pushActivity("error", "Launch Failed", `${appTitle}: ${message}`);
      } finally {
        setLaunchingAppId(null);
      }
    },
    [appById, pushActivity, pushToast]
  );

  const executeSystemAction = useCallback(
    async (action: SystemActionItem) => {
      try {
        setRunningSystemActionId(action.id);
        pushActivity("info", "System Action", action.title);

        const result = await window.launcherApi.runSystemAction(action.id);
        unwrap(result);

        pushToast({
          tone: "success",
          title: "Action Completed",
          message: action.title
        });
        pushActivity("success", "System Action Completed", action.title);
      } catch (error) {
        const message = error instanceof Error ? error.message : "System action failed";
        pushToast({
          tone: "error",
          title: "System Action Error",
          message
        });
        pushActivity("error", "System Action Failed", `${action.title}: ${message}`);
      } finally {
        setRunningSystemActionId(null);
      }
    },
    [pushActivity, pushToast]
  );

  const handleRunSystemAction = useCallback(
    (action: SystemActionItem) => {
      if (action.requiresConfirmation) {
        setConfirmAction(action);
        return;
      }

      void executeSystemAction(action);
    },
    [executeSystemAction]
  );

  const handleConfirmSystemAction = useCallback(() => {
    if (!confirmAction) {
      return;
    }

    const pendingAction = confirmAction;
    setConfirmAction(null);
    void executeSystemAction(pendingAction);
  }, [confirmAction, executeSystemAction]);

  const handleToggleAdminMode = useCallback(
    async (enabled: boolean) => {
      try {
        const result = await window.launcherApi.setAdminState(enabled);
        setAdminState(unwrap(result));

        pushToast({
          tone: "info",
          title: enabled ? "Admin Mode ON" : "Admin Mode OFF",
          message: enabled ? "Extended commands are enabled." : "Extended commands are disabled."
        });
        pushActivity("info", "Admin Mode Changed", enabled ? "Enabled" : "Disabled");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Cannot change admin mode";
        pushToast({
          tone: "error",
          title: "Admin Mode Error",
          message
        });
        pushActivity("error", "Admin Mode Change Failed", message);
      }
    },
    [pushActivity, pushToast]
  );

  const handleRunAdminAction = useCallback(
    async (actionId: AdminActionItem["id"]) => {
      const actionTitle = adminActions.find((item) => item.id === actionId)?.title ?? actionId;

      try {
        setRunningAdminActionId(actionId);

        const result = await window.launcherApi.runAdminAction(actionId);
        unwrap(result);

        if (actionId === "reloadCatalog") {
          await refreshCatalog({ silent: true });
        }

        pushToast({
          tone: "success",
          title: "Admin Action Completed",
          message: actionTitle
        });
        pushActivity("success", "Admin Action Completed", actionTitle);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Admin action failed";
        pushToast({
          tone: "error",
          title: "Admin Action Error",
          message
        });
        pushActivity("error", "Admin Action Failed", `${actionTitle}: ${message}`);
      } finally {
        setRunningAdminActionId(null);
      }
    },
    [adminActions, pushActivity, pushToast, refreshCatalog]
  );

  const handleLaunchFromPalette = useCallback(
    (appId: string) => {
      setIsCommandPaletteOpen(false);
      setCommandQuery("");
      void handleLaunch(appId);
    },
    [handleLaunch]
  );

  const handleLaunchFromDetails = useCallback(
    (appId: string) => {
      setInspectAppId(null);
      void handleLaunch(appId);
    },
    [handleLaunch]
  );

  const installedAppsCount = catalog?.apps.filter((app) => app.installed).length ?? 0;
  const totalAppsCount = catalog?.apps.length ?? 0;
  const categoriesCount = catalog?.categories.length ?? 0;

  return (
    <>
      <BootSplash visible={splashVisible} progress={splashProgress} phase={splashPhase} />

      <main className="oyna-shell" aria-hidden={splashVisible}>
        <div className="oyna-backdrop" aria-hidden="true" />

        <LauncherTopBar
          totalApps={totalAppsCount}
          installedApps={installedAppsCount}
          categoryCount={categoriesCount}
          adminModeEnabled={adminState?.adminModeEnabled ?? false}
          processElevated={adminState?.processElevated ?? false}
          dateLabel={dateLabel}
          timeLabel={timeLabel}
          refreshing={refreshingCatalog}
          onOpenPalette={() => {
            setCommandQuery("");
            setIsCommandPaletteOpen(true);
          }}
          onRefreshCatalog={() => {
            void refreshCatalog();
          }}
        />

        <section className="oyna-grid">
          <CatalogPanel
            catalog={catalog}
            search={search}
            selectedCategory={selectedCategory}
            launchingAppId={launchingAppId}
            recentMap={recentMap}
            onSearchChange={setSearch}
            onCategoryChange={setSelectedCategory}
            onLaunch={(appId) => {
              void handleLaunch(appId);
            }}
            onInspectApp={setInspectAppId}
            onOpenPalette={() => {
              setCommandQuery("");
              setIsCommandPaletteOpen(true);
            }}
          />

          <aside className="oyna-side-column">
            <SystemActionsPanel
              actions={systemActions}
              runningActionId={runningSystemActionId}
              onRunAction={handleRunSystemAction}
            />

            <AdminPanel
              adminState={adminState}
              actions={adminActions}
              runningActionId={runningAdminActionId}
              onToggleMode={handleToggleAdminMode}
              onRunAction={(actionId) => {
                void handleRunAdminAction(actionId);
              }}
            />

            <ActivityPanel entries={activity} />
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
          onLaunch={handleLaunchFromDetails}
        />

        <CommandPaletteModal
          open={isCommandPaletteOpen}
          catalog={catalog}
          query={commandQuery}
          launchingAppId={launchingAppId}
          onClose={() => {
            setIsCommandPaletteOpen(false);
            setCommandQuery("");
          }}
          onQueryChange={setCommandQuery}
          onLaunch={handleLaunchFromPalette}
        />
      </main>
    </>
  );
};
