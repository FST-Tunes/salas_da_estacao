"use client";

import { useActionState } from "react";
import { Warning, ArrowRight } from "@phosphor-icons/react";
import { signInAction } from "@/app/actions/auth";
import { Header } from "@/components/brand/Header";
import { Footer } from "@/components/brand/Footer";
import { Button, LinkButton } from "@/components/ui/Button";

const configured =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signInAction, {});

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header />

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 items-start px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl text-navy">Área reservada</h1>
          <p className="mt-1 mb-6 text-sm text-text-muted">Gestão de reservas · EMM</p>

          {configured ? (
            <form action={formAction} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-navy">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full rounded-md border border-navy/20 bg-surface-0 px-3 py-2.5 text-navy outline-none focus:border-navy"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium text-navy">Palavra-passe</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-md border border-navy/20 bg-surface-0 px-3 py-2.5 text-navy outline-none focus:border-navy"
                />
              </div>

              {state?.error && (
                <p className="flex items-start gap-2 rounded-md bg-busy-fill px-3 py-2 text-sm text-busy-ink">
                  <Warning size={16} weight="bold" className="mt-0.5 shrink-0" aria-hidden />
                  {state.error}
                </p>
              )}

              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "A entrar…" : "Entrar"}
              </Button>
            </form>
          ) : (
            <form action={formAction} className="space-y-4">
              <Button type="submit" className="w-full">
                Entrar
                <ArrowRight size={16} weight="bold" />
              </Button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
