import type { AdminActionItem, AdminState, SystemActionItem } from "@shared/schemas/actions";
import type { CatalogSnapshot } from "@shared/schemas/catalog";
import type { Result } from "@shared/schemas/common";
import type { SeatSessionSnapshot, SessionInfo, UserInfo } from "@shared/schemas/auth";

export interface LauncherApi {
  getCatalog(): Promise<Result<CatalogSnapshot>>;
  refreshCatalog(): Promise<Result<CatalogSnapshot>>;
  launchApp(appId: string): Promise<Result<{ launchedAt: string }>>;
  getSystemActions(): Promise<Result<SystemActionItem[]>>;
  runSystemAction(actionId: SystemActionItem["id"]): Promise<Result<{ completedAt: string }>>;
  getAdminActions(): Promise<Result<AdminActionItem[]>>;
  runAdminAction(actionId: AdminActionItem["id"]): Promise<Result<{ completedAt: string }>>;
  getAdminState(): Promise<Result<AdminState>>;
  setAdminState(adminModeEnabled: boolean): Promise<Result<AdminState>>;
  authLogin(email: string, password: string): Promise<Result<UserInfo>>;
  authLogout(): Promise<Result<{ ok: true }>>;
  authMe(): Promise<Result<UserInfo>>;
  authGetSeatSession(): Promise<Result<SeatSessionSnapshot>>;
  authStartSession(reservationId: number): Promise<Result<SessionInfo>>;
  authEndSession(sessionId: number): Promise<Result<SessionInfo>>;
}
