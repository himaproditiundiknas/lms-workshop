"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  approveEnrollmentAction,
  rejectEnrollmentAction,
  type EnrollmentActionState,
} from "./actions";

type EnrollmentActionsProps = {
  enrollmentId: string;
  scope: "WORKSHOP" | "COHORT";
};

function SubmitButton({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "approve" | "reject";
}) {
  const { pending } = useFormStatus();

  const className =
    variant === "approve"
      ? "rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      : "rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? "Memproses..." : children}
    </button>
  );
}

export function EnrollmentActions({
  enrollmentId,
  scope,
}: EnrollmentActionsProps) {
  const initialState: EnrollmentActionState = {};
  const [approveState, approveFormAction] = useActionState(
    approveEnrollmentAction,
    initialState,
  );
  const [rejectState, rejectFormAction] = useActionState(
    rejectEnrollmentAction,
    initialState,
  );

  return (
    <div className="space-y-3">
      <form action={approveFormAction} className="space-y-2">
        <input type="hidden" name="enrollmentId" value={enrollmentId} />

        {scope === "WORKSHOP" ? (
          <div>
            <input
              name="cohortId"
              type="text"
              placeholder="Cohort UUID"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-950 outline-none transition focus:border-slate-950"
            />
            {approveState.errors?.cohortId?.[0] ? (
              <p className="mt-1 text-xs text-red-600">
                {approveState.errors.cohortId[0]}
              </p>
            ) : null}
          </div>
        ) : null}

        <SubmitButton variant="approve">Approve</SubmitButton>

        {approveState.message ? (
          <p className="text-xs text-slate-600">{approveState.message}</p>
        ) : null}
      </form>

      <form action={rejectFormAction} className="space-y-2">
        <input type="hidden" name="enrollmentId" value={enrollmentId} />
        <input
          name="rejectionReason"
          type="text"
          placeholder="Alasan reject opsional"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-950 outline-none transition focus:border-slate-950"
        />

        <SubmitButton variant="reject">Reject</SubmitButton>

        {rejectState.message ? (
          <p className="text-xs text-slate-600">{rejectState.message}</p>
        ) : null}
      </form>
    </div>
  );
}
