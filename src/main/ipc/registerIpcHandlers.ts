import { ipcMain } from "electron";
import type { ZodType } from "zod";

import { toAppError } from "@main/domain/models/errors";
import type { AppContext } from "@main/bootstrap/createAppContext";
import { IPC_CHANNELS } from "@shared/ipc/channels";
import {
  actionResponseSchema,
  adminActionsResponseSchema,
  adminStateResponseSchema,
  authEndSessionRequestSchema,
  authLoginRequestSchema,
  authLoginResponseSchema,
  authLogoutResponseSchema,
  authMeResponseSchema,
  authStartSessionRequestSchema,
  catalogResponseSchema,
  launchAppRequestSchema,
  launchResponseSchema,
  runAdminActionRequestSchema,
  runSystemActionRequestSchema,
  seatSessionResponseSchema,
  sessionResponseSchema,
  setAdminStateRequestSchema,
  systemActionsResponseSchema
} from "@shared/ipc/contracts";
import type { Result } from "@shared/schemas/common";

const handle = <TRequest, TResponse>(
  channel: string,
  requestSchema: ZodType<TRequest> | null,
  responseSchema: ZodType<Result<TResponse>>,
  operation: (payload: TRequest) => Promise<TResponse>,
  context: AppContext
): void => {
  ipcMain.handle(channel, async (_event, rawPayload: unknown) => {
    try {
      const payload = requestSchema ? requestSchema.parse(rawPayload) : (undefined as TRequest);
      const data = await operation(payload);
      return responseSchema.parse({ ok: true, data });
    } catch (error) {
      const appError = toAppError(error);
      context.logger.error(`IPC ${channel} failed`, { error: appError });
      return responseSchema.parse({ ok: false, error: appError });
    }
  });
};

export const registerIpcHandlers = (context: AppContext): void => {
  const {
    catalogQueryService,
    launchApplicationService,
    systemActionsService,
    adminActionsService,
    adminModeService,
    authSessionService
  } = context.services;

  handle(
    IPC_CHANNELS.catalogGet,
    null,
    catalogResponseSchema,
    async () => catalogQueryService.getSnapshot(),
    context
  );

  handle(
    IPC_CHANNELS.catalogRefresh,
    null,
    catalogResponseSchema,
    async () => catalogQueryService.refreshSnapshot(),
    context
  );

  handle(
    IPC_CHANNELS.launchApp,
    launchAppRequestSchema,
    launchResponseSchema,
    async (payload) => launchApplicationService.launchById(payload.appId),
    context
  );

  handle(
    IPC_CHANNELS.systemActionsGet,
    null,
    systemActionsResponseSchema,
    async () => systemActionsService.listActions(),
    context
  );

  handle(
    IPC_CHANNELS.systemActionRun,
    runSystemActionRequestSchema,
    actionResponseSchema,
    async (payload) => systemActionsService.runAction(payload.actionId),
    context
  );

  handle(
    IPC_CHANNELS.adminActionsGet,
    null,
    adminActionsResponseSchema,
    async () => adminActionsService.listActions(),
    context
  );

  handle(
    IPC_CHANNELS.adminActionRun,
    runAdminActionRequestSchema,
    actionResponseSchema,
    async (payload) => adminActionsService.runAction(payload.actionId),
    context
  );

  handle(
    IPC_CHANNELS.adminStateGet,
    null,
    adminStateResponseSchema,
    async () => adminModeService.getState(),
    context
  );

  handle(
    IPC_CHANNELS.adminStateSet,
    setAdminStateRequestSchema,
    adminStateResponseSchema,
    async (payload) => adminModeService.setAdminModeEnabled(payload.adminModeEnabled),
    context
  );

  handle(
    IPC_CHANNELS.authLogin,
    authLoginRequestSchema,
    authLoginResponseSchema,
    async (payload) => authSessionService.login(payload.email, payload.password),
    context
  );

  handle(
    IPC_CHANNELS.authLogout,
    null,
    authLogoutResponseSchema,
    async () => {
      authSessionService.logout();
      return { ok: true as const };
    },
    context
  );

  handle(
    IPC_CHANNELS.authMe,
    null,
    authMeResponseSchema,
    async () => authSessionService.getCurrentUser(),
    context
  );

  handle(
    IPC_CHANNELS.authGetSeatSession,
    null,
    seatSessionResponseSchema,
    async () => authSessionService.getSeatSessionSnapshot(),
    context
  );

  handle(
    IPC_CHANNELS.authStartSession,
    authStartSessionRequestSchema,
    sessionResponseSchema,
    async (payload) => authSessionService.startSession(payload.reservationId),
    context
  );

  handle(
    IPC_CHANNELS.authEndSession,
    authEndSessionRequestSchema,
    sessionResponseSchema,
    async (payload) => authSessionService.endSession(payload.sessionId),
    context
  );
};
