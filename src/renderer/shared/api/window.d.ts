import type { LauncherApi } from "@shared/ipc/api";

declare global {
  interface Window {
    launcherApi: LauncherApi;
  }
}

export {};
