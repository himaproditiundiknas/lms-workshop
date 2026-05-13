import { z } from "zod";

export const approveEnrollmentSchema = z.object({
  enrollmentId: z.string().uuid("Enrollment ID tidak valid"),
  cohortId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .pipe(z.string().uuid("Cohort ID harus berupa UUID").optional()),
});

export const rejectEnrollmentSchema = z.object({
  enrollmentId: z.string().uuid("Enrollment ID tidak valid"),
  rejectionReason: z
    .string()
    .trim()
    .max(255, "Alasan reject maksimal 255 karakter")
    .optional(),
});
