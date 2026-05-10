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
import {
  seatSessionSnapshotSchema,
  sessionInfoSchema,
  userInfoSchema
} from "@shared/schemas/auth";

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

export const authLoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const authStartSessionRequestSchema = z.object({
  reservationId: z.number().int().positive()
});

export const authEndSessionRequestSchema = z.object({
  sessionId: z.number().int().positive()
});

export const authMeResponseSchema = resultSchema(userInfoSchema);
export const authLoginResponseSchema = resultSchema(userInfoSchema);
export const authLogoutResponseSchema = resultSchema(z.object({ ok: z.literal(true) }));
export const seatSessionResponseSchema = resultSchema(seatSessionSnapshotSchema);
export const sessionResponseSchema = resultSchema(sessionInfoSchema);

export type LaunchAppRequest = z.infer<typeof launchAppRequestSchema>;
export type RunSystemActionRequest = z.infer<typeof runSystemActionRequestSchema>;
export type RunAdminActionRequest = z.infer<typeof runAdminActionRequestSchema>;
export type SetAdminStateRequest = z.infer<typeof setAdminStateRequestSchema>;
export type AuthLoginRequest = z.infer<typeof authLoginRequestSchema>;
export type AuthStartSessionRequest = z.infer<typeof authStartSessionRequestSchema>;
export type AuthEndSessionRequest = z.infer<typeof authEndSessionRequestSchema>;
