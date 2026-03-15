export type UiTone = "info" | "success" | "warning" | "error";

export interface ToastMessage {
  id: string;
  tone: UiTone;
  title: string;
  message: string;
  createdAt: number;
}

export interface ActivityEntry {
  id: string;
  tone: UiTone;
  title: string;
  details: string;
  createdAt: number;
}
