import { GoogleLoginButton } from "./google-login-button";
import { PasswordLoginForm } from "./password-login-form";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    dev?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  // Password login form is only visible in development, or when ?dev=1 is
  // present. In a real production hardened setup you may want to remove the
  // query-param escape hatch entirely. This keeps it available for the
  // maintainer to do quick testing against seeded users on production while
  // hiding it from normal participants.
  const showPasswordLogin =
    process.env.NODE_ENV === "development" || params.dev === "1";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-950">
            Login LMS Workshop
          </h1>

          {showPasswordLogin ? (
            <>
              <PasswordLoginForm />
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-500">atau</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
            </>
          ) : null}

          <p className="text-sm text-slate-600">
            Masuk menggunakan akun Google untuk melanjutkan.
          </p>
        </div>

        {params.error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {params.error}
          </div>
        ) : null}

        <GoogleLoginButton />
      </section>
    </main>
  );
}
