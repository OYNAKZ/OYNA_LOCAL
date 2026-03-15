import type { SystemAction, SystemActionItem } from "@shared/schemas/actions";

import type { Logger } from "@main/services/logging/logger";

import { spawnDetachedCommand } from "./commandRunner";

const SYSTEM_ACTIONS: SystemActionItem[] = [
  {
    id: "openTaskManager",
    title: "Task Manager",
    description: "Open Windows Task Manager",
    requiresConfirmation: false
  },
  {
    id: "lockWorkstation",
    title: "Lock",
    description: "Lock current workstation",
    requiresConfirmation: false
  },
  {
    id: "sleep",
    title: "Sleep",
    description: "Put PC into sleep mode",
    requiresConfirmation: true
  },
  {
    id: "signOut",
    title: "Sign out",
    description: "Sign out current user",
    requiresConfirmation: true
  },
  {
    id: "restart",
    title: "Restart",
    description: "Restart Windows immediately",
    requiresConfirmation: true
  },
  {
    id: "shutdown",
    title: "Shutdown",
    description: "Shutdown Windows immediately",
    requiresConfirmation: true
  }
];

export class SystemActionsService {
  public constructor(private readonly logger: Logger) {}

  public listActions(): SystemActionItem[] {
    return SYSTEM_ACTIONS;
  }

  public async runAction(actionId: SystemAction): Promise<{ completedAt: string }> {
    switch (actionId) {
      case "openTaskManager":
        await spawnDetachedCommand(this.logger, "taskmgr.exe", []);
        break;
      case "lockWorkstation":
        await spawnDetachedCommand(this.logger, "rundll32.exe", ["user32.dll,LockWorkStation"]);
        break;
      case "sleep":
        await spawnDetachedCommand(this.logger, "rundll32.exe", ["powrprof.dll,SetSuspendState", "0,1,0"]);
        break;
      case "signOut":
        await spawnDetachedCommand(this.logger, "shutdown.exe", ["/l"]);
        break;
      case "restart":
        await spawnDetachedCommand(this.logger, "shutdown.exe", ["/r", "/t", "0"]);
        break;
      case "shutdown":
        await spawnDetachedCommand(this.logger, "shutdown.exe", ["/s", "/t", "0"]);
        break;
    }

    return {
      completedAt: new Date().toISOString()
    };
  }
}
