"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createWorkshopAction,
  updateWorkshopAction,
  type WorkshopFormState,
} from "./actions";

type WorkshopFormProps = {
  mode: "create" | "edit";
  workshopId?: string;
  initialValues?: {
    title: string;
    slug: string;
    description: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
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
          ? "Buat Workshop"
          : "Simpan Perubahan"}
    </button>
  );
}

export function WorkshopForm({
  mode,
  workshopId,
  initialValues,
}: WorkshopFormProps) {
  const initialState: WorkshopFormState = {};

  const action =
    mode === "edit" && workshopId
      ? updateWorkshopAction.bind(null, workshopId)
      : createWorkshopAction;

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
          htmlFor="title"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Judul Workshop
        </label>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={initialValues?.title}
          placeholder="Contoh: Basic Web Development"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.title} />
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
          htmlFor="status"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={initialValues?.status ?? "DRAFT"}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        >
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <FieldError messages={state.errors?.status} />
      </div>

      <SubmitButton mode={mode} />
    </form>
  );
}
