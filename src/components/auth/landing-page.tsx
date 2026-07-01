import Link from "next/link";
import { ArrowRight, CheckCircle2, LayoutDashboard, Link2, Users } from "lucide-react";

import { signInWithGoogle } from "@/app/auth/actions";

export function LandingPage({
  nextPath = "/app",
  authError,
  demoEnabled
}: {
  nextPath?: string;
  authError?: string;
  demoEnabled: boolean;
}) {
  return (
    <main className="min-h-screen bg-paper text-ink dark:bg-[#181816] dark:text-paper">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-black/60 shadow-sm dark:border-white/10 dark:bg-white/[0.07] dark:text-white/60">
            <Users size={16} />
            Private team workspaces
          </div>

          <div className="space-y-5">
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Collect, organize, and discuss sources with your team.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-black/62 dark:text-white/62">
              Sign in to create projects, save links with metadata, invite teammates,
              and keep reading status, notes, facts, and comments synced.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <form action={signInWithGoogle}>
              <input name="next" type="hidden" value={nextPath} />
              <button className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-ink px-5 text-sm font-semibold text-white transition hover:bg-blue dark:bg-paper dark:text-ink">
                Sign in with Google
                <ArrowRight size={17} />
              </button>
            </form>
            {demoEnabled && (
              <Link
                className="inline-flex h-12 items-center justify-center rounded-md border border-black/10 bg-white px-5 text-sm font-semibold text-ink transition hover:bg-black hover:text-white dark:border-white/10 dark:bg-white/[0.07] dark:text-paper dark:hover:bg-white dark:hover:text-ink"
                href="/app?demo=1"
              >
                Continue locally
              </Link>
            )}
          </div>

          {authError && (
            <p className="max-w-xl rounded-md border border-clay/30 bg-clay/10 px-3 py-2 text-sm font-medium text-clay">
              {authError}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-black/10 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[0.07]">
          <div className="space-y-3 rounded-md border border-black/10 bg-paper p-4 dark:border-white/10 dark:bg-black/10">
            {[
              {
                icon: Link2,
                title: "Save sources",
                text: "Paste a URL and capture title, image, favicon, and snippet."
              },
              {
                icon: LayoutDashboard,
                title: "Plan the work",
                text: "Switch between Gallery and Kanban views with reading status."
              },
              {
                icon: CheckCircle2,
                title: "Preserve evidence",
                text: "Track summaries, main ideas, facts pulled, and team comments."
              }
            ].map((item) => (
              <div
                className="flex gap-3 rounded-md bg-white p-3 shadow-sm dark:bg-white/[0.06]"
                key={item.title}
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-md bg-sage/12 text-sage">
                  <item.icon size={18} />
                </div>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-black/55 dark:text-white/55">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
