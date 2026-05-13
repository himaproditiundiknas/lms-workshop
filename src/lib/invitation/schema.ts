import { z } from "zod";

export const createInvitationCodeSchema = z.object({
  scope: z.enum(["WORKSHOP", "COHORT"], {
    error: "Scope wajib dipilih",
  }),
  targetId: z.string().uuid("Target ID harus berupa UUID"),
  maxUses: z.coerce
    .number({
      error: "Max uses wajib diisi",
    })
    .int("Max uses harus angka bulat")
    .min(1, "Max uses minimal 1")
    .max(1000, "Max uses maksimal 1000"),
  expiresAt: z
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
    }),
});

export type CreateInvitationCodeInput = z.infer<
  typeof createInvitationCodeSchema
>;
