import type { LauncherApi } from "@shared/ipc/api";
import type { CatalogSnapshot } from "@shared/schemas/catalog";
import type { Result } from "@shared/schemas/common";
import type { AdminActionItem, AdminState, SystemActionItem } from "@shared/schemas/actions";

const ok = <T,>(data: T): Promise<Result<T>> => Promise.resolve({ ok: true, data });

const now = () => new Date().toISOString();

const catalog: CatalogSnapshot = {
  version: "mock-1.0.0",
  categories: [
    { id: "gaming", title: "Gaming", order: 1 },
    { id: "communication", title: "Communication", order: 2 },
    { id: "media", title: "Media", order: 3 },
    { id: "tools", title: "Tools", order: 4 }
  ],
  apps: [
    ["steam", "Steam", "PC game launcher and library", "gaming", ["games", "store"]],
    ["discord", "Discord", "Voice and text communication", "communication", ["voice", "chat"]],
    ["epic-games", "Epic Games", "Epic game launcher and store", "gaming", ["games", "store"]],
    ["riot-client", "Riot Client", "Riot Games launcher", "gaming", ["valorant", "league"]],
    ["valorant", "VALORANT", "Tactical shooter", "gaming", ["fps", "riot"]],
    ["counter-strike-2", "Counter-Strike 2", "Competitive FPS", "gaming", ["fps", "steam"]],
    ["dota-2", "Dota 2", "MOBA", "gaming", ["moba", "steam"]],
    ["league-of-legends", "League of Legends", "MOBA", "gaming", ["moba", "riot"]],
    ["fortnite", "Fortnite", "Battle royale", "gaming", ["battle royale", "epic"]],
    ["minecraft", "Minecraft", "Sandbox game", "gaming", ["sandbox"]],
    ["roblox", "Roblox", "Game platform", "gaming", ["casual"]],
    ["pubg", "PUBG", "Battle royale", "gaming", ["shooter"]],
    ["telegram", "Telegram", "Messenger", "communication", ["chat"]],
    ["teamspeak", "TeamSpeak", "Voice communication", "communication", ["voice"]],
    ["spotify", "Spotify", "Music streaming", "media", ["music"]],
    ["youtube", "YouTube", "Video platform", "media", ["video"]],
    ["twitch", "Twitch", "Live streaming", "media", ["stream"]],
    ["obs-studio", "OBS Studio", "Streaming and recording", "media", ["recording"]],
    ["chrome", "Google Chrome", "Web browser", "tools", ["browser"]],
    ["opera-gx", "Opera GX", "Gaming browser", "tools", ["browser"]]
  ].map(([id, title, description, categoryId, tags]) => ({
    id: id as string,
    title: title as string,
    description: description as string,
    categoryId: categoryId as string,
    icon: id as string,
    tags: tags as string[],
    requiresAdmin: false,
    installed: true
  })),
  recent: []
};

const systemActions: SystemActionItem[] = [
  {
    id: "lockWorkstation",
    title: "Lock Station",
    description: "Mock lock command",
    requiresConfirmation: false
  },
  {
    id: "restart",
    title: "Restart",
    description: "Mock restart command",
    requiresConfirmation: true
  }
];

const adminState: AdminState = {
  adminModeEnabled: false,
  processElevated: false
};

export const createMockLauncherApi = (): LauncherApi => ({
  getCatalog: () => ok(catalog),
  refreshCatalog: () => ok(catalog),
  launchApp: () => ok({ launchedAt: now() }),
  getSystemActions: () => ok(systemActions),
  runSystemAction: () => ok({ completedAt: now() }),
  getAdminActions: () => ok([] as AdminActionItem[]),
  runAdminAction: () => ok({ completedAt: now() }),
  getAdminState: () => ok(adminState),
  setAdminState: () => ok(adminState),
  authLogin: (_email, _password) =>
    ok({ id: 1, full_name: "Mock User", email: _email, phone: null, role: "club_admin", is_active: true, club_id: null }),
  authLogout: () => ok({ ok: true as const }),
  authMe: () =>
    ok({ id: 1, full_name: "Mock User", email: "mock@oyna.kz", phone: null, role: "club_admin", is_active: true, club_id: null }),
  authGetSeatSession: () => ok({ reservation: null, session: null, reservationUser: null }),
  authStartSession: (_reservationId) =>
    ok({ id: 1, reservation_id: _reservationId, seat_id: 1, user_id: 1, started_at: now(), planned_end_at: now(), ended_at: null, status: "active" }),
  authEndSession: (_sessionId) =>
    ok({ id: _sessionId, reservation_id: 1, seat_id: 1, user_id: 1, started_at: now(), planned_end_at: now(), ended_at: now(), status: "completed" })
});
