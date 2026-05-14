"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createMaterialAction, type MaterialFormState } from "./actions";

type ModuleOption = {
  id: string;
  title: string;
  workshop: {
    title: string;
  };
};

type SessionOption = {
  id: string;
  title: string;
  meetingNo: number;
  cohort: {
    name: string;
    workshop: {
      title: string;
    };
  };
};

type MaterialFormProps = {
  modules: ModuleOption[];
  sessions: SessionOption[];
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
      {pending ? "Menyimpan..." : "Buat Material"}
    </button>
  );
}

export function MaterialForm({ modules, sessions }: MaterialFormProps) {
  const initialState: MaterialFormState = {};
  const [state, formAction] = useActionState(
    createMaterialAction,
    initialState,
  );
  const [type, setType] = useState<"TEXT" | "LINK">("TEXT");

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          {state.message}
        </div>
      ) : null}

      <div>
        <label
          htmlFor="moduleId"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Module
        </label>
        <select
          id="moduleId"
          name="moduleId"
          defaultValue=""
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        >
          <option value="">Pilih module</option>
          {modules.map((module) => (
            <option key={module.id} value={module.id}>
              {module.workshop.title} — {module.title}
            </option>
          ))}
        </select>
        <FieldError messages={state.errors?.moduleId} />
      </div>

      <div>
        <label
          htmlFor="sessionId"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Session Optional
        </label>
        <select
          id="sessionId"
          name="sessionId"
          defaultValue=""
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        >
          <option value="">Tidak terkait session</option>
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.cohort.workshop.title} — {session.cohort.name} — Meeting
              #{session.meetingNo}: {session.title}
            </option>
          ))}
        </select>
        <FieldError messages={state.errors?.sessionId} />
      </div>

      <div>
        <label
          htmlFor="title"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Judul Material
        </label>
        <input
          id="title"
          name="title"
          type="text"
          placeholder="Contoh: HTML and CSS Reference"
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
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.description} />
      </div>

      <div>
        <label
          htmlFor="type"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Tipe
        </label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={(event) => setType(event.target.value as "TEXT" | "LINK")}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        >
          <option value="TEXT">Text</option>
          <option value="LINK">Link</option>
        </select>
        <FieldError messages={state.errors?.type} />
      </div>

      {type === "TEXT" ? (
        <div>
          <label
            htmlFor="content"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Konten Text
          </label>
          <textarea
            id="content"
            name="content"
            rows={6}
            placeholder="Tulis materi di sini"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
          />
          <FieldError messages={state.errors?.content} />
        </div>
      ) : (
        <div>
          <label
            htmlFor="url"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            URL
          </label>
          <input
            id="url"
            name="url"
            type="url"
            placeholder="https://example.com/material"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
          />
          <FieldError messages={state.errors?.url} />
        </div>
      )}

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
