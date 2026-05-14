import { z } from "zod";

export const reopenSubmissionSchema = z.object({
  submissionId: z.string().uuid("Submission ID tidak valid"),
  reason: z
    .string()
    .trim()
    .min(5, "Alasan reopen minimal 5 karakter")
    .max(500, "Alasan reopen maksimal 500 karakter"),
});

export type ReopenSubmissionInput = z.infer<typeof reopenSubmissionSchema>;
