import { z } from "zod";

export const userInfoSchema = z.object({
  id: z.number(),
  full_name: z.string().nullable(),
  email: z.string(),
  phone: z.string().nullable(),
  role: z.string(),
  is_active: z.boolean(),
  club_id: z.number().nullable()
});

export const reservationInfoSchema = z.object({
  id: z.number(),
  seat_id: z.number(),
  user_id: z.number(),
  start_at: z.string(),
  end_at: z.string(),
  status: z.string()
});

export const sessionInfoSchema = z.object({
  id: z.number(),
  reservation_id: z.number(),
  seat_id: z.number(),
  user_id: z.number(),
  started_at: z.string(),
  planned_end_at: z.string(),
  ended_at: z.string().nullable(),
  status: z.string()
});

export const seatSessionSnapshotSchema = z.object({
  reservation: reservationInfoSchema.nullable(),
  session: sessionInfoSchema.nullable(),
  reservationUser: userInfoSchema.nullable()
});

export type UserInfo = z.infer<typeof userInfoSchema>;
export type ReservationInfo = z.infer<typeof reservationInfoSchema>;
export type SessionInfo = z.infer<typeof sessionInfoSchema>;
export type SeatSessionSnapshot = z.infer<typeof seatSessionSnapshotSchema>;
