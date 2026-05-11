import { z } from "zod";

const phoneRegex = /^\+?[0-9\s-]{10,20}$/;

export const completeProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Nama lengkap minimal 3 karakter")
    .max(100, "Nama lengkap maksimal 100 karakter"),
  nim: z
    .string()
    .trim()
    .min(5, "NIM minimal 5 karakter")
    .max(30, "NIM maksimal 30 karakter")
    .regex(
      /^[A-Za-z0-9.-]+$/,
      "NIM hanya boleh berisi huruf, angka, titik, atau strip",
    ),
  programStudy: z
    .string()
    .trim()
    .min(2, "Program studi wajib diisi")
    .max(100, "Program studi maksimal 100 karakter"),
  semester: z.coerce
    .number({
      error: "Semester wajib diisi",
    })
    .int("Semester harus berupa angka bulat")
    .min(1, "Semester minimal 1")
    .max(14, "Semester maksimal 14"),
  phone: z.string().trim().regex(phoneRegex, "Nomor WhatsApp tidak valid"),
});

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
