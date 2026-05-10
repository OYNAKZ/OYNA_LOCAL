import { join } from "node:path";

import { app } from "electron";

import { CatalogConfigService } from "@main/services/config/catalogConfigService";
import { CatalogQueryService } from "@main/services/config/catalogQueryService";
import { HubAgentService } from "@main/services/hub/hubAgentService";
import { createLoggerService } from "@main/services/logging/logger";
import { InstalledStateService } from "@main/services/launcher/installedStateService";
import { LaunchApplicationService } from "@main/services/launcher/launchApplicationService";
import { ProcessLauncherService } from "@main/services/launcher/processLauncherService";
import { BackendClient } from "@main/services/backend/backendClient";
import { AuthSessionService } from "@main/services/backend/authSessionService";
import { ElectronStoreLauncherStorage } from "@main/services/storage/electronStoreStorage";
import { LauncherStateService } from "@main/services/storage/launcherStateService";
import { AdminActionsService } from "@main/services/system/adminActionsService";
import { AdminModeService } from "@main/services/system/adminModeService";
import { SystemActionsService } from "@main/services/system/systemActionsService";

export interface AppContext {
  preloadPath: string;
  logger: ReturnType<typeof createLoggerService>["logger"];
  services: {
    catalogQueryService: CatalogQueryService;
    launchApplicationService: LaunchApplicationService;
    systemActionsService: SystemActionsService;
    adminActionsService: AdminActionsService;
    adminModeService: AdminModeService;
    hubAgentService: HubAgentService;
    authSessionService: AuthSessionService;
  };
}

export const createAppContext = (): AppContext => {
  const { logger, logsDirectory } = createLoggerService();
  const storage = new ElectronStoreLauncherStorage();
  const stateService = new LauncherStateService(storage);
  const catalogConfigService = new CatalogConfigService(logger);
  const installedStateService = new InstalledStateService();
  const processLauncherService = new ProcessLauncherService(logger);
  const catalogQueryService = new CatalogQueryService(
    catalogConfigService,
    installedStateService,
    stateService
  );
  const launchApplicationService = new LaunchApplicationService(
    catalogConfigService,
    installedStateService,
    processLauncherService,
    stateService
  );
  const backendClient = new BackendClient();
  const authSessionService = new AuthSessionService(backendClient, {
    get: (key) => storage.kvGet(key),
    set: (key, value) => storage.kvSet(key, value),
    delete: (key) => storage.kvDelete(key)
  });
  const systemActionsService = new SystemActionsService(logger);
  const adminModeService = new AdminModeService(stateService);
  const adminActionsService = new AdminActionsService(
    adminModeService,
    catalogConfigService,
    catalogQueryService,
    logsDirectory,
    logger
  );
  const hubAgentService = new HubAgentService({
    logger,
    catalogQueryService,
    launchApplicationService,
    systemActionsService,
    adminActionsService,
    adminModeService
  });

  return {
    preloadPath: join(__dirname, "../preload/index.mjs"),
    logger,
    services: {
      catalogQueryService,
      launchApplicationService,
      systemActionsService,
      adminActionsService,
      adminModeService,
      hubAgentService,
      authSessionService
    }
  };
};

export const isDevelopment = !app.isPackaged;
