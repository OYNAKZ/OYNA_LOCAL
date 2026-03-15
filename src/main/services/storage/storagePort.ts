import type { RecentLaunch } from "@shared/schemas/catalog";

export interface LauncherStorage {
  getRecentLaunches(): RecentLaunch[];
  setRecentLaunches(value: RecentLaunch[]): void;
  getAdminModeEnabled(): boolean;
  setAdminModeEnabled(value: boolean): void;
}
