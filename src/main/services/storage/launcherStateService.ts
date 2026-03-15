import type { RecentLaunch } from "@shared/schemas/catalog";

import type { LauncherStorage } from "./storagePort";

const RECENT_LIMIT = 12;

export class LauncherStateService {
  public constructor(private readonly storage: LauncherStorage) {}

  public getRecentLaunches(): RecentLaunch[] {
    return this.storage.getRecentLaunches();
  }

  public addRecentLaunch(appId: string, launchedAt: string): RecentLaunch[] {
    const next = [
      { appId, launchedAt },
      ...this.storage.getRecentLaunches().filter((entry) => entry.appId !== appId)
    ].slice(0, RECENT_LIMIT);

    this.storage.setRecentLaunches(next);
    return next;
  }

  public getAdminModeEnabled(): boolean {
    return this.storage.getAdminModeEnabled();
  }

  public setAdminModeEnabled(value: boolean): boolean {
    this.storage.setAdminModeEnabled(value);
    return value;
  }
}
