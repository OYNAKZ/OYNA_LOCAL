import { useCallback, useEffect, useState } from "react";

import type { AdminActionItem, AdminState, SystemActionItem } from "@shared/schemas/actions";
import type { CatalogSnapshot } from "@shared/schemas/catalog";
import type { Result } from "@shared/schemas/common";
import { AdminPanel } from "@renderer/features/admin/AdminPanel";
import { CatalogPanel } from "@renderer/features/catalog/CatalogPanel";
import { SystemActionsPanel } from "@renderer/features/system/SystemActionsPanel";
//import { StatusBanner } from "@renderer/shared/components/StatusBanner";

const unwrap = <T,>(result: Result<T>): T => {
  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.data;
};

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
  
  const [status, setStatus] = useState<{ tone: "info" | "error"; message: string } | null>(null);

  const loadCatalog = useCallback(async () => {
    const result = await window.launcherApi.getCatalog();
    const nextCatalog = unwrap(result);
    setCatalog(nextCatalog);
  }, []);

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
      setStatus({ tone: "info", message: "Launcher ready" });
    } catch (error) {
      setStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Failed to initialize launcher"
      });
    }
  }, []);

  useEffect(() => {
    loadInitialData().catch(() => {
      return;
    });
  }, [loadInitialData]);

  const handleLaunch = useCallback(
    async (appId: string) => {
      try {
        setLaunchingAppId(appId);
        const launchResult = await window.launcherApi.launchApp(appId);
        unwrap(launchResult);
        await loadCatalog();
        setStatus({ tone: "info", message: "Application launched" });
      } catch (error) {
        setStatus({
          tone: "error",
          message: error instanceof Error ? error.message : "Launch failed"
        });
      } finally {
        setLaunchingAppId(null);
      }
    },
    [loadCatalog]
  );

  const handleRunSystemAction = useCallback(async (action: SystemActionItem) => {
    if (action.requiresConfirmation) {
      const confirmed = window.confirm(`Run system action: ${action.title}?`);
      if (!confirmed) {
        return;
      }
    }

    try {
      setRunningSystemActionId(action.id);
      const result = await window.launcherApi.runSystemAction(action.id);
      unwrap(result);
      setStatus({ tone: "info", message: `System action completed: ${action.title}` });
    } catch (error) {
      setStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "System action failed"
      });
    } finally {
      setRunningSystemActionId(null);
    }
  }, []);

  const handleToggleAdminMode = useCallback(async (enabled: boolean) => {
    try {
      const result = await window.launcherApi.setAdminState(enabled);
      setAdminState(unwrap(result));
      setStatus({
        tone: "info",
        message: enabled ? "Admin mode enabled" : "Admin mode disabled"
      });
    } catch (error) {
      setStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Cannot change admin mode"
      });
    }
  }, []);

  const handleRunAdminAction = useCallback(
    async (actionId: AdminActionItem["id"]) => {
      try {
        setRunningAdminActionId(actionId);
        const result = await window.launcherApi.runAdminAction(actionId);
        unwrap(result);

        if (actionId === "reloadCatalog") {
          const refreshed = await window.launcherApi.refreshCatalog();
          setCatalog(unwrap(refreshed));
        }

        setStatus({ tone: "info", message: `Admin action completed: ${actionId}` });
      } catch (error) {
        setStatus({
          tone: "error",
          message: error instanceof Error ? error.message : "Admin action failed"
        });
      } finally {
        setRunningAdminActionId(null);
      }
    },
    []
  );

  return (
    <main className="launcher-root">
      <header className="launcher-header">
        <div>
          <p className="launcher-kicker">OYNA</p>
        </div>
        <p className="launcher-subtitle">Windows shell foundation with secure Electron architecture</p>
      </header>


      <div className="launcher-layout">
        <CatalogPanel
          catalog={catalog}
          search={search}
          selectedCategory={selectedCategory}
          launchingAppId={launchingAppId}
          onSearchChange={setSearch}
          onCategoryChange={setSelectedCategory}
          onLaunch={handleLaunch}
        />

        <aside className="side-column">
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
            onRunAction={handleRunAdminAction}
          />
        </aside>
      </div>
    </main>
  );
};
