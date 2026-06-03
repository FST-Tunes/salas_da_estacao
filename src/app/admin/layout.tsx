import { headers } from "next/headers";
import { SignOut } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/brand/Logo";
import { AdminNav } from "@/components/admin/AdminNav";
import { signOutAction } from "@/app/actions/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-current-path") ?? "";
  if (pathname === "/admin/login") return <>{children}</>;

  let email: string | null = null;
  if (isSupabaseConfigured) {
    const sb = await createSupabaseServerClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    email = user?.email ?? null;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-surface-2">
      <header className="border-b border-hairline bg-surface-0">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden text-sm text-navy-30 sm:inline">/</span>
            <span className="hidden font-display text-navy sm:inline">Gestão</span>
          </div>
          <div className="flex items-center gap-3">
            {email && (
              <span className="hidden text-sm text-text-muted sm:inline">{email}</span>
            )}
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md border border-navy/20 px-3 py-2 text-sm font-medium text-navy hover:bg-navy/5"
              >
                <SignOut size={16} weight="bold" aria-hidden />
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        <aside className="lg:w-52 lg:shrink-0">
          <div className="lg:sticky lg:top-6">
            <AdminNav />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
