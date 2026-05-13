import { z } from "zod";

export const manualAttendanceCorrectionSchema = z.object({
  sessionId: z.string().uuid("Session ID tidak valid"),
  userId: z.string().uuid("User ID tidak valid"),
  status: z.enum(["PRESENT", "ABSENT", "EXCUSED", "CORRECTED"], {
    error: "Status presensi tidak valid",
  }),
  note: z
    .string()
    .trim()
    .min(5, "Alasan koreksi minimal 5 karakter")
    .max(500, "Alasan koreksi maksimal 500 karakter"),
});

export type ManualAttendanceCorrectionInput = z.infer<
  typeof manualAttendanceCorrectionSchema
>;
