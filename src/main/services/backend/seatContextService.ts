import { BackendClient } from "./backendClient";

export interface SeatContextSnapshot {
  summary?: {
    club_id: number;
    active_sessions: number;
    active_reservations: number;
  };
}

export class SeatContextService {
  constructor(private readonly backendClient: BackendClient = new BackendClient()) {}

  async getSummarySnapshot(token: string): Promise<SeatContextSnapshot> {
    const summary = await this.backendClient.request<SeatContextSnapshot["summary"]>("/operations/summary", {
      token,
    });
    return summary ? { summary } : {};
  }

  getBaseUrl(): string {
    return this.backendClient.getBaseUrl();
  }
}
