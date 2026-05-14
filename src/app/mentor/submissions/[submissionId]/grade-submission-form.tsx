"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { gradeSubmissionAction, type GradeSubmissionState } from "./actions";

type GradeSubmissionFormProps = {
  submissionId: string;
  currentScore: number | null;
  currentFeedback: string | null;
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return <p className="mt-1 text-sm text-red-600">{messages[0]}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Menyimpan..." : "Simpan Grade"}
    </button>
  );
}

export function GradeSubmissionForm({
  submissionId,
  currentScore,
  currentFeedback,
}: GradeSubmissionFormProps) {
  const initialState: GradeSubmissionState = {};
  const [state, formAction] = useActionState(
    gradeSubmissionAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="submissionId" value={submissionId} />

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

      <div>
        <label
          htmlFor="score"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Score 0-100
        </label>
        <input
          id="score"
          name="score"
          type="number"
          min="0"
          max="100"
          step="0.01"
          defaultValue={currentScore ?? ""}
          placeholder="Contoh: 85"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.score} />
      </div>

      <div>
        <label
          htmlFor="feedback"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Feedback
        </label>
        <textarea
          id="feedback"
          name="feedback"
          rows={6}
          defaultValue={currentFeedback ?? ""}
          placeholder="Tulis feedback untuk peserta."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.feedback} />
      </div>

      <SubmitButton />
    </form>
  );
}
