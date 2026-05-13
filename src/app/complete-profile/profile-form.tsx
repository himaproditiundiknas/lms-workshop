"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  completeProfileAction,
  type CompleteProfileFormState,
} from "./actions";

type CompleteProfileFormProps = {
  email: string;
  initialValues: {
    fullName: string;
    nim: string;
    programStudy: string;
    semester: number | string;
    phone: string;
  };
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
      className="w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Menyimpan..." : "Simpan Profil"}
    </button>
  );
}

export function CompleteProfileForm({
  email,
  initialValues,
}: CompleteProfileFormProps) {
  const initialState: CompleteProfileFormState = {};
  const [state, formAction] = useActionState(
    completeProfileAction,
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
          htmlFor="email"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Email Google
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          readOnly
          className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700"
        />
      </div>

      <div>
        <label
          htmlFor="fullName"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Nama Lengkap
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          defaultValue={initialValues.fullName}
          placeholder="Masukkan nama lengkap"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.fullName} />
      </div>

      <div>
        <label
          htmlFor="nim"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          NIM
        </label>
        <input
          id="nim"
          name="nim"
          type="text"
          defaultValue={initialValues.nim}
          placeholder="Masukkan NIM"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.nim} />
      </div>

      <div>
        <label
          htmlFor="programStudy"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Program Studi
        </label>
        <input
          id="programStudy"
          name="programStudy"
          type="text"
          defaultValue={initialValues.programStudy}
          placeholder="Contoh: Teknologi Informasi"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.programStudy} />
      </div>

      <div>
        <label
          htmlFor="semester"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Semester
        </label>
        <input
          id="semester"
          name="semester"
          type="number"
          min="1"
          max="14"
          defaultValue={initialValues.semester}
          placeholder="Contoh: 5"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.semester} />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Nomor WhatsApp
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={initialValues.phone}
          placeholder="Contoh: 081234567890"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.phone} />
      </div>

      <SubmitButton />
    </form>
  );
}
