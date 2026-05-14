"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { passwordLoginAction, type PasswordLoginState } from "./actions";

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
      className="w-full rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Masuk..." : "Login dengan Email"}
    </button>
  );
}

export function PasswordLoginForm() {
  const initialState: PasswordLoginState = {};
  const [state, formAction] = useActionState(passwordLoginAction, initialState);

  return (
    <form action={formAction} className="mt-5 space-y-4">
      {state.message ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          {state.message}
        </div>
      ) : null}

      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="admin.dev@lms.local"
          autoComplete="email"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.email} />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Password seeded user"
          autoComplete="current-password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.password} />
      </div>

      <SubmitButton />

      {process.env.NODE_ENV === "development" ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <p className="font-medium">Development seed users</p>
          <p className="mt-1">Admin: admin.dev@lms.local</p>
          <p>Participant: participant.dev@lms.local</p>
          <p className="mt-1">
            Password mengikuti value di <code>.env.local</code>.
          </p>
        </div>
      ) : null}
    </form>
  );
}
