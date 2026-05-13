"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  closeAttendanceAction,
  openAttendanceAction,
  type AttendanceSessionActionState,
} from "@/lib/attendance/actions";

type SessionAttendanceActionsProps = {
  sessionId: string;
  attendanceStatus: "NOT_OPENED" | "OPEN" | "CLOSED";
};

function SubmitButton({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "open" | "close";
}) {
  const { pending } = useFormStatus();

  const className =
    variant === "open"
      ? "rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      : "rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? "Memproses..." : children}
    </button>
  );
}

export function SessionAttendanceActions({
  sessionId,
  attendanceStatus,
}: SessionAttendanceActionsProps) {
  const initialState: AttendanceSessionActionState = {};
  const [openState, openFormAction] = useActionState(
    openAttendanceAction,
    initialState,
  );
  const [closeState, closeFormAction] = useActionState(
    closeAttendanceAction,
    initialState,
  );

  if (attendanceStatus === "CLOSED") {
    return (
      <div className="space-y-1">
        <span className="text-xs text-slate-500">Presensi ditutup</span>
        {closeState.message ? (
          <p className="text-xs text-slate-600">{closeState.message}</p>
        ) : null}
      </div>
    );
  }

  if (attendanceStatus === "OPEN") {
    return (
      <form
        action={closeFormAction}
        onSubmit={(event) => {
          const confirmed = window.confirm(
            "Tutup presensi sesi ini? Peserta approved yang belum absen akan otomatis ditandai absent.",
          );

          if (!confirmed) {
            event.preventDefault();
          }
        }}
        className="space-y-2"
      >
        <input type="hidden" name="sessionId" value={sessionId} />
        <SubmitButton variant="close">Close Attendance</SubmitButton>
        {closeState.message ? (
          <p className="text-xs text-slate-600">{closeState.message}</p>
        ) : null}
      </form>
    );
  }

  return (
    <form
      action={openFormAction}
      onSubmit={(event) => {
        const confirmed = window.confirm("Buka presensi untuk sesi ini?");

        if (!confirmed) {
          event.preventDefault();
        }
      }}
      className="space-y-2"
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <SubmitButton variant="open">Open Attendance</SubmitButton>
      {openState.message ? (
        <p className="text-xs text-slate-600">{openState.message}</p>
      ) : null}
    </form>
  );
}
