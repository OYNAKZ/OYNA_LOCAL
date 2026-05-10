import { randomUUID } from "node:crypto";
import { hostname, networkInterfaces, platform, release } from "node:os";

import { app } from "electron";

import type { CatalogQueryService } from "@main/services/config/catalogQueryService";
import type { LaunchApplicationService } from "@main/services/launcher/launchApplicationService";
import type { Logger } from "@main/services/logging/logger";
import type { AdminActionsService } from "@main/services/system/adminActionsService";
import type { AdminModeService } from "@main/services/system/adminModeService";
import type { SystemActionsService } from "@main/services/system/systemActionsService";
import type { AdminAction, SystemAction } from "@shared/schemas/actions";

interface HubEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

interface HubCommand {
  commandId: string;
  type: string;
  payload: Record<string, unknown>;
}

interface RegisterResponse {
  heartbeatEveryMs?: number;
  pollCommandsEveryMs?: number;
}

interface CommandResult {
  ok: boolean;
  output?: string;
  error?: string;
}

export interface HubAgentServiceOptions {
  hubBaseUrl?: string;
  hubToken?: string;
  agentId?: string;
  pcName?: string;
  heartbeatEveryMs?: number;
  pollCommandsEveryMs?: number;
  requestTimeoutMs?: number;
}

interface HubAgentDependencies {
  logger: Logger;
  catalogQueryService: CatalogQueryService;
  launchApplicationService: LaunchApplicationService;
  systemActionsService: SystemActionsService;
  adminActionsService: AdminActionsService;
  adminModeService: AdminModeService;
}

const DEFAULT_HUB_URL = "http://127.0.0.1:8787";
const DEFAULT_HEARTBEAT_MS = 5_000;
const DEFAULT_POLL_MS = 2_000;
const DEFAULT_TIMEOUT_MS = 8_000;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const asBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }
    if (normalized === "false") {
      return false;
    }
  }

  return null;
};

const normalizeBaseUrl = (raw: string): string => raw.replace(/\/+$/, "");

const resolveLocalIp = (): string | null => {
  const values = Object.values(networkInterfaces());

  for (const group of values) {
    if (!group) {
      continue;
    }

    for (const item of group) {
      if (item.family === "IPv4" && !item.internal) {
        return item.address;
      }
    }
  }

  return null;
};

const resolveAgentId = (value?: string): string => {
  const fromEnv = asString(value);
  if (fromEnv) {
    return fromEnv;
  }

  const base = asString(process.env.COMPUTERNAME) ?? hostname();
  const normalized = base.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  if (normalized.length > 0) {
    return normalized;
  }

  return randomUUID();
};

const resolvePcName = (value?: string): string => asString(value) ?? asString(process.env.COMPUTERNAME) ?? hostname();

export class HubAgentService {
  private readonly logger: Logger;

  private readonly catalogQueryService: CatalogQueryService;

  private readonly launchApplicationService: LaunchApplicationService;

  private readonly systemActionsService: SystemActionsService;

  private readonly adminActionsService: AdminActionsService;

  private readonly adminModeService: AdminModeService;

  private readonly hubBaseUrl: string;

  private readonly hubToken: string | null;

  private readonly requestTimeoutMs: number;

  private readonly agentId: string;

  private readonly pcName: string;

  private heartbeatEveryMs: number;

  private pollCommandsEveryMs: number;

  private heartbeatTimer: NodeJS.Timeout | null = null;

  private pollTimer: NodeJS.Timeout | null = null;

  private reconnectTimer: NodeJS.Timeout | null = null;

  private running = false;

  private registered = false;

  private pollingInFlight = false;

