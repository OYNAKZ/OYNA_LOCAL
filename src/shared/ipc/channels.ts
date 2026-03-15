export const IPC_CHANNELS = {
  catalogGet: "catalog:get",
  catalogRefresh: "catalog:refresh",
  launchApp: "launcher:launchApp",
  systemActionsGet: "system:getActions",
  systemActionRun: "system:runAction",
  adminActionsGet: "admin:getActions",
  adminActionRun: "admin:runAction",
  adminStateGet: "admin:getState",
  adminStateSet: "admin:setState"
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
