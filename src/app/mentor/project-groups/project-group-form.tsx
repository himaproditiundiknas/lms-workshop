"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createProjectGroupAction,
  type ProjectGroupFormState,
} from "./actions";

type CohortOption = {
  id: string;
  name: string;
  workshop: {
    title: string;
  };
};

type UserOption = {
  id: string;
  email: string;
  profile: {
    fullName: string | null;
  } | null;
};

type ProjectGroupFormProps = {
  cohorts: CohortOption[];
  users: UserOption[];
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
      {pending ? "Menyimpan..." : "Buat Project Group"}
    </button>
  );
}

export function ProjectGroupForm({ cohorts, users }: ProjectGroupFormProps) {
  const initialState: ProjectGroupFormState = {};
  const [state, formAction] = useActionState(
    createProjectGroupAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
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
          defaultValue=""
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
          htmlFor="mentorId"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Mentor Optional
        </label>
        <select
          id="mentorId"
          name="mentorId"
          defaultValue=""
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        >
          <option value="">Belum assign mentor</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.profile?.fullName ?? user.email} — {user.email}
            </option>
          ))}
        </select>
        <FieldError messages={state.errors?.mentorId} />
      </div>

      <div>
        <label
          htmlFor="name"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Nama Group
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Contoh: Team Alpha"
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
          placeholder="Kosongkan untuk auto-generate"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.slug} />
      </div>

      <div>
        <label
          htmlFor="title"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Judul Project Optional
        </label>
        <input
          id="title"
          name="title"
          type="text"
          placeholder="Contoh: LMS Attendance Tracker"
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
          rows={4}
          placeholder="Deskripsi singkat group/project"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.description} />
      </div>

      <div>
        <label
          htmlFor="repositoryUrl"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Repository URL Optional
        </label>
        <input
          id="repositoryUrl"
          name="repositoryUrl"
          type="url"
          placeholder="https://github.com/org/project"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.repositoryUrl} />
      </div>

      <div>
        <label
          htmlFor="deploymentUrl"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Deployment URL Optional
        </label>
        <input
          id="deploymentUrl"
          name="deploymentUrl"
          type="url"
          placeholder="https://project.vercel.app"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        />
        <FieldError messages={state.errors?.deploymentUrl} />
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
          defaultValue="ACTIVE"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        >
          <option value="ACTIVE">Active</option>
          <option value="LOCKED">Locked</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <FieldError messages={state.errors?.status} />
      </div>

      <SubmitButton />
    </form>
  );
}
