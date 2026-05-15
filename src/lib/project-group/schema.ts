import { z } from "zod";

const optionalUuid = (message: string) =>
  z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .pipe(z.string().uuid(message).optional());

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .pipe(z.url("URL tidak valid").optional());

export const projectGroupFormSchema = z.object({
  cohortId: z.string().uuid("Cohort wajib dipilih"),
  mentorId: optionalUuid("Mentor ID tidak valid"),
  name: z
    .string()
    .trim()
    .min(3, "Nama group minimal 3 karakter")
    .max(120, "Nama group maksimal 120 karakter"),
  slug: z.string().trim().max(140, "Slug maksimal 140 karakter").optional(),
  title: z
    .string()
    .trim()
    .max(160, "Judul project maksimal 160 karakter")
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, "Deskripsi maksimal 1000 karakter")
    .optional(),
  repositoryUrl: optionalUrl,
  deploymentUrl: optionalUrl,
  status: z.enum(["ACTIVE", "LOCKED", "ARCHIVED"], {
    error: "Status group tidak valid",
  }),
});

export const projectGroupMemberFormSchema = z.object({
  projectGroupId: z.string().uuid("Project group wajib dipilih"),
  userId: z.string().uuid("Peserta wajib dipilih"),
  role: z.enum(["LEADER", "MEMBER"], {
    error: "Role member tidak valid",
  }),
});

export const projectGroupIdSchema = z.object({
  projectGroupId: z.string().uuid("Project group ID tidak valid"),
});

export const projectGroupMemberIdSchema = z.object({
  memberId: z.string().uuid("Member ID tidak valid"),
});

export type ProjectGroupFormInput = z.infer<typeof projectGroupFormSchema>;
export type ProjectGroupMemberFormInput = z.infer<
  typeof projectGroupMemberFormSchema
>;
