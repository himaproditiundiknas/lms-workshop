"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  addProjectGroupMemberAction,
  type ProjectGroupMemberFormState,
} from "./actions";

type ProjectGroupOption = {
  id: string;
  name: string;
  cohortId: string;
  status: "ACTIVE" | "LOCKED" | "ARCHIVED";
  cohort: {
    name: string;
    workshop: {
      title: string;
    };
  };
};

type EnrollmentOption = {
  id: string;
  cohortId: string | null;
  userId: string;
  user: {
    email: string;
    profile: {
      fullName: string | null;
      nim: string | null;
    } | null;
  };
  cohort: {
    name: string;
    workshop: {
      title: string;
    };
  } | null;
};

type ProjectGroupMemberFormProps = {
  projectGroups: ProjectGroupOption[];
  approvedEnrollments: EnrollmentOption[];
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
      {pending ? "Menyimpan..." : "Tambah / Update Member"}
    </button>
  );
}

export function ProjectGroupMemberForm({
  projectGroups,
  approvedEnrollments,
}: ProjectGroupMemberFormProps) {
  const initialState: ProjectGroupMemberFormState = {};
  const [state, formAction] = useActionState(
    addProjectGroupMemberAction,
    initialState,
  );
  const [selectedProjectGroupId, setSelectedProjectGroupId] = useState("");

  const selectedProjectGroup = projectGroups.find(
    (projectGroup) => projectGroup.id === selectedProjectGroupId,
  );

  const filteredEnrollments = useMemo(() => {
    const enrollmentsWithCohort = approvedEnrollments.filter(
      (enrollment) => enrollment.cohortId && enrollment.cohort,
    );

    if (!selectedProjectGroup) {
      return enrollmentsWithCohort;
    }

    return enrollmentsWithCohort.filter(
      (enrollment) => enrollment.cohortId === selectedProjectGroup.cohortId,
    );
  }, [approvedEnrollments, selectedProjectGroup]);

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          {state.message}
        </div>
      ) : null}

      <div>
        <label
          htmlFor="projectGroupId"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Project Group
        </label>
        <select
          id="projectGroupId"
          name="projectGroupId"
          value={selectedProjectGroupId}
          onChange={(event) => setSelectedProjectGroupId(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        >
          <option value="">Pilih project group</option>
          {projectGroups.map((projectGroup) => (
            <option key={projectGroup.id} value={projectGroup.id}>
              {projectGroup.cohort.workshop.title} — {projectGroup.cohort.name}{" "}
              — {projectGroup.name} ({projectGroup.status})
            </option>
          ))}
        </select>
        <FieldError messages={state.errors?.projectGroupId} />
      </div>

      <div>
        <label
          htmlFor="userId"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Peserta Approved
        </label>
        <select
          id="userId"
          name="userId"
          defaultValue=""
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        >
          <option value="">Pilih peserta</option>
          {filteredEnrollments.map((enrollment) => (
            <option key={enrollment.id} value={enrollment.userId}>
              {enrollment.user.profile?.fullName ?? enrollment.user.email} —{" "}
              {enrollment.user.profile?.nim ?? "-"} —{" "}
              {enrollment.cohort?.name ?? "-"}
            </option>
          ))}
        </select>
        <FieldError messages={state.errors?.userId} />
      </div>

      <div>
        <label
          htmlFor="role"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Role
        </label>
        <select
          id="role"
          name="role"
          defaultValue="MEMBER"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
        >
          <option value="MEMBER">Member</option>
          <option value="LEADER">Leader</option>
        </select>
        <FieldError messages={state.errors?.role} />
      </div>

      <SubmitButton />
    </form>
  );
}
