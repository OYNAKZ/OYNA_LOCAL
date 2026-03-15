import { dirname } from "node:path";

import { shell } from "electron";

import { LauncherError } from "@main/domain/models/errors";
import type { CatalogConfigService } from "@main/services/config/catalogConfigService";
import type { CatalogQueryService } from "@main/services/config/catalogQueryService";
import type { Logger } from "@main/services/logging/logger";
import type { AdminAction, AdminActionItem } from "@shared/schemas/actions";

import type { AdminModeService } from "./adminModeService";

const ADMIN_ACTIONS: AdminActionItem[] = [
  {
    id: "reloadCatalog",
    title: "Reload Catalog",
    description: "Reload local apps catalog from disk",
    requiresAdminMode: true
  },
  {
    id: "openConfigFolder",
    title: "Open Config Folder",
    description: "Open folder containing launcher catalog config",
    requiresAdminMode: true
  },
  {
    id: "openLogsFolder",
    title: "Open Logs Folder",
    description: "Open launcher logs directory",
    requiresAdminMode: true
  }
];

export class AdminActionsService {
  public constructor(
    private readonly adminModeService: AdminModeService,
    private readonly catalogService: CatalogConfigService,
    private readonly catalogQueryService: CatalogQueryService,
    private readonly logsDirectory: string,
    private readonly logger: Logger
  ) {}

  public listActions(): AdminActionItem[] {
    return ADMIN_ACTIONS;
  }

  public async runAction(actionId: AdminAction): Promise<{ completedAt: string }> {
    const adminState = this.adminModeService.getState();
    if (!adminState.adminModeEnabled) {
      throw new LauncherError("ADMIN_MODE_REQUIRED", "Enable admin mode before running admin actions");
    }

    switch (actionId) {
      case "reloadCatalog":
        await this.catalogQueryService.refreshSnapshot();
        break;
      case "openConfigFolder": {
        const folder = dirname(this.catalogService.getCatalogPath());
        await shell.openPath(folder);
        break;
      }
      case "openLogsFolder":
        await shell.openPath(this.logsDirectory);
        break;
    }

    this.logger.info("Admin action completed", { actionId });

    return {
      completedAt: new Date().toISOString()
    };
  }
}
