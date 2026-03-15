import { execFileSync } from "node:child_process";

import type { LauncherStateService } from "@main/services/storage/launcherStateService";
import { adminStateSchema } from "@shared/schemas/actions";

export class AdminModeService {
  private readonly processElevated: boolean;

  public constructor(private readonly stateService: LauncherStateService) {
    this.processElevated = this.detectElevatedProcess();
  }

  public getState() {
    return adminStateSchema.parse({
      adminModeEnabled: this.stateService.getAdminModeEnabled(),
      processElevated: this.processElevated
    });
  }

  public setAdminModeEnabled(value: boolean) {
    this.stateService.setAdminModeEnabled(value);
    return this.getState();
  }

  private detectElevatedProcess(): boolean {
    if (process.platform !== "win32") {
      return false;
    }

    try {
      const output = execFileSync(
        "powershell.exe",
        [
          "-NoProfile",
          "-NonInteractive",
          "-Command",
          "([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)"
        ],
        { encoding: "utf8" }
      );

      return output.trim().toLowerCase() === "true";
    } catch {
      return false;
    }
  }
}
