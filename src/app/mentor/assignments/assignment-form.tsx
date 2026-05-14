"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { createAssignmentAction, type AssignmentFormState } from "./actions";

type WorkshopOption = {
  id: string;
  title: string;
};

type SessionOption = {
  id: string;
  title: string;
  meetingNo: number;
  cohort: {
    workshopId: string;
    name: string;
    workshop: {
      title: string;
    };
  };
};

type AssignmentFormProps = {
  workshops: WorkshopOption[];
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
      {pending ? "Menyimpan..." : "Buat Assignment"}
    </button>
  );
}

export function AssignmentForm({ workshops, sessions }: AssignmentFormProps) {
  const initialState: AssignmentFormState = {};
  const [state, formAction] = useActionState(
    createAssignmentAction,
    initialState,
  );
  const [selectedWorkshopId, setSelectedWorkshopId] = useState("");
  const [category, setCategory] = useState<"REGULAR" | "FINAL_PROJECT">(
    "REGULAR",
  );

  const filteredSessions = useMemo(() => {
    if (!selectedWorkshopId) {
      return sessions;
    }

    return sessions.filter(
      (session) => session.cohort.workshopId === selectedWorkshopId,
    );
  }, [selectedWorkshopId, sessions]);

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
          value={selectedWorkshopId}
          onChange={(event) => setSelectedWorkshopId(event.target.value)}
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
          {filteredSessions.map((session) => (
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
          Judul Assignment
        </label>
        <input
          id="title"
          name="title"
          type="text"
          placeholder="Contoh: HTML & CSS Practice"
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
          Deskripsi / Instruksi
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          placeholder="Tulis instruksi tugas di sini"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.description} />
      </div>

      <div>
        <label
          htmlFor="category"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Category
        </label>
        <select
          id="category"
          name="category"
          value={category}
          onChange={(event) =>
            setCategory(event.target.value as "REGULAR" | "FINAL_PROJECT")
          }
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        >
          <option value="REGULAR">Regular</option>
          <option value="FINAL_PROJECT">Final Project</option>
        </select>
        <FieldError messages={state.errors?.category} />
      </div>

      <div>
        <label
          htmlFor="dueAt"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Due Date
        </label>
        <input
          id="dueAt"
          name="dueAt"
          type="datetime-local"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.dueAt} />
      </div>

      <div>
        <label
          htmlFor="maxScore"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Max Score
        </label>
        <input
          id="maxScore"
          name="maxScore"
          type="number"
          min="1"
          defaultValue="100"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.maxScore} />
      </div>

      <div className="space-y-3 rounded-lg border border-slate-200 p-4">
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            name="allowLate"
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          <span>
            <span className="block font-medium text-slate-950">
              Allow Late Submission
            </span>
            <span className="text-slate-600">
              Peserta masih bisa submit setelah due date.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            name="requiredForCertificate"
            type="checkbox"
            defaultChecked={category === "FINAL_PROJECT"}
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          <span>
            <span className="block font-medium text-slate-950">
              Required for Certificate
            </span>
            <span className="text-slate-600">
              Assignment ini wajib untuk eligibility sertifikat.
            </span>
          </span>
        </label>
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
          <option value="CLOSED">Closed</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <FieldError messages={state.errors?.status} />
      </div>

      <SubmitButton />
    </form>
  );
}
