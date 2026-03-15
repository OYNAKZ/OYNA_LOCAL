import { app } from "electron";

import { createAppContext } from "@main/bootstrap/createAppContext";
import { createMainWindow } from "@main/bootstrap/createMainWindow";
import { registerIpcHandlers } from "@main/ipc/registerIpcHandlers";

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) {
  app.quit();
}

let hasBootstrapped = false;

const bootstrap = async (): Promise<void> => {
  if (hasBootstrapped) {
    return;
  }

  hasBootstrapped = true;

  const context = createAppContext();
  registerIpcHandlers(context);

  const mainWindow = createMainWindow({
    preloadPath: context.preloadPath,
    logger: context.logger
  });

  app.on("second-instance", () => {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.focus();
  });

  app.on("activate", () => {
    if (mainWindow.isDestroyed()) {
      createMainWindow({
        preloadPath: context.preloadPath,
        logger: context.logger
      });
    }
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
};

app.whenReady().then(() => {
  bootstrap().catch((error: unknown) => {
    console.error("Launcher bootstrap failed", error);
    app.quit();
  });
});
