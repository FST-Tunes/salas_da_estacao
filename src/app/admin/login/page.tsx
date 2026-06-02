"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Warning, ArrowRight } from "@phosphor-icons/react";
import { signInAction } from "@/app/actions/auth";
import { Button, LinkButton } from "@/components/ui/Button";

const configured =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signInAction, {});

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-surface-2 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src="/brand/emm-symbol.png" alt="" aria-hidden width={44} height={56} className="h-14 w-auto" />
          <h1 className="mt-4 font-display text-2xl text-navy">Área reservada</h1>
          <p className="mt-1 text-sm text-text-muted">Gestão de reservas · EMM</p>
        </div>

        <div className="rounded-lg border border-hairline bg-surface-0 p-6 shadow-md">
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
            <div className="space-y-4 text-center">
              <p className="rounded-md bg-pending-fill px-3 py-2 text-sm text-pending-ink">
                Modo de demonstração — sem base de dados configurada. A área de gestão está aberta
                para pré-visualização.
              </p>
              <LinkButton href="/admin" className="w-full">
                Entrar em demonstração
                <ArrowRight size={16} weight="bold" />
              </LinkButton>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-sm">
          <Link href="/" className="text-text-muted hover:text-navy">← Voltar à disponibilidade</Link>
        </p>
      </div>
    </main>
  );
}
