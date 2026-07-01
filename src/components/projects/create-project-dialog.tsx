"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { createProject } from "@/app/app/project-actions";

export function CreateProjectDialog({
  compact = false
}: {
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className={
          compact
            ? "grid size-7 place-items-center rounded-md border border-black/10 hover:bg-white dark:border-white/10 dark:hover:bg-white/10"
            : "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-blue dark:bg-paper dark:text-ink"
        }
        type="button"
        onClick={() => setOpen(true)}
      >
        <Plus size={compact ? 14 : 17} />
        {!compact && "Create new project"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
          <div className="w-full max-w-md rounded-lg border border-black/10 bg-paper p-5 shadow-soft dark:border-white/10 dark:bg-[#20201d]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Create new project</h2>
                <p className="mt-1 text-sm text-black/55 dark:text-white/55">
                  Start a shareable workspace for a team or class group.
                </p>
              </div>
              <button
                aria-label="Close create project dialog"
                className="grid size-8 place-items-center rounded-md border border-black/10 dark:border-white/10"
                type="button"
                onClick={() => setOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form action={createProject} className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="project-name">
                  Project name
                </label>
                <input
                  className="h-11 w-full rounded-md border border-black/10 bg-white px-3 text-sm outline-none focus:border-sage dark:border-white/10 dark:bg-white/5"
                  id="project-name"
                  name="name"
                  placeholder="History paper sources"
                  required
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="project-description"
                >
                  Description
                </label>
                <textarea
                  className="min-h-24 w-full resize-none rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-sage dark:border-white/10 dark:bg-white/5"
                  id="project-description"
                  name="description"
                  placeholder="Shared reading board for the draft."
                />
              </div>
              <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-blue dark:bg-paper dark:text-ink">
                <Plus size={17} />
                Create project
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
