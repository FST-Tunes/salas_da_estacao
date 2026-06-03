"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Single admin login via Supabase Auth (email + password). */
export async function signInAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured) {
    const jar = await cookies();
    jar.set("demo-auth", "1", { httpOnly: true, path: "/", sameSite: "lax" });
    redirect("/admin");
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const sb = await createSupabaseServerClient();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Credenciais inválidas. Verifique o email e a palavra-passe." };
  }
  redirect("/admin");
}

export async function signOutAction() {
  if (isSupabaseConfigured) {
    const sb = await createSupabaseServerClient();
    await sb.auth.signOut();
  } else {
    const jar = await cookies();
    jar.delete("demo-auth");
  }
  redirect("/admin/login");
}
