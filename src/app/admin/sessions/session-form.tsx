"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createSessionAction,
  updateSessionAction,
  type SessionFormState,
} from "./actions";

type CohortOption = {
  id: string;
  name: string;
  workshop: {
    title: string;
  };
};

type SessionFormProps = {
  mode: "create" | "edit";
  sessionId?: string;
  cohorts: CohortOption[];
  initialValues?: {
    cohortId: string;
    meetingNo: number;
    title: string;
    description: string;
    location: string;
    startsAt: string;
    endsAt: string;
  };
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return <p className="mt-1 text-sm text-red-600">{messages[0]}</p>;
}

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending
        ? "Menyimpan..."
        : mode === "create"
          ? "Buat Sesi"
          : "Simpan Perubahan"}
    </button>
  );
}

export function SessionForm({
  mode,
  sessionId,
  cohorts,
  initialValues,
}: SessionFormProps) {
  const initialState: SessionFormState = {};

  const action =
    mode === "edit" && sessionId
      ? updateSessionAction.bind(null, sessionId)
      : createSessionAction;

  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.message ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          {state.message}
        </div>
      ) : null}

      <div>
        <label
          htmlFor="cohortId"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Cohort
        </label>
        <select
          id="cohortId"
          name="cohortId"
          defaultValue={initialValues?.cohortId ?? ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        >
          <option value="">Pilih cohort</option>
          {cohorts.map((cohort) => (
            <option key={cohort.id} value={cohort.id}>
              {cohort.workshop.title} — {cohort.name}
            </option>
          ))}
        </select>
        <FieldError messages={state.errors?.cohortId} />
      </div>

      <div>
        <label
          htmlFor="meetingNo"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Meeting No
        </label>
        <input
          id="meetingNo"
          name="meetingNo"
          type="number"
          min="1"
          defaultValue={initialValues?.meetingNo ?? 1}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.meetingNo} />
      </div>

      <div>
        <label
          htmlFor="title"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Judul Sesi
        </label>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={initialValues?.title}
          placeholder="Contoh: HTML dan CSS Dasar"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.title} />
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Deskripsi
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={initialValues?.description}
          rows={4}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.description} />
      </div>

      <div>
        <label
          htmlFor="location"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Location
        </label>
        <input
          id="location"
          name="location"
          type="text"
          defaultValue={initialValues?.location}
          placeholder="Contoh: Lab Komputer / Google Meet"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.location} />
      </div>

      <div>
        <label
          htmlFor="startsAt"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Starts At
        </label>
        <input
          id="startsAt"
          name="startsAt"
          type="datetime-local"
          defaultValue={initialValues?.startsAt}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.startsAt} />
      </div>

      <div>
        <label
          htmlFor="endsAt"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Ends At
        </label>
        <input
          id="endsAt"
          name="endsAt"
          type="datetime-local"
          defaultValue={initialValues?.endsAt}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.endsAt} />
      </div>

      <SubmitButton mode={mode} />
    </form>
  );
}
