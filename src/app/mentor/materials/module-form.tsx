"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createModuleAction, type ModuleFormState } from "./actions";

type WorkshopOption = {
  id: string;
  title: string;
};

type ModuleFormProps = {
  workshops: WorkshopOption[];
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
      className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Menyimpan..." : "Buat Module"}
    </button>
  );
}

export function ModuleForm({ workshops }: ModuleFormProps) {
  const initialState: ModuleFormState = {};
  const [state, formAction] = useActionState(createModuleAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
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
          defaultValue=""
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
          htmlFor="title"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Judul Module
        </label>
        <input
          id="title"
          name="title"
          type="text"
          placeholder="Contoh: Web Development Foundation"
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
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.description} />
      </div>

      <div>
        <label
          htmlFor="orderNo"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Urutan
        </label>
        <input
          id="orderNo"
          name="orderNo"
          type="number"
          min="1"
          defaultValue="1"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.orderNo} />
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
          defaultValue="DRAFT"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        >
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <FieldError messages={state.errors?.status} />
      </div>

      <SubmitButton />
    </form>
  );
}
