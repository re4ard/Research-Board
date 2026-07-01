"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function normalizeNext(value: FormDataEntryValue | null) {
  const fallback = "/app";
  const next = typeof value === "string" && value.startsWith("/") ? value : fallback;
  return next.startsWith("//") ? fallback : next;
}

async function appOrigin() {
  const headerStore = await headers();
  return (
    headerStore.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://127.0.0.1:3000"
  );
}

export async function signInWithGoogle(formData: FormData) {
  const next = normalizeNext(formData.get("next"));
  const supabase = await createClient();

  if (!supabase) {
    redirect(`/app?demo=1&next=${encodeURIComponent(next)}`);
  }

  const origin = await appOrigin();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`
    }
  });

  if (error || !data.url) {
    redirect(`/?authError=${encodeURIComponent(error?.message ?? "Unable to start Google sign-in.")}`);
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/");
}
