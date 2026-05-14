"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { reopenSubmissionAction, type ReopenSubmissionState } from "./actions";

type ReopenSubmissionModalProps = {
  submissionId: string;
  participantName: string;
  assignmentTitle: string;
  disabled?: boolean;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Menyimpan..." : "Reopen Submission"}
    </button>
  );
}

export function ReopenSubmissionModal({
  submissionId,
  participantName,
  assignmentTitle,
  disabled,
}: ReopenSubmissionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const initialState: ReopenSubmissionState = {};
  const [state, formAction] = useActionState(
    reopenSubmissionAction,
    initialState,
  );

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Reopen
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Reopen Submission
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Peserta: {participantName}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Assignment: {assignmentTitle}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-slate-500 transition hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form action={formAction} className="mt-6 space-y-4">
              <input type="hidden" name="submissionId" value={submissionId} />

              {state.message ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  {state.message}
                </div>
              ) : null}

              <div>
                <label
                  htmlFor={`reason-${submissionId}`}
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Alasan Reopen
                </label>
                <textarea
                  id={`reason-${submissionId}`}
                  name="reason"
                  rows={4}
                  placeholder="Contoh: Peserta salah upload repository dan perlu submit ulang."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
                />
                {state.errors?.reason?.[0] ? (
                  <p className="mt-1 text-sm text-red-600">
                    {state.errors.reason[0]}
                  </p>
                ) : null}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Batal
                </button>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
