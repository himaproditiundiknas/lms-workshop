import Link from "next/link";
import { requireMentorOrAdmin } from "@/lib/auth/require-mentor-or-admin";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";
import { ModuleForm } from "./module-form";
import { MaterialForm } from "./material-form";
import { publishMaterialAction, unpublishMaterialAction } from "./actions";

type MentorMaterialsPageProps = {
  searchParams: Promise<{
    module?: string;
    session?: string;
  }>;
};

export default async function MentorMaterialsPage({
  searchParams,
}: MentorMaterialsPageProps) {
  await requireMentorOrAdmin();

  const params = await searchParams;
  const moduleFilter = params.module?.trim();
  const sessionFilter = params.session?.trim();

  const [workshops, modules, sessions, materials] = await Promise.all([
    prisma.workshop.findMany({
      orderBy: {
        title: "asc",
      },
      select: {
        id: true,
        title: true,
      },
    }),
    prisma.module.findMany({
      orderBy: [
        {
          workshop: {
            title: "asc",
          },
        },
        {
          orderNo: "asc",
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
    prisma.session.findMany({
      orderBy: [
        {
          cohort: {
            workshop: {
              title: "asc",
            },
          },
        },
        {
          meetingNo: "asc",
        },
      ],
      include: {
        cohort: {
          include: {
            workshop: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    }),
    prisma.material.findMany({
      where: {
        ...(moduleFilter
          ? {
              moduleId: moduleFilter,
            }
          : {}),
        ...(sessionFilter
          ? {
              sessionId: sessionFilter,
            }
          : {}),
      },
      orderBy: [
        {
          module: {
            workshop: {
              title: "asc",
            },
          },
        },
        {
          module: {
            orderNo: "asc",
          },
        },
        {
          orderNo: "asc",
        },
      ],
      include: {
        module: {
          include: {
            workshop: true,
          },
        },
        session: {
          include: {
            cohort: {
              include: {
                workshop: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Material Management
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                Kelola Module & Material
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Buat module, tambah material text/link, lalu publish untuk
                peserta approved.
              </p>
            </div>

            <LogoutButton />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Buat Module
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Module mengelompokkan material dalam satu workshop.
            </p>

            <div className="mt-6">
              <ModuleForm workshops={workshops} />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Buat Material
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Material bisa berupa text atau link, dan opsional dikaitkan ke
              session.
            </p>

            <div className="mt-6">
              <MaterialForm modules={modules} sessions={sessions} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Material List
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                List material berdasarkan module atau session.
              </p>
            </div>

            <Link
              href="/materials"
              className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Lihat sebagai peserta
            </Link>
          </div>

          <form className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
            <select
              name="module"
              defaultValue={moduleFilter ?? ""}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
            >
              <option value="">Semua module</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.workshop.title} — {module.title}
                </option>
              ))}
            </select>

            <select
              name="session"
              defaultValue={sessionFilter ?? ""}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
            >
              <option value="">Semua session</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.cohort.workshop.title} — {session.cohort.name} —
                  Meeting #{session.meetingNo}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Filter
            </button>

            <Link
              href="/mentor/materials"
              className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Reset
            </Link>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="py-3 pr-4 font-medium">Material</th>
                  <th className="py-3 pr-4 font-medium">Module</th>
                  <th className="py-3 pr-4 font-medium">Session</th>
                  <th className="py-3 pr-4 font-medium">Type</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4 font-medium">Order</th>
                  <th className="py-3 pr-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((material) => (
                  <tr key={material.id} className="border-b last:border-0">
                    <td className="py-4 pr-4 align-top">
                      <p className="font-medium text-slate-950">
                        {material.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                        {material.description ?? "-"}
                      </p>
                      {material.type === "LINK" && material.url ? (
                        <a
                          href={material.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex text-xs font-medium text-blue-700 hover:underline"
                        >
                          Open Link
                        </a>
                      ) : null}
                    </td>
                    <td className="py-4 pr-4 align-top text-slate-700">
                      <p>{material.module.workshop.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {material.module.title}
                      </p>
                    </td>
                    <td className="py-4 pr-4 align-top text-xs text-slate-700">
                      {material.session ? (
                        <>
                          <p>{material.session.cohort.name}</p>
                          <p className="mt-1">
                            Meeting #{material.session.meetingNo}:{" "}
                            {material.session.title}
                          </p>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-4 pr-4 align-top">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {material.type}
                      </span>
                    </td>
                    <td className="py-4 pr-4 align-top">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {material.status}
                      </span>
                    </td>
                    <td className="py-4 pr-4 align-top text-slate-700">
                      {material.orderNo}
                    </td>
                    <td className="py-4 pr-4 align-top">
                      {material.status === "PUBLISHED" ? (
                        <form action={unpublishMaterialAction}>
                          <input
                            type="hidden"
                            name="materialId"
                            value={material.id}
                          />
                          <button
                            type="submit"
                            className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-50"
                          >
                            Unpublish
                          </button>
                        </form>
                      ) : (
                        <form action={publishMaterialAction}>
                          <input
                            type="hidden"
                            name="materialId"
                            value={material.id}
                          />
                          <button
                            type="submit"
                            className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
                          >
                            Publish
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}

                {materials.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-sm text-slate-500"
                    >
                      Belum ada material.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
