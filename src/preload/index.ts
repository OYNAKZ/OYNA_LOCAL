import { contextBridge, ipcRenderer } from "electron";
import { ZodType } from "zod";

import type { LauncherApi } from "@shared/ipc/api";
import { IPC_CHANNELS } from "@shared/ipc/channels";
import {
  actionResponseSchema,
  adminActionsResponseSchema,
  adminStateResponseSchema,
  authLoginResponseSchema,
  authLogoutResponseSchema,
  authMeResponseSchema,
  catalogResponseSchema,
  launchResponseSchema,
  seatSessionResponseSchema,
  sessionResponseSchema,
  systemActionsResponseSchema
} from "@shared/ipc/contracts";
import type { Result } from "@shared/schemas/common";

const invoke = async <T>(
  channel: string,
  responseSchema: ZodType<Result<T>>,
  payload?: unknown
): Promise<Result<T>> => {
  const raw = await ipcRenderer.invoke(channel, payload);
  return responseSchema.parse(raw);
};

const api: LauncherApi = {
  getCatalog: () => invoke(IPC_CHANNELS.catalogGet, catalogResponseSchema),
  refreshCatalog: () => invoke(IPC_CHANNELS.catalogRefresh, catalogResponseSchema),
  launchApp: (appId) => invoke(IPC_CHANNELS.launchApp, launchResponseSchema, { appId }),
  getSystemActions: () => invoke(IPC_CHANNELS.systemActionsGet, systemActionsResponseSchema),
  runSystemAction: (actionId) =>
    invoke(IPC_CHANNELS.systemActionRun, actionResponseSchema, {
      actionId
    }),
  getAdminActions: () => invoke(IPC_CHANNELS.adminActionsGet, adminActionsResponseSchema),
  runAdminAction: (actionId) =>
    invoke(IPC_CHANNELS.adminActionRun, actionResponseSchema, {
      actionId
    }),
  getAdminState: () => invoke(IPC_CHANNELS.adminStateGet, adminStateResponseSchema),
  setAdminState: (adminModeEnabled) =>
    invoke(IPC_CHANNELS.adminStateSet, adminStateResponseSchema, { adminModeEnabled }),
  authLogin: (email, password) =>
    invoke(IPC_CHANNELS.authLogin, authLoginResponseSchema, { email, password }),
  authLogout: () => invoke(IPC_CHANNELS.authLogout, authLogoutResponseSchema),
  authMe: () => invoke(IPC_CHANNELS.authMe, authMeResponseSchema),
  authGetSeatSession: () => invoke(IPC_CHANNELS.authGetSeatSession, seatSessionResponseSchema),
  authStartSession: (reservationId) =>
    invoke(IPC_CHANNELS.authStartSession, sessionResponseSchema, { reservationId }),
  authEndSession: (sessionId) =>
    invoke(IPC_CHANNELS.authEndSession, sessionResponseSchema, { sessionId })
};

contextBridge.exposeInMainWorld("launcherApi", api);