  public constructor(dependencies: HubAgentDependencies, options: HubAgentServiceOptions = {}) {
    this.logger = dependencies.logger;
    this.catalogQueryService = dependencies.catalogQueryService;
    this.launchApplicationService = dependencies.launchApplicationService;
    this.systemActionsService = dependencies.systemActionsService;
    this.adminActionsService = dependencies.adminActionsService;
    this.adminModeService = dependencies.adminModeService;

    this.hubBaseUrl = normalizeBaseUrl(
      asString(options.hubBaseUrl) ?? asString(process.env.OYNA_HUB_URL) ?? DEFAULT_HUB_URL
    );
    this.hubToken = asString(options.hubToken) ?? asString(process.env.OYNA_HUB_TOKEN);
    this.requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_TIMEOUT_MS;

    this.agentId = resolveAgentId(options.agentId ?? process.env.OYNA_AGENT_ID);
    this.pcName = resolvePcName(options.pcName ?? process.env.OYNA_PC_NAME);

    this.heartbeatEveryMs = options.heartbeatEveryMs ?? DEFAULT_HEARTBEAT_MS;
    this.pollCommandsEveryMs = options.pollCommandsEveryMs ?? DEFAULT_POLL_MS;
  }

  public async start(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;
    await this.tryConnect();
  }

  public stop(): void {
    this.running = false;
    this.registered = false;

    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    this.logger.info("Hub agent stopped", {
      agentId: this.agentId
    });
  }

  private async tryConnect(): Promise<void> {
    try {
      await this.register();
      await this.sendHeartbeat();
      this.registered = true;
      this.startLoops();

      this.logger.info("Hub agent started", {
        hubBaseUrl: this.hubBaseUrl,
        agentId: this.agentId,
        pcName: this.pcName,
        heartbeatEveryMs: this.heartbeatEveryMs,
        pollCommandsEveryMs: this.pollCommandsEveryMs
      });
    } catch (error) {
      this.registered = false;
      this.logger.warn("Hub agent connection failed", {
        hubBaseUrl: this.hubBaseUrl,
        agentId: this.agentId,
        error: error instanceof Error ? error.message : String(error)
      });
      this.startReconnectLoop();
    }
  }

