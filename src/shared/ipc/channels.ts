export const IPC_CHANNELS = {
  catalogGet: "catalog:get",
  catalogRefresh: "catalog:refresh",
  launchApp: "launcher:launchApp",
  systemActionsGet: "system:getActions",
  systemActionRun: "system:runAction",
  adminActionsGet: "admin:getActions",
  adminActionRun: "admin:runAction",
  adminStateGet: "admin:getState",
  adminStateSet: "admin:setState",
  authLogin: "auth:login",
  authLogout: "auth:logout",
  authMe: "auth:me",
  authGetSeatSession: "auth:getSeatSession",
  authStartSession: "auth:startSession",
  authEndSession: "auth:endSession"
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
