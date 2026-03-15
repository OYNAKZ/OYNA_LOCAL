import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";

import type { CatalogAppConfig } from "@shared/schemas/catalog";

import { toAbsolutePath } from "./pathResolver";

export class InstalledStateService {
  public async detect(appConfig: CatalogAppConfig): Promise<boolean> {
    if (!appConfig.installDetection) {
      return true;
    }

    if (appConfig.installDetection.type === "pathExists") {
      const candidates = appConfig.installDetection.paths.map((path) => toAbsolutePath(path));

      for (const candidate of candidates) {
        try {
          await access(candidate, fsConstants.F_OK);
          return true;
        } catch {
          continue;
        }
      }

      return false;
    }

    return false;
  }
}
