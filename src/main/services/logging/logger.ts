import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

import { app } from "electron";

export interface Logger {
  info(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
}

export interface LoggerService {
  logger: Logger;
  logsDirectory: string;
}

const serialize = (value: unknown): string => {
  if (value === undefined || value === "") {
    return "";
  }

  try {
    return ` ${JSON.stringify(value)}`;
  } catch {
    return ` ${String(value)}`;
  }
};

export const createLoggerService = (): LoggerService => {
  const logsDirectory = join(app.getPath("userData"), "logs");
  const logPath = join(logsDirectory, "main.log");
  mkdirSync(logsDirectory, { recursive: true });

  const write = (level: "info" | "warn" | "error", message: string, meta?: unknown): void => {
    appendFileSync(logPath, `[${new Date().toISOString()}] [${level}] ${message}${serialize(meta)}\n`, "utf8");
  };

  return {
    logsDirectory,
    logger: {
      info(message, meta) {
        write("info", message, meta);
      },
      warn(message, meta) {
        write("warn", message, meta);
      },
      error(message, meta) {
        write("error", message, meta);
      }
    }
  };
};
