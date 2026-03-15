import type { CatalogSnapshot, LauncherApp } from "@shared/schemas/catalog";

import type { CatalogConfigService } from "@main/services/config/catalogConfigService";
import type { InstalledStateService } from "@main/services/launcher/installedStateService";
import type { LauncherStateService } from "@main/services/storage/launcherStateService";

export class CatalogQueryService {
  public constructor(
    private readonly configService: CatalogConfigService,
    private readonly installedStateService: InstalledStateService,
    private readonly stateService: LauncherStateService
  ) {}

  public async getSnapshot(): Promise<CatalogSnapshot> {
    const catalog = await this.configService.getCatalog();

    const apps: LauncherApp[] = [];

    for (const appConfig of catalog.apps) {
      const installed = await this.installedStateService.detect(appConfig);

      apps.push({
        id: appConfig.id,
        title: appConfig.title,
        description: appConfig.description,
        categoryId: appConfig.categoryId,
        icon: appConfig.icon,
        tags: appConfig.tags,
        requiresAdmin: appConfig.requiresAdmin,
        installed
      });
    }

    const categories = [...catalog.categories].sort((a, b) => a.order - b.order);

    return {
      version: catalog.version,
      categories,
      apps,
      recent: this.stateService.getRecentLaunches()
    };
  }

  public async refreshSnapshot(): Promise<CatalogSnapshot> {
    await this.configService.refreshCatalog();
    return this.getSnapshot();
  }
}
