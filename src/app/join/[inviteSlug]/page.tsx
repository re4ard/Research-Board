import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { LandingPage } from "@/components/auth/landing-page";
import { ensureProfile } from "@/lib/projects";
import { createClient } from "@/lib/supabase/server";

export default async function JoinPage({
  params
}: {
  params: Promise<{
    inviteSlug: string;
  }>;
}) {
  const { inviteSlug } = await params;
  const nextPath = `/join/${inviteSlug}`;
  const supabase = await createClient();

  if (!supabase) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper p-5 text-ink dark:bg-[#181816] dark:text-paper">
        <div className="max-w-md rounded-lg border border-black/10 bg-white p-6 text-center shadow-soft dark:border-white/10 dark:bg-white/[0.07]">
          <h1 className="text-2xl font-semibold">Invite links need auth</h1>
          <p className="mt-3 text-sm leading-6 text-black/55 dark:text-white/55">
            Configure Supabase and Google OAuth to accept invite links across accounts.
            You can still open the local demo workspace.
          </p>
          <Link
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white dark:bg-paper dark:text-ink"
            href="/app?demo=1"
          >
            Open local demo
            <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return <LandingPage demoEnabled={false} nextPath={nextPath} />;
  }

  await ensureProfile(supabase, user);
  const { data: projectId, error } = await supabase.rpc("accept_project_invite", {
    invite_slug_param: inviteSlug
  });

  if (error || !projectId) {
    redirect(`/app?error=${encodeURIComponent(error?.message ?? "Invite link is invalid or expired")}`);
  }

  redirect(`/app/projects/${projectId}`);
}
