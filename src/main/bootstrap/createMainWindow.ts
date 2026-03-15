import { join } from "node:path";

import { BrowserWindow, shell } from "electron";

import type { Logger } from "@main/services/logging/logger";

export interface MainWindowOptions {
  preloadPath: string;
  logger: Logger;
}

export const createMainWindow = ({ preloadPath, logger }: MainWindowOptions): BrowserWindow => {
  const mainWindow = new BrowserWindow({
    show: false,
    frame: false,
    fullscreen: true,
    autoHideMenuBar: true,
    backgroundColor: "#0b1018",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: !process.env.ELECTRON_RENDERER_URL ? false : true
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL).catch((error: unknown) => {
      logger.error("Failed to load renderer URL", { error });
    });
  } else {
    mainWindow
      .loadFile(join(__dirname, "../renderer/index.html"))
      .catch((error: unknown) => logger.error("Failed to load renderer file", { error }));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  return mainWindow;
};
