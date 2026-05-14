import { z } from "zod";

const optionalDateTime = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  });

export const assignmentFormSchema = z.object({
  workshopId: z.string().uuid("Workshop wajib dipilih"),
  sessionId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .pipe(z.string().uuid("Session ID tidak valid").optional()),
  title: z
    .string()
    .trim()
    .min(3, "Judul tugas minimal 3 karakter")
    .max(140, "Judul tugas maksimal 140 karakter"),
  slug: z.string().trim().max(160, "Slug maksimal 160 karakter").optional(),
  description: z
    .string()
    .trim()
    .max(2000, "Deskripsi maksimal 2000 karakter")
    .optional(),
  category: z.enum(["REGULAR", "FINAL_PROJECT"], {
    error: "Kategori assignment tidak valid",
  }),
  dueAt: optionalDateTime,
  maxScore: z.coerce
    .number({ error: "Max score wajib diisi" })
    .int("Max score harus angka bulat")
    .min(1, "Max score minimal 1")
    .max(1000, "Max score maksimal 1000"),
  allowLate: z
    .string()
    .optional()
    .transform((value) => value === "on"),
  requiredForCertificate: z
    .string()
    .optional()
    .transform((value) => value === "on"),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"], {
    error: "Status assignment tidak valid",
  }),
});

export const assignmentStatusSchema = z.object({
  assignmentId: z.string().uuid("Assignment ID tidak valid"),
});

export type AssignmentFormInput = z.infer<typeof assignmentFormSchema>;
