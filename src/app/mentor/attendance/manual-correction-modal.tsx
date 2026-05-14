"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  correctAttendanceAction,
  type ManualAttendanceCorrectionState,
} from "./actions";

type ManualCorrectionModalProps = {
  sessionId: string;
  userId: string;
  participantName: string;
  currentStatus?: "PRESENT" | "ABSENT" | "EXCUSED" | "CORRECTED";
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Menyimpan..." : "Simpan Koreksi"}
    </button>
  );
}

export function ManualCorrectionModal({
  sessionId,
  userId,
  participantName,
  currentStatus,
}: ManualCorrectionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const initialState: ManualAttendanceCorrectionState = {};
  const [state, formAction] = useActionState(
    correctAttendanceAction,
    initialState,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
      >
        Koreksi
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Koreksi Presensi
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Peserta: {participantName}
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
              <input type="hidden" name="sessionId" value={sessionId} />
              <input type="hidden" name="userId" value={userId} />

              {state.message ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  {state.message}
                </div>
              ) : null}

              <div>
                <label
                  htmlFor={`status-${userId}`}
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Status
                </label>
                <select
                  id={`status-${userId}`}
                  name="status"
                  defaultValue={currentStatus ?? "PRESENT"}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
                >
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="EXCUSED">Excused</option>
                  <option value="CORRECTED">Corrected</option>
                </select>
                {state.errors?.status?.[0] ? (
                  <p className="mt-1 text-sm text-red-600">
                    {state.errors.status[0]}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor={`note-${userId}`}
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Alasan Koreksi
                </label>
                <textarea
                  id={`note-${userId}`}
                  name="note"
                  rows={4}
                  placeholder="Contoh: Peserta hadir tapi QR gagal discan karena kendala kamera."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
                />
                {state.errors?.note?.[0] ? (
                  <p className="mt-1 text-sm text-red-600">
                    {state.errors.note[0]}
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
