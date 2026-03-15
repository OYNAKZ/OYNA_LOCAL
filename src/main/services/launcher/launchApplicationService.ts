import { LauncherError } from "@main/domain/models/errors";
import type { CatalogConfigService } from "@main/services/config/catalogConfigService";
import type { InstalledStateService } from "@main/services/launcher/installedStateService";
import type { ProcessLauncherService } from "@main/services/launcher/processLauncherService";
import type { LauncherStateService } from "@main/services/storage/launcherStateService";

export class LaunchApplicationService {
  public constructor(
    private readonly configService: CatalogConfigService,
    private readonly installedStateService: InstalledStateService,
    private readonly launcherService: ProcessLauncherService,
    private readonly stateService: LauncherStateService
  ) {}

  public async launchById(appId: string): Promise<{ launchedAt: string }> {
    const catalog = await this.configService.getCatalog();
    const appConfig = catalog.apps.find((app) => app.id === appId);

    if (!appConfig) {
      throw new LauncherError("APP_NOT_FOUND", `App with id \"${appId}\" was not found`);
    }

    const installed = await this.installedStateService.detect(appConfig);
    if (!installed) {
      throw new LauncherError("APP_NOT_INSTALLED", `App \"${appConfig.title}\" is not installed`);
    }

    await this.launcherService.launch(appConfig);

    const launchedAt = new Date().toISOString();
    this.stateService.addRecentLaunch(appConfig.id, launchedAt);

    return { launchedAt };
  }
}
