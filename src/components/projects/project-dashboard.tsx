import Link from "next/link";
import { ArrowRight, FolderKanban } from "lucide-react";

import { AccountMenu } from "@/components/account-menu";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import type { Profile } from "@/lib/types";

export type ProjectListItem = {
  id: string;
  name: string;
  description: string;
  inviteSlug: string;
  role: string;
};

export function ProjectDashboard({
  projects,
  error,
  profile
}: {
  projects: ProjectListItem[];
  error?: string;
  profile: Profile;
}) {
  return (
    <main className="min-h-screen bg-paper px-5 py-6 text-ink dark:bg-[#181816] dark:text-paper">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-4 border-b border-black/10 pb-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-black/45 dark:text-white/45">
              Signed in
            </p>
            <h1 className="mt-1 text-3xl font-semibold">Projects</h1>
          </div>
          <div className="flex gap-2">
            <CreateProjectDialog />
            <AccountMenu profile={profile} />
          </div>
        </header>

        {error && (
          <p className="mt-4 rounded-md border border-clay/30 bg-clay/10 px-3 py-2 text-sm font-medium text-clay">
            {error}
          </p>
        )}

        {projects.length === 0 ? (
          <section className="mt-8 grid min-h-96 place-items-center rounded-lg border border-dashed border-black/15 bg-white/55 p-8 text-center dark:border-white/15 dark:bg-white/[0.04]">
            <div className="max-w-md">
              <div className="mx-auto grid size-12 place-items-center rounded-lg bg-sage/12 text-sage">
                <FolderKanban size={22} />
              </div>
              <h2 className="mt-4 text-xl font-semibold">Create your first project</h2>
              <p className="mt-2 text-sm leading-6 text-black/55 dark:text-white/55">
                Projects are shared folders for links, notes, comments, reading status,
                and invite links.
              </p>
              <div className="mt-5 flex justify-center">
                <CreateProjectDialog />
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-6 grid gap-3">
            {projects.map((project) => (
              <Link
                className="group flex items-center justify-between gap-4 rounded-lg border border-black/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft dark:border-white/10 dark:bg-white/[0.07]"
                href={`/app/projects/${project.id}`}
                key={project.id}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-base font-semibold">
                      {project.name}
                    </h2>
                    <span className="rounded-md bg-sage/12 px-2 py-1 text-xs font-medium capitalize text-sage">
                      {project.role}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-black/55 dark:text-white/55">
                    {project.description || "No description yet"}
                  </p>
                </div>
                <ArrowRight
                  className="shrink-0 text-black/35 transition group-hover:text-ink dark:text-white/35 dark:group-hover:text-paper"
                  size={18}
                />
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
