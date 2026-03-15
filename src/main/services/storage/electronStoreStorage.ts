import Store from "electron-store";
import { z } from "zod";

import { recentLaunchSchema } from "@shared/schemas/catalog";

import type { LauncherStorage } from "./storagePort";

interface PersistedState {
  recentLaunches: unknown;
  adminModeEnabled: unknown;
}

export class ElectronStoreLauncherStorage implements LauncherStorage {
  private readonly store: Store<PersistedState>;

  public constructor() {
    this.store = new Store<PersistedState>({
      name: "launcher-state",
      defaults: {
        recentLaunches: [],
        adminModeEnabled: false
      }
    });
  }

  public getRecentLaunches() {
    const raw = this.store.get("recentLaunches", []);
    const parsed = z.array(recentLaunchSchema).safeParse(raw);
    return parsed.success ? parsed.data : [];
  }

  public setRecentLaunches(value: ReturnType<LauncherStorage["getRecentLaunches"]>): void {
    this.store.set("recentLaunches", value);
  }

  public getAdminModeEnabled(): boolean {
    return this.store.get("adminModeEnabled", false) === true;
  }

  public setAdminModeEnabled(value: boolean): void {
    this.store.set("adminModeEnabled", value);
  }
}
