"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitAssignmentAction, type SubmissionFormState } from "./actions";

type ProjectGroupOption = {
  id: string;
  name: string;
  title: string | null;
  status: "ACTIVE" | "LOCKED" | "ARCHIVED";
  memberRole: "LEADER" | "MEMBER";
};

type SubmissionFormProps = {
  assignmentId: string;
  isFinalProject: boolean;
  projectGroups: ProjectGroupOption[];
  latestSubmission?: {
    attemptNo: number;
    repositoryUrl: string | null;
    deploymentUrl: string | null;
    contentText: string | null;
  } | null;
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return <p className="mt-1 text-sm text-red-600">{messages[0]}</p>;
}

function SubmitButton({ hasSubmission }: { hasSubmission: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending
        ? "Mengirim..."
        : hasSubmission
          ? "Kirim Resubmission"
          : "Kirim Submission"}
    </button>
  );
}

export function SubmissionForm({
  assignmentId,
  isFinalProject,
  projectGroups,
  latestSubmission,
}: SubmissionFormProps) {
  const initialState: SubmissionFormState = {};
  const [state, formAction] = useActionState(
    submitAssignmentAction,
    initialState,
  );

  const defaultProjectGroupId = projectGroups[0]?.id ?? "";

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="assignmentId" value={assignmentId} />

      {state.message ? (
        <div
          className={
            state.ok
              ? "rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
              : "rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          }
        >
          {state.message}
        </div>
      ) : null}

      {isFinalProject ? (
        <div>
          <label
            htmlFor="projectGroupId"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Project Group
          </label>
          <select
            id="projectGroupId"
            name="projectGroupId"
            defaultValue={defaultProjectGroupId}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
          >
            <option value="">Pilih project group</option>
            {projectGroups.map((projectGroup) => (
              <option key={projectGroup.id} value={projectGroup.id}>
                {projectGroup.name}
                {projectGroup.title ? ` — ${projectGroup.title}` : ""} (
                {projectGroup.memberRole})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Final project disubmit oleh masing-masing anggota dari akun
            masing-masing.
          </p>
          <FieldError messages={state.errors?.projectGroupId} />
        </div>
      ) : null}

      {latestSubmission ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-medium text-slate-950">
            Submission terakhir: attempt #{latestSubmission.attemptNo}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Mengirim form ini akan membuat attempt baru dan menjadikannya
            submission terbaru.
          </p>
        </div>
      ) : null}

      <div>
        <label
          htmlFor="repositoryUrl"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Repository URL
        </label>
        <input
          id="repositoryUrl"
          name="repositoryUrl"
          type="url"
          defaultValue={latestSubmission?.repositoryUrl ?? ""}
          placeholder="https://github.com/username/project"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.repositoryUrl} />
      </div>

      <div>
        <label
          htmlFor="deploymentUrl"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Deployment URL
        </label>
        <input
          id="deploymentUrl"
          name="deploymentUrl"
          type="url"
          defaultValue={latestSubmission?.deploymentUrl ?? ""}
          placeholder="https://project.vercel.app"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.deploymentUrl} />
      </div>

      <div>
        <label
          htmlFor="pdfUrl"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          PDF URL Optional
        </label>
        <input
          id="pdfUrl"
          name="pdfUrl"
          type="url"
          placeholder="https://drive.google.com/file/d/..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <p className="mt-1 text-xs text-slate-500">
          Untuk sementara PDF dikirim sebagai URL. Upload file asli bisa
          ditambahkan nanti saat storage sudah dibuat.
        </p>
        <FieldError messages={state.errors?.pdfUrl} />
      </div>

      <div>
        <label
          htmlFor="contentText"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Catatan Submission
        </label>
        <textarea
          id="contentText"
          name="contentText"
          rows={6}
          defaultValue={latestSubmission?.contentText ?? ""}
          placeholder="Tambahkan catatan, kendala, atau penjelasan submission."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.contentText} />
      </div>

      <SubmitButton hasSubmission={Boolean(latestSubmission)} />
    </form>
  );
}
