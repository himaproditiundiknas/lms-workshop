import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";

export default async function ParticipantMaterialsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const appUser = await prisma.user.findUnique({
    where: {
      email: user.email.toLowerCase(),
    },
    include: {
      enrollments: {
        where: {
          status: "APPROVED",
        },
        include: {
          cohort: true,
        },
      },
    },
  });

  if (!appUser) {
    redirect("/login");
  }

  const workshopIds = Array.from(
    new Set(
      appUser.enrollments
        .map((enrollment) => enrollment.cohort?.workshopId)
        .filter((workshopId): workshopId is string => Boolean(workshopId)),
    ),
  );

  if (workshopIds.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">
            Belum Ada Materi
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Kamu belum approved di cohort mana pun, jadi belum ada materi yang
            bisa diakses.
          </p>
          <div className="mt-6">
            <LogoutButton />
          </div>
        </section>
      </main>
    );
  }

  const modules = await prisma.module.findMany({
    where: {
      workshopId: {
        in: workshopIds,
      },
      status: "PUBLISHED",
    },
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
      workshop: true,
      materials: {
        where: {
          status: "PUBLISHED",
        },
        orderBy: {
          orderNo: "asc",
        },
        include: {
          session: {
            include: {
              cohort: true,
            },
          },
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Learning Materials
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                Materi Workshop
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Materi published dari workshop yang sudah kamu ikuti.
              </p>
            </div>

            <LogoutButton />
          </div>
        </div>

        {modules.map((module) => (
          <div key={module.id} className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="border-b pb-4">
              <p className="text-sm font-medium text-slate-500">
                {module.workshop.title}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                Module {module.orderNo}: {module.title}
              </h2>
              {module.description ? (
                <p className="mt-2 text-sm text-slate-600">
                  {module.description}
                </p>
              ) : null}
            </div>

            <div className="mt-5 space-y-4">
              {module.materials.map((material) => (
                <article
                  key={material.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        {material.type}
                        {material.session
                          ? ` · Meeting #${material.session.meetingNo}`
                          : ""}
                      </p>
                      <h3 className="mt-1 font-semibold text-slate-950">
                        {material.orderNo}. {material.title}
                      </h3>
                    </div>
                  </div>

                  {material.description ? (
                    <p className="mt-3 text-sm text-slate-600">
                      {material.description}
                    </p>
                  ) : null}

                  {material.type === "TEXT" && material.content ? (
                    <div className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                      {material.content}
                    </div>
                  ) : null}

                  {material.type === "LINK" && material.url ? (
                    <a
                      href={material.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      Buka Materi
                    </a>
                  ) : null}
                </article>
              ))}

              {module.materials.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Belum ada material published di module ini.
                </p>
              ) : null}
            </div>
          </div>
        ))}

        {modules.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            Belum ada module published.
          </div>
        ) : null}
      </section>
    </main>
  );
}
