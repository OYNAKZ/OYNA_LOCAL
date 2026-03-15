import { spawn } from "node:child_process";

import { LauncherError } from "@main/domain/models/errors";
import type { Logger } from "@main/services/logging/logger";

export const spawnDetachedCommand = async (
  logger: Logger,
  command: string,
  args: string[]
): Promise<void> => {
  logger.info("Running system command", { command, args });

  await new Promise<void>((resolvePromise, rejectPromise) => {
    try {
      const child = spawn(command, args, {
        detached: true,
        stdio: "ignore",
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
          new LauncherError("SYSTEM_ACTION_FAILED", `Failed to execute command: ${command}`, {
            cause: error
          })
        );
      });

      child.unref();
    } catch (error) {
      rejectPromise(
        new LauncherError("SYSTEM_ACTION_FAILED", `Failed to execute command: ${command}`, {
          cause: error
        })
      );
    }
  });
};
