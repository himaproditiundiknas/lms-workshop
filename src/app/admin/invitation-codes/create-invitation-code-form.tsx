"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createInvitationCodeAction,
  type CreateInvitationCodeState,
} from "./actions";

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
      className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Membuat..." : "Buat Kode"}
    </button>
  );
}

export function CreateInvitationCodeForm() {
  const initialState: CreateInvitationCodeState = {};
  const [state, formAction] = useActionState(
    createInvitationCodeAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-2xl bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-950">
          Buat Invitation Code
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Plain code hanya akan muncul sekali setelah dibuat.
        </p>
      </div>

      {state.message ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          {state.message}
        </div>
      ) : null}

      {state.plainCode ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">
            Simpan kode ini sekarang:
          </p>
          <code className="mt-2 block rounded-md bg-white px-3 py-2 text-lg font-semibold tracking-wide text-slate-950">
            {state.plainCode}
          </code>
          <p className="mt-2 text-xs text-amber-800">
            Kode ini tidak disimpan dalam bentuk plain text dan tidak bisa
            dilihat lagi setelah halaman berubah.
          </p>
        </div>
      ) : null}

      <div>
        <label
          htmlFor="scope"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Scope
        </label>
        <select
          id="scope"
          name="scope"
          defaultValue="WORKSHOP"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        >
          <option value="WORKSHOP">Workshop</option>
          <option value="COHORT">Cohort</option>
        </select>
        <FieldError messages={state.errors?.scope} />
      </div>

      <div>
        <label
          htmlFor="targetId"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Target ID
        </label>
        <input
          id="targetId"
          name="targetId"
          type="text"
          placeholder="UUID workshop atau cohort"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <p className="mt-1 text-xs text-slate-500">
          Untuk sementara isi UUID target workshop/cohort. Relasi detail akan
          disambungkan saat tabel workshop/cohort tersedia.
        </p>
        <FieldError messages={state.errors?.targetId} />
      </div>

      <div>
        <label
          htmlFor="maxUses"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Max Uses
        </label>
        <input
          id="maxUses"
          name="maxUses"
          type="number"
          min="1"
          defaultValue="1"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.maxUses} />
      </div>

      <div>
        <label
          htmlFor="expiresAt"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Expiration Date
        </label>
        <input
          id="expiresAt"
          name="expiresAt"
          type="datetime-local"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <p className="mt-1 text-xs text-slate-500">
          Kosongkan jika kode tidak punya tanggal kedaluwarsa.
        </p>
        <FieldError messages={state.errors?.expiresAt} />
      </div>

      <SubmitButton />
    </form>
  );
}
