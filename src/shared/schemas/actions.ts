import { z } from "zod";

export const systemActionSchema = z.enum([
  "openTaskManager",
  "lockWorkstation",
  "signOut",
  "restart",
  "shutdown",
  "sleep"
]);

export const adminActionSchema = z.enum([
  "reloadCatalog",
  "openConfigFolder",
  "openLogsFolder"
]);

export const systemActionItemSchema = z.object({
  id: systemActionSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  requiresConfirmation: z.boolean()
});

export const adminActionItemSchema = z.object({
  id: adminActionSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  requiresAdminMode: z.boolean()
});

export const adminStateSchema = z.object({
  adminModeEnabled: z.boolean(),
  processElevated: z.boolean()
});

export type SystemAction = z.infer<typeof systemActionSchema>;
export type AdminAction = z.infer<typeof adminActionSchema>;
export type SystemActionItem = z.infer<typeof systemActionItemSchema>;
export type AdminActionItem = z.infer<typeof adminActionItemSchema>;
export type AdminState = z.infer<typeof adminStateSchema>;
