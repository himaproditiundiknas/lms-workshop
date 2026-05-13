import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { prisma } from "@/lib/prisma";
import { CreateInvitationCodeForm } from "./create-invitation-code-form";
import { revokeInvitationCodeAction } from "./actions";

export default async function InvitationCodesAdminPage() {
  await requireSuperAdmin();

  const invitationCodes = await prisma.invitationCode.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      createdBy: {
        select: {
          email: true,
        },
      },
      _count: {
        select: {
          redemptions: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[420px_1fr]">
        <div>
          <CreateInvitationCodeForm />
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h1 className="text-2xl font-semibold text-slate-950">
              Invitation Codes
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Kelola kode undangan workshop dan cohort.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="py-3 pr-4 font-medium">Scope</th>
                  <th className="py-3 pr-4 font-medium">Target</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4 font-medium">Usage</th>
                  <th className="py-3 pr-4 font-medium">Expires</th>
                  <th className="py-3 pr-4 font-medium">Created By</th>
                  <th className="py-3 pr-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {invitationCodes.map((code) => (
                  <tr key={code.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 text-slate-950">{code.scope}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-600">
                      {code.targetId}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {code.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {code.usedCount}/{code.maxUses}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {code.expiresAt
                        ? new Intl.DateTimeFormat("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(code.expiresAt)
                        : "-"}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {code.createdBy?.email ?? "-"}
                    </td>
                    <td className="py-3 pr-4">
                      {code.status === "REVOKED" ? (
                        <span className="text-xs text-slate-500">Revoked</span>
                      ) : (
                        <form action={revokeInvitationCodeAction}>
                          <input
                            type="hidden"
                            name="invitationCodeId"
                            value={code.id}
                          />
                          <button
                            type="submit"
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
                          >
                            Revoke
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}

                {invitationCodes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-sm text-slate-500"
                    >
                      Belum ada invitation code.
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
