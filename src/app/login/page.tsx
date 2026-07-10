import { GanttChartSquare, LockKeyhole } from "lucide-react";
import { loginAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { getEffectivePassword } from "@/lib/app-settings";
import { getT } from "@/lib/locale";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, { t }, password] = await Promise.all([
    searchParams,
    getT(),
    getEffectivePassword(),
  ]);
  const authEnabled = Boolean(password);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_500px_at_50%_-10%,oklch(0.9_0.06_182/0.5),transparent_60%)]" />

      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <GanttChartSquare className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-semibold">{t.nav.appName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.nav.appSub}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {error === "bad-password" ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
              {t.login.wrong}
            </div>
          ) : null}
          <form action={loginAction} className="space-y-4">
            <label className="block">
              <span className="flabel">{t.login.password}</span>
              <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
                <LockKeyhole className="h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  name="password"
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </div>
            </label>
            <Button className="w-full" type="submit">
              {t.login.enter}
            </Button>
          </form>
          {!authEnabled ? (
            <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
              {t.login.desc}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
