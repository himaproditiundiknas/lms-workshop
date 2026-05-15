import Link from "next/link";
import { requireMentorOrAdmin } from "@/lib/auth/require-mentor-or-admin";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";

type AdminReportsPageProps = {
  searchParams: Promise<{
    workshopId?: string;
    cohortId?: string;
  }>;
};

const reportCards = [
  {
    type: "participants",
    title: "Participants",
    description:
      "Export data peserta, profile, role, enrollment, workshop, dan cohort.",
  },
  {
    type: "attendance",
    title: "Attendance",
    description:
      "Export data presensi peserta per sesi, termasuk correction dan method.",
  },
  {
    type: "submissions",
    title: "Submissions",
    description:
      "Export submission peserta, repository, deployment, file, status, dan attempt.",
  },
  {
    type: "grades",
    title: "Grades",
    description:
      "Export nilai dan feedback dari submission yang sudah di-grade.",
  },
  {
    type: "certificate-eligibility",
    title: "Certificate Eligibility",
    description:
      "Export status kelayakan sertifikat beserta alasan dan detail perhitungan.",
  },
];

function buildExportHref({
  reportType,
  workshopId,
  cohortId,
}: {
  reportType: string;
  workshopId?: string;
  cohortId?: string;
}) {
  const params = new URLSearchParams();

  if (workshopId) {
    params.set("workshopId", workshopId);
  }

  if (cohortId) {
    params.set("cohortId", cohortId);
  }

  const queryString = params.toString();

  return `/admin/reports/export/${reportType}${queryString ? `?${queryString}` : ""}`;
}

export default async function AdminReportsPage({
  searchParams,
}: AdminReportsPageProps) {
  await requireMentorOrAdmin();

  const params = await searchParams;
  const workshopId = params.workshopId?.trim() || undefined;
  const cohortId = params.cohortId?.trim() || undefined;

  const [workshops, cohorts] = await Promise.all([
    prisma.workshop.findMany({
      orderBy: {
        title: "asc",
      },
      select: {
        id: true,
        title: true,
      },
    }),
    prisma.cohort.findMany({
      where: {
        ...(workshopId
          ? {
              workshopId,
            }
          : {}),
      },
      orderBy: [
        {
          workshop: {
            title: "asc",
          },
        },
        {
          name: "asc",
        },
      ],
      include: {
        workshop: {
          select: {
            title: true,
          },
        },
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-6xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Reports Export
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                Export Reports CSV
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Download data penting LMS dalam format CSV sesuai filter
                workshop/cohort.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/mentor"
                className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/certificates"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Certificates
              </Link>
              <Link
                href="/mentor/final-projects"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Final Projects
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            Filter Export
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Pilih workshop atau cohort untuk membatasi data yang diexport.
          </p>

          <form className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
            <select
              name="workshopId"
              defaultValue={workshopId ?? ""}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
            >
              <option value="">Semua workshop</option>
              {workshops.map((workshop) => (
                <option key={workshop.id} value={workshop.id}>
                  {workshop.title}
                </option>
              ))}
            </select>

            <select
              name="cohortId"
              defaultValue={cohortId ?? ""}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
            >
              <option value="">Semua cohort</option>
              {cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.workshop.title} — {cohort.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Terapkan Filter
            </button>

            <Link
              href="/admin/reports"
              className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Reset
            </Link>
          </form>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-medium text-slate-950">Filter aktif</p>
            <p className="mt-1">Workshop ID: {workshopId ?? "Semua"}</p>
            <p className="mt-1">Cohort ID: {cohortId ?? "Semua"}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {reportCards.map((report) => (
            <article
              key={report.type}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-950">
                {report.title}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {report.description}
              </p>

              <div className="mt-5">
                <a
                  href={buildExportHref({
                    reportType: report.type,
                    workshopId,
                    cohortId,
                  })}
                  className="inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Download CSV
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