  private startReconnectLoop(): void {
    if (!this.running || this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setInterval(() => {
      if (!this.running || this.registered) {
        if (this.reconnectTimer) {
          clearInterval(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        return;
      }

      void this.tryConnect();
    }, this.heartbeatEveryMs);
    this.reconnectTimer.unref();
  }

  private startLoops(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }

    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.heartbeatTimer = setInterval(() => {
      void this.safeHeartbeat();
    }, this.heartbeatEveryMs);
    this.heartbeatTimer.unref();

    this.pollTimer = setInterval(() => {
      void this.safePollCommands();
    }, this.pollCommandsEveryMs);
    this.pollTimer.unref();
  }

  private async safeHeartbeat(): Promise<void> {
    if (!this.running || !this.registered) {
      return;
    }

    try {
      await this.sendHeartbeat();
    } catch (error) {
      this.registered = false;
      this.startReconnectLoop();
      this.logger.warn("Hub heartbeat failed", {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async safePollCommands(): Promise<void> {
    if (!this.running || !this.registered || this.pollingInFlight) {
      return;
    }

    this.pollingInFlight = true;

    try {
      await this.pollCommands();
    } catch (error) {
      this.logger.warn("Hub command polling failed", {
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      this.pollingInFlight = false;
    }
  }

  private async register(): Promise<void> {
    const metrics = this.collectMetrics();

    const data = await this.request<RegisterResponse>("/hub/agents/register", {
      method: "POST",
      body: JSON.stringify({
        agentId: this.agentId,
        pcName: this.pcName,
        localIp: resolveLocalIp(),
        status: "online",
        metadata: {
          appVersion: app.getVersion(),
          platform: platform(),
          release: release(),
          hostname: hostname()
        },
        metrics
      })
    });

    if (typeof data.heartbeatEveryMs === "number" && data.heartbeatEveryMs >= 1_000) {
      this.heartbeatEveryMs = data.heartbeatEveryMs;
    }

    if (typeof data.pollCommandsEveryMs === "number" && data.pollCommandsEveryMs >= 1_000) {
      this.pollCommandsEveryMs = data.pollCommandsEveryMs;
    }
  }

  private async sendHeartbeat(): Promise<void> {
    await this.request<{ serverTime: string }>(`/hub/agents/${encodeURIComponent(this.agentId)}/heartbeat`, {
      method: "POST",
      body: JSON.stringify({
        status: "online",
        metrics: this.collectMetrics()
      })
    });
  }

  private async pollCommands(): Promise<void> {
    const commands = await this.request<HubCommand[]>(
      `/hub/agents/${encodeURIComponent(this.agentId)}/commands/next?limit=8`,
      { method: "GET" }
    );

    if (commands.length === 0) {
      return;
    }

    for (const command of commands) {
      const result = await this.executeCommand(command);

      try {
        await this.reportCommandResult(command.commandId, result);
      } catch (error) {
        this.logger.error("Failed to report command result", {
          commandId: command.commandId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  private async executeCommand(command: HubCommand): Promise<CommandResult> {
    try {
      switch (command.type) {
        case "systemAction": {
          const actionId = asString(command.payload.actionId);
          if (!actionId) {
            throw new Error("systemAction requires payload.actionId");
          }

          const allowed = this.systemActionsService.listActions().some((action) => action.id === actionId);
          if (!allowed) {
            throw new Error(`Unknown system action: ${actionId}`);
          }

          await this.systemActionsService.runAction(actionId as SystemAction);
          return { ok: true, output: `system action completed: ${actionId}` };
        }

        case "adminAction": {
          const actionId = asString(command.payload.actionId);
          if (!actionId) {
            throw new Error("adminAction requires payload.actionId");
          }

          const allowed = this.adminActionsService.listActions().some((action) => action.id === actionId);
          if (!allowed) {
            throw new Error(`Unknown admin action: ${actionId}`);
          }

          await this.adminActionsService.runAction(actionId as AdminAction);
          return { ok: true, output: `admin action completed: ${actionId}` };
        }

        case "launchApp": {
          const appId = asString(command.payload.appId);
          if (!appId) {
            throw new Error("launchApp requires payload.appId");
          }

          const result = await this.launchApplicationService.launchById(appId);
          return { ok: true, output: `app launched at ${result.launchedAt}` };
        }

        case "setAdminMode": {
          const enabled = asBoolean(command.payload.enabled);
          if (enabled === null) {
            throw new Error("setAdminMode requires boolean payload.enabled");
          }

          const result = this.adminModeService.setAdminModeEnabled(enabled);
          return {
            ok: true,
            output: `admin mode set: ${result.adminModeEnabled ? "enabled" : "disabled"}`
          };
        }

        case "refreshCatalog": {
          await this.catalogQueryService.refreshSnapshot();
          return { ok: true, output: "catalog refreshed" };
        }

        case "ping":
          return { ok: true, output: "pong" };

        default:
          throw new Error(`Unsupported command type: ${command.type}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error("Command execution failed", {
        commandId: command.commandId,
        commandType: command.type,
        error: message
      });
      return { ok: false, error: message };
    }
  }

  private async reportCommandResult(commandId: string, result: CommandResult): Promise<void> {
    await this.request(
      `/hub/agents/${encodeURIComponent(this.agentId)}/commands/${encodeURIComponent(commandId)}/result`,
      {
        method: "POST",
        body: JSON.stringify(result)
      }
    );
  }

  private collectMetrics(): Record<string, unknown> {
    const adminState = this.adminModeService.getState();

    return {
      adminModeEnabled: adminState.adminModeEnabled,
      processElevated: adminState.processElevated,
      pid: process.pid,
      uptimeSec: Math.floor(process.uptime())
    };
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const headers = new Headers(init.headers);
      headers.set("Content-Type", "application/json");

      if (this.hubToken) {
        headers.set("X-Hub-Token", this.hubToken);
      }

      const response = await fetch(`${this.hubBaseUrl}${path}`, {
        ...init,
        headers,
        signal: controller.signal
      });

      const text = await response.text();
      let envelope: HubEnvelope<T> | null = null;

      if (text) {
        try {
          envelope = JSON.parse(text) as HubEnvelope<T>;
        } catch {
          envelope = null;
        }
      }

      if (!response.ok) {
        const details = envelope?.error ?? (text || response.statusText);
        throw new Error(`Hub request failed (${response.status}): ${details}`);
      }

      if (!envelope || !envelope.ok || envelope.data === undefined) {
        throw new Error(envelope?.error ?? "Invalid hub response");
      }

      return envelope.data;
    } finally {
      clearTimeout(timeout);
    }
  }
}
