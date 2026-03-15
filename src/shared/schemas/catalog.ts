import { z } from "zod";

export const catalogCategorySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  order: z.number().int().nonnegative()
});

export const appLaunchTargetSchema = z.object({
  executable: z.string().min(1),
  args: z.array(z.string()).default([]),
  workingDirectory: z.string().min(1).optional(),
  useShell: z.boolean().default(false)
});

export const installDetectionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("pathExists"),
    paths: z.array(z.string().min(1)).min(1)
  })
]);

export const catalogAppConfigSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1).optional(),
  categoryId: z.string().min(1),
  icon: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).default([]),
  requiresAdmin: z.boolean().default(false),
  launch: appLaunchTargetSchema,
  installDetection: installDetectionSchema.optional()
});

export const catalogConfigSchema = z
  .object({
    version: z.string().min(1),
    categories: z.array(catalogCategorySchema).min(1),
    apps: z.array(catalogAppConfigSchema).min(1)
  })
  .superRefine((value, ctx) => {
    const categoryIds = new Set(value.categories.map((category) => category.id));
    const appIds = new Set<string>();

    for (const app of value.apps) {
      if (!categoryIds.has(app.categoryId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `App \"${app.id}\" references unknown categoryId \"${app.categoryId}\"`
        });
      }

      if (appIds.has(app.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `App id \"${app.id}\" is duplicated`
        });
      }

      appIds.add(app.id);
    }
  });

export const launcherAppSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().min(1),
  icon: z.string().optional(),
  tags: z.array(z.string()),
  requiresAdmin: z.boolean(),
  installed: z.boolean()
});

export const recentLaunchSchema = z.object({
  appId: z.string().min(1),
  launchedAt: z.string().datetime({ offset: true })
});

export const catalogSnapshotSchema = z.object({
  version: z.string().min(1),
  categories: z.array(catalogCategorySchema),
  apps: z.array(launcherAppSchema),
  recent: z.array(recentLaunchSchema)
});

export type CatalogConfig = z.infer<typeof catalogConfigSchema>;
export type CatalogCategory = z.infer<typeof catalogCategorySchema>;
export type CatalogAppConfig = z.infer<typeof catalogAppConfigSchema>;
export type LauncherApp = z.infer<typeof launcherAppSchema>;
export type RecentLaunch = z.infer<typeof recentLaunchSchema>;
export type CatalogSnapshot = z.infer<typeof catalogSnapshotSchema>;
export type InstallDetection = z.infer<typeof installDetectionSchema>;

