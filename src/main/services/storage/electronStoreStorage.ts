import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { app } from "electron";
import { z } from "zod";

import { recentLaunchSchema } from "@shared/schemas/catalog";

import type { LauncherStorage } from "./storagePort";

interface PersistedState {
  recentLaunches: unknown;
  adminModeEnabled: unknown;
  kv: Record<string, string>;
}

const defaultState: PersistedState = {
  recentLaunches: [],
  adminModeEnabled: false,
  kv: {}
};

export class ElectronStoreLauncherStorage implements LauncherStorage {
  private readonly filePath: string;

  public constructor() {
    this.filePath = join(app.getPath("userData"), "launcher-state.json");
  }

  public getRecentLaunches() {
    const raw = this.readState().recentLaunches;
    const parsed = z.array(recentLaunchSchema).safeParse(raw);
    return parsed.success ? parsed.data : [];
  }

  public setRecentLaunches(value: ReturnType<LauncherStorage["getRecentLaunches"]>): void {
    this.writeState({ ...this.readState(), recentLaunches: value });
  }

  public getAdminModeEnabled(): boolean {
    return this.readState().adminModeEnabled === true;
  }

  public setAdminModeEnabled(value: boolean): void {
    this.writeState({ ...this.readState(), adminModeEnabled: value });
  }

  public kvGet(key: string): string | undefined {
    return (this.readState().kv ?? {})[key];
  }

  public kvSet(key: string, value: string): void {
    const state = this.readState();
    this.writeState({ ...state, kv: { ...(state.kv ?? {}), [key]: value } });
  }

  public kvDelete(key: string): void {
    const state = this.readState();
    const kv = { ...(state.kv ?? {}) };
    delete kv[key];
    this.writeState({ ...state, kv });
  }

  private readState(): PersistedState {
    if (!existsSync(this.filePath)) {
      return defaultState;
    }

    try {
      return { ...defaultState, ...(JSON.parse(readFileSync(this.filePath, "utf8")) as Partial<PersistedState>) };
    } catch {
      return defaultState;
    }
  }

  private writeState(value: PersistedState): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(value, null, 2), "utf8");
  }
}
