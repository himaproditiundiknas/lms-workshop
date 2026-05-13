"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createCohortAction,
  updateCohortAction,
  type CohortFormState,
} from "./actions";

type WorkshopOption = {
  id: string;
  title: string;
};

type CohortFormProps = {
  mode: "create" | "edit";
  cohortId?: string;
  workshops: WorkshopOption[];
  initialValues?: {
    workshopId: string;
    name: string;
    slug: string;
    status: "ACTIVE" | "INACTIVE" | "CLOSED";
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
          ? "Buat Cohort"
          : "Simpan Perubahan"}
    </button>
  );
}

export function CohortForm({
  mode,
  cohortId,
  workshops,
  initialValues,
}: CohortFormProps) {
  const initialState: CohortFormState = {};

  const action =
    mode === "edit" && cohortId
      ? updateCohortAction.bind(null, cohortId)
      : createCohortAction;

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
          htmlFor="workshopId"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Workshop
        </label>
        <select
          id="workshopId"
          name="workshopId"
          defaultValue={initialValues?.workshopId ?? ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        >
          <option value="">Pilih workshop</option>
          {workshops.map((workshop) => (
            <option key={workshop.id} value={workshop.id}>
              {workshop.title}
            </option>
          ))}
        </select>
        <FieldError messages={state.errors?.workshopId} />
      </div>

      <div>
        <label
          htmlFor="name"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Nama Cohort
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={initialValues?.name}
          placeholder="Contoh: Cohort 2026 Batch 1"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.name} />
      </div>

      <div>
        <label
          htmlFor="slug"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          defaultValue={initialValues?.slug}
          placeholder="Kosongkan untuk auto-generate"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.slug} />
      </div>

      <div>
        <label
          htmlFor="status"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={initialValues?.status ?? "ACTIVE"}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="CLOSED">Closed</option>
        </select>
        <FieldError messages={state.errors?.status} />
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
