import { z } from "zod";

export const gradeSubmissionSchema = z.object({
  submissionId: z.string().uuid("Submission ID tidak valid"),
  score: z.coerce
    .number({ error: "Score wajib diisi" })
    .min(0, "Score minimal 0")
    .max(100, "Score maksimal 100"),
  feedback: z
    .string()
    .trim()
    .max(2000, "Feedback maksimal 2000 karakter")
    .optional(),
});

export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
