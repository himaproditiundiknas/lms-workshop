"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  redeemInvitationCodeAction,
  type RedeemInvitationState,
} from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Memproses..." : "Redeem Kode"}
    </button>
  );
}

export function RedeemInvitationForm() {
  const initialState: RedeemInvitationState = {};
  const [state, formAction] = useActionState(
    redeemInvitationCodeAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.message ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </div>
      ) : null}

      <div>
        <label
          htmlFor="code"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Kode Undangan
        </label>
        <input
          id="code"
          name="code"
          type="text"
          placeholder="Contoh: LMS-4E53E0-D4C6F3"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase tracking-wide text-slate-950 outline-none transition focus:border-slate-950"
        />
        {state.errors?.code?.[0] ? (
          <p className="mt-1 text-sm text-red-600">{state.errors.code[0]}</p>
        ) : null}
      </div>

      <SubmitButton />
    </form>
  );
}
