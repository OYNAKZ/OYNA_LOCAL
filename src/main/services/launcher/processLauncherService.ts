import { spawn } from "node:child_process";

import type { CatalogAppConfig } from "@shared/schemas/catalog";

import { LauncherError } from "@main/domain/models/errors";
import type { Logger } from "@main/services/logging/logger";

import { resolveWorkingDirectory, toAbsolutePath } from "./pathResolver";

export class ProcessLauncherService {
  public constructor(private readonly logger: Logger) {}

  public async launch(appConfig: CatalogAppConfig): Promise<void> {
    if (appConfig.launch.executable.startsWith("oyna://mock/")) {
      this.logger.info("Mock launch completed", {
        appId: appConfig.id,
        target: appConfig.launch.executable
      });
      return;
    }

    const executablePath = toAbsolutePath(appConfig.launch.executable);
    const args = appConfig.launch.args;
    const cwd = resolveWorkingDirectory(executablePath, appConfig.launch.workingDirectory);

    this.logger.info("Launching process", {
      appId: appConfig.id,
      executablePath,
      args,
      cwd,
      useShell: appConfig.launch.useShell
    });

    await new Promise<void>((resolvePromise, rejectPromise) => {
      try {
        const child = spawn(executablePath, args, {
          cwd,
          detached: true,
          stdio: "ignore",
          shell: appConfig.launch.useShell,
          windowsHide: false
        });

        const timer = setTimeout(() => resolvePromise(), 250);

        child.once("spawn", () => {
          clearTimeout(timer);
          resolvePromise();
        });

        child.once("error", (error) => {
          clearTimeout(timer);
          rejectPromise(
            new LauncherError("LAUNCH_FAILED", `Failed to launch app \"${appConfig.title}\"`, {
              cause: error
            })
          );
        });

        child.unref();
      } catch (error) {
        rejectPromise(
          new LauncherError("LAUNCH_FAILED", `Failed to launch app \"${appConfig.title}\"`, {
            cause: error
          })
        );
      }
    });
  }
}
