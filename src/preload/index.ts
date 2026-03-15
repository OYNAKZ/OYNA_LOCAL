import { contextBridge, ipcRenderer } from "electron";
import { ZodType } from "zod";

import type { LauncherApi } from "@shared/ipc/api";
import { IPC_CHANNELS } from "@shared/ipc/channels";
import {
  actionResponseSchema,
  adminActionsResponseSchema,
  adminStateResponseSchema,
  catalogResponseSchema,
  launchResponseSchema,
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
    invoke(IPC_CHANNELS.adminStateSet, adminStateResponseSchema, {
      adminModeEnabled
    })
};

contextBridge.exposeInMainWorld("launcherApi", api);
