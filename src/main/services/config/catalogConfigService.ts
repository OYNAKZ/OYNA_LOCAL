import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { app } from "electron";

import { LauncherError } from "@main/domain/models/errors";
import type { Logger } from "@main/services/logging/logger";
import { catalogConfigSchema } from "@shared/schemas/catalog";

import type { CatalogConfig } from "@shared/schemas/catalog";

export class CatalogConfigService {
  private cache: CatalogConfig | null = null;

  public constructor(private readonly logger: Logger) {}

  public getCatalogPath(): string {
    if (process.env.OYNA_CATALOG_PATH) {
      return process.env.OYNA_CATALOG_PATH;
    }

    if (app.isPackaged) {
      return join(process.resourcesPath, "config", "apps.catalog.json");
    }

    return join(process.cwd(), "config", "apps.catalog.json");
  }

  public async getCatalog(): Promise<CatalogConfig> {
    if (this.cache) {
      return this.cache;
    }

    this.cache = await this.loadFromDisk();
    return this.cache;
  }

  public async refreshCatalog(): Promise<CatalogConfig> {
    this.cache = await this.loadFromDisk();
    return this.cache;
  }

  private async loadFromDisk(): Promise<CatalogConfig> {
    const path = this.getCatalogPath();

    this.logger.info("Loading catalog config", { path });

    let content: string;

    try {
      content = await readFile(path, "utf8");
    } catch (error) {
      throw new LauncherError("CATALOG_READ_FAILED", `Cannot read catalog from ${path}`, {
        cause: error
      });
    }

    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(content);
    } catch (error) {
      throw new LauncherError("CATALOG_PARSE_FAILED", `Catalog JSON is invalid: ${path}`, {
        cause: error
      });
    }

    const parsedCatalog = catalogConfigSchema.safeParse(parsedJson);
    if (!parsedCatalog.success) {
      throw new LauncherError(
        "CATALOG_VALIDATION_FAILED",
        parsedCatalog.error.issues.map((issue) => issue.message).join("; "),
        { cause: parsedCatalog.error }
      );
    }

    return parsedCatalog.data;
  }
}
