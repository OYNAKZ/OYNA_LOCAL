import { app } from "electron";
import log from "electron-log/main.js";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

export interface Logger {
  info(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
}

export interface LoggerService {
  logger: Logger;
  logsDirectory: string;
}

export const createLoggerService = (): LoggerService => {
  const logsDirectory = join(app.getPath("userData"), "logs");
  mkdirSync(logsDirectory, { recursive: true });

  log.initialize();
  log.transports.file.level = "info";
  log.transports.file.resolvePathFn = () => join(logsDirectory, "main.log");

  return {
    logsDirectory,
    logger: {
      info(message, meta) {
        log.info(message, meta ?? "");
      },
      warn(message, meta) {
        log.warn(message, meta ?? "");
      },
      error(message, meta) {
        log.error(message, meta ?? "");
      }
    }
  };
};

