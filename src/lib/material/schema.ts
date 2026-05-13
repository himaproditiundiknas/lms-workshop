import { z } from "zod";

export const moduleFormSchema = z.object({
  workshopId: z.string().uuid("Workshop wajib dipilih"),
  title: z
    .string()
    .trim()
    .min(3, "Judul module minimal 3 karakter")
    .max(120, "Judul module maksimal 120 karakter"),
  slug: z.string().trim().max(140, "Slug maksimal 140 karakter").optional(),
  description: z
    .string()
    .trim()
    .max(500, "Deskripsi maksimal 500 karakter")
    .optional(),
  orderNo: z.coerce
    .number({ error: "Urutan wajib diisi" })
    .int("Urutan harus angka bulat")
    .min(1, "Urutan minimal 1")
    .max(999, "Urutan maksimal 999"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"], {
    error: "Status module tidak valid",
  }),
});

export const materialFormSchema = z
  .object({
    moduleId: z.string().uuid("Module wajib dipilih"),
    sessionId: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined))
      .pipe(z.string().uuid("Session ID tidak valid").optional()),
    title: z
      .string()
      .trim()
      .min(3, "Judul material minimal 3 karakter")
      .max(120, "Judul material maksimal 120 karakter"),
    description: z
      .string()
      .trim()
      .max(500, "Deskripsi maksimal 500 karakter")
      .optional(),
    type: z.enum(["TEXT", "LINK"], {
      error: "Tipe material tidak valid",
    }),
    orderNo: z.coerce
      .number({ error: "Urutan wajib diisi" })
      .int("Urutan harus angka bulat")
      .min(1, "Urutan minimal 1")
      .max(999, "Urutan maksimal 999"),
    content: z.string().trim().optional(),
    url: z.string().trim().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"], {
      error: "Status material tidak valid",
    }),
  })
  .superRefine((data, ctx) => {
    if (data.type === "TEXT" && !data.content) {
      ctx.addIssue({
        code: "custom",
        path: ["content"],
        message: "Konten wajib diisi untuk text material",
      });
    }

    if (data.type === "LINK") {
      if (!data.url) {
        ctx.addIssue({
          code: "custom",
          path: ["url"],
          message: "URL wajib diisi untuk link material",
        });

        return;
      }

      const parsedUrl = z.url().safeParse(data.url);

      if (!parsedUrl.success) {
        ctx.addIssue({
          code: "custom",
          path: ["url"],
          message: "URL tidak valid",
        });
      }
    }
  });

export const materialStatusSchema = z.object({
  materialId: z.string().uuid("Material ID tidak valid"),
});

export type ModuleFormInput = z.infer<typeof moduleFormSchema>;
export type MaterialFormInput = z.infer<typeof materialFormSchema>;
