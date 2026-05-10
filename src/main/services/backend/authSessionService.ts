import { BackendClient, BackendClientError } from "./backendClient";
import type {
  ReservationInfo,
  SeatSessionSnapshot,
  SessionInfo,
  UserInfo
} from "@shared/schemas/auth";

interface StorageAdapter {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
}

interface BackendReservation {
  id: number;
  seat_id: number;
  user_id: number;
  start_at: string;
  end_at: string;
  status: string;
}

interface BackendSession {
  id: number;
  reservation_id: number;
  seat_id: number;
  user_id: number;
  started_at: string;
  planned_end_at: string;
  ended_at: string | null;
  status: string;
}

interface BackendReservationOps extends BackendReservation {
  seat: { id: number; code: string; operational_status: string };
}

interface BackendSessionOps extends BackendSession {
  seat: { id: number; code: string; operational_status: string };
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

const TOKEN_KEY = "auth.token";
const SEAT_ID_ENV = process.env.OYNA_SEAT_ID;

export class AuthSessionService {
  private token: string | null = null;

  constructor(
    private readonly client: BackendClient,
    private readonly storage: StorageAdapter
  ) {
    this.token = this.storage.get(TOKEN_KEY) ?? null;
  }

  getSeatId(): number | null {
    const raw = SEAT_ID_ENV;
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return isNaN(n) ? null : n;
  }

  hasToken(): boolean {
    return this.token !== null;
  }

  async login(email: string, password: string): Promise<UserInfo> {
    const resp = await this.client.request<{ access_token: string; token_type: string }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password })
      }
    );
    this.token = resp.access_token;
    this.storage.set(TOKEN_KEY, this.token);
    return this.getCurrentUser();
  }

  logout(): void {
    this.token = null;
    this.storage.delete(TOKEN_KEY);
  }

  async getCurrentUser(): Promise<UserInfo> {
    if (!this.token) throw new Error("Not authenticated");
    return this.client.request<UserInfo>("/users/me", { token: this.token });
  }

  async getSeatSessionSnapshot(): Promise<SeatSessionSnapshot> {
    if (!this.token) throw new Error("Not authenticated");
    const seatId = this.getSeatId();

    let reservation: ReservationInfo | null = null;
    let session: SessionInfo | null = null;
    let reservationUser: UserInfo | null = null;

    if (seatId !== null) {
      try {
        const now = new Date();
        const from = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
        const to = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString();

        const reservationsResp = await this.client.request<PaginatedResponse<BackendReservationOps>>(
          `/operations/reservations?seat_id=${seatId}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&page_size=10`,
          { token: this.token }
        );

        const activeRes = reservationsResp.items.find((r) =>
          ["confirmed", "pending_payment", "checked_in", "session_started"].includes(r.status)
        );

        if (activeRes) {
          reservation = {
            id: activeRes.id,
            seat_id: activeRes.seat_id,
            user_id: activeRes.user_id,
            start_at: activeRes.start_at,
            end_at: activeRes.end_at,
            status: activeRes.status
          };

          try {
            reservationUser = await this.client.request<UserInfo>(
              `/users/${activeRes.user_id}`,
              { token: this.token }
            );
          } catch {
            reservationUser = null;
          }
        }

        const sessionsResp = await this.client.request<PaginatedResponse<BackendSessionOps>>(
          `/operations/sessions?active_only=true&page_size=5`,
          { token: this.token }
        );

        const activeSess = sessionsResp.items.find((s) => s.seat_id === seatId);
        if (activeSess) {
          session = {
            id: activeSess.id,
            reservation_id: activeSess.reservation_id,
            seat_id: activeSess.seat_id,
            user_id: activeSess.user_id,
            started_at: activeSess.started_at,
            planned_end_at: activeSess.planned_end_at,
            ended_at: activeSess.ended_at,
            status: activeSess.status
          };
        }
      } catch (err) {
        if (err instanceof BackendClientError && err.status === 403) {
          // Not enough permissions for operations endpoints; skip
        } else {
          throw err;
        }
      }
    }

    return { reservation, session, reservationUser };
  }

  async startSession(reservationId: number): Promise<SessionInfo> {
    if (!this.token) throw new Error("Not authenticated");
    const resp = await this.client.request<BackendSession>(
      `/operations/reservations/${reservationId}/start-session`,
      { method: "POST", token: this.token }
    );
    return {
      id: resp.id,
      reservation_id: resp.reservation_id,
      seat_id: resp.seat_id,
      user_id: resp.user_id,
      started_at: resp.started_at,
      planned_end_at: resp.planned_end_at,
      ended_at: resp.ended_at,
      status: resp.status
    };
  }

  async endSession(sessionId: number): Promise<SessionInfo> {
    if (!this.token) throw new Error("Not authenticated");
    const resp = await this.client.request<BackendSession>(
      `/operations/sessions/${sessionId}/finish`,
      { method: "PATCH", token: this.token }
    );
    return {
      id: resp.id,
      reservation_id: resp.reservation_id,
      seat_id: resp.seat_id,
      user_id: resp.user_id,
      started_at: resp.started_at,
      planned_end_at: resp.planned_end_at,
      ended_at: resp.ended_at,
      status: resp.status
    };
  }
}
