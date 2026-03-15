import { ZodError } from "zod";

import type { AppError } from "@shared/schemas/common";

export class LauncherError extends Error {
  public readonly code: string;

  public constructor(code: string, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "LauncherError";
    this.code = code;
  }
}

export const toAppError = (error: unknown): AppError => {
  if (error instanceof LauncherError) {
    return {
      code: error.code,
      message: error.message
    };
  }

  if (error instanceof ZodError) {
    return {
      code: "VALIDATION_ERROR",
      message: error.issues.map((issue) => issue.message).join("; ")
    };
  }

  if (error instanceof Error) {
    return {
      code: "UNEXPECTED_ERROR",
      message: error.message
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "Unknown error"
  };
};
