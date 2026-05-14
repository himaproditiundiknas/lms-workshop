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

export const workshopFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Judul workshop minimal 3 karakter")
    .max(120, "Judul workshop maksimal 120 karakter"),
  slug: z.string().trim().max(140, "Slug maksimal 140 karakter").optional(),
  description: z
    .string()
    .trim()
    .max(500, "Deskripsi maksimal 500 karakter")
    .optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"], {
    error: "Status workshop tidak valid",
  }),
});

export const cohortFormSchema = z
  .object({
    workshopId: z.string().uuid("Workshop wajib dipilih"),
    name: z
      .string()
      .trim()
      .min(3, "Nama cohort minimal 3 karakter")
      .max(120, "Nama cohort maksimal 120 karakter"),
    slug: z.string().trim().max(140, "Slug maksimal 140 karakter").optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "CLOSED"], {
      error: "Status cohort tidak valid",
    }),
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
      message: "Tanggal selesai harus setelah tanggal mulai",
    },
  );

export type WorkshopFormInput = z.infer<typeof workshopFormSchema>;
export type CohortFormInput = z.infer<typeof cohortFormSchema>;
