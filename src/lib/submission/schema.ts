import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .pipe(z.url("URL tidak valid").optional());

export const submissionFormSchema = z
  .object({
    assignmentId: z.string().uuid("Assignment ID tidak valid"),
    projectGroupId: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined))
      .pipe(z.string().uuid("Project group ID tidak valid").optional()),
    repositoryUrl: optionalUrl,
    deploymentUrl: optionalUrl,
    pdfUrl: optionalUrl,
    contentText: z
      .string()
      .trim()
      .max(5000, "Catatan submission maksimal 5000 karakter")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (
      !data.repositoryUrl &&
      !data.deploymentUrl &&
      !data.pdfUrl &&
      !data.contentText
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["contentText"],
        message:
          "Isi minimal salah satu: repository URL, deployment URL, PDF URL, atau catatan submission.",
      });
    }
  });

export type SubmissionFormInput = z.infer<typeof submissionFormSchema>;
