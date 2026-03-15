import { z } from "zod";

import {
  adminActionItemSchema,
  adminActionSchema,
  adminStateSchema,
  systemActionItemSchema,
  systemActionSchema
} from "@shared/schemas/actions";
import { catalogSnapshotSchema } from "@shared/schemas/catalog";
import { resultSchema } from "@shared/schemas/common";

export const launchAppRequestSchema = z.object({
  appId: z.string().min(1)
});

export const runSystemActionRequestSchema = z.object({
  actionId: systemActionSchema
});

export const runAdminActionRequestSchema = z.object({
  actionId: adminActionSchema
});

export const setAdminStateRequestSchema = z.object({
  adminModeEnabled: z.boolean()
});

export const catalogResponseSchema = resultSchema(catalogSnapshotSchema);
export const systemActionsResponseSchema = resultSchema(z.array(systemActionItemSchema));
export const adminActionsResponseSchema = resultSchema(z.array(adminActionItemSchema));
export const adminStateResponseSchema = resultSchema(adminStateSchema);
export const launchResponseSchema = resultSchema(
  z.object({
    launchedAt: z.string().datetime({ offset: true })
  })
);
export const actionResponseSchema = resultSchema(
  z.object({
    completedAt: z.string().datetime({ offset: true })
  })
);

export type LaunchAppRequest = z.infer<typeof launchAppRequestSchema>;
export type RunSystemActionRequest = z.infer<typeof runSystemActionRequestSchema>;
export type RunAdminActionRequest = z.infer<typeof runAdminActionRequestSchema>;
export type SetAdminStateRequest = z.infer<typeof setAdminStateRequestSchema>;
