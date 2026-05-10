import { GoogleLoginButton } from "./google-login-button";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-950">
            Login LMS Workshop
          </h1>
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
