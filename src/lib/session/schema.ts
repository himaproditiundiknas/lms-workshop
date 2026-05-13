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

export const sessionFormSchema = z
  .object({
    cohortId: z.string().uuid("Cohort wajib dipilih"),
    meetingNo: z.coerce
      .number({
        error: "Meeting number wajib diisi",
      })
      .int("Meeting number harus angka bulat")
      .min(1, "Meeting number minimal 1")
      .max(100, "Meeting number maksimal 100"),
    title: z
      .string()
      .trim()
      .min(3, "Judul sesi minimal 3 karakter")
      .max(120, "Judul sesi maksimal 120 karakter"),
    description: z
      .string()
      .trim()
      .max(1000, "Deskripsi maksimal 1000 karakter")
      .optional(),
    location: z
      .string()
      .trim()
      .max(120, "Lokasi maksimal 120 karakter")
      .optional(),
    startsAt: optionalDateTime,
    endsAt: optionalDateTime,
  })
  .refine(
    (data) => {
      if (!data.startsAt || !data.endsAt) {
        return true;
      }

      return data.endsAt >= data.startsAt;
    },
    {
      path: ["endsAt"],
      message: "Waktu selesai harus setelah waktu mulai",
    },
  );

export type SessionFormInput = z.infer<typeof sessionFormSchema>;
