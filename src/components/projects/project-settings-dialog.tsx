"use client";

import { useState } from "react";
import { Settings, Trash2, X } from "lucide-react";

import {
  deleteProject,
  updateProjectDetails
} from "@/app/app/project-actions";
import type { Project } from "@/lib/types";

export function ProjectSettingsDialog({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <button
        className="flex w-full items-center gap-3 rounded-lg border border-black/10 bg-white px-3 py-3 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-black/20 hover:shadow-soft dark:border-white/10 dark:bg-white/[0.07] dark:hover:border-white/20"
        type="button"
        onClick={() => setOpen(true)}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-sage/12 text-sage">
          <Settings size={18} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold">Settings</span>
          <span className="block truncate text-xs text-black/50 dark:text-white/50">
            Project, theme, sharing
          </span>
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4 backdrop-blur-sm animate-in">
          <div className="w-full max-w-lg rounded-lg border border-black/10 bg-paper p-5 shadow-soft dark:border-white/10 dark:bg-[#20201d]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Project settings</h2>
                <p className="mt-1 text-sm text-black/55 dark:text-white/55">
                  Edit workspace details or remove the project.
                </p>
              </div>
              <button
                aria-label="Close project settings"
                className="grid size-8 place-items-center rounded-md border border-black/10 transition hover:bg-white dark:border-white/10 dark:hover:bg-white/10"
                type="button"
                onClick={() => setOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form action={updateProjectDetails} className="mt-5 space-y-4">
              <input name="projectId" type="hidden" value={project.id} />
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="project-settings-name">
                  Project name
                </label>
                <input
                  className="h-11 w-full rounded-md border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20 dark:border-white/10 dark:bg-white/5"
                  defaultValue={project.name}
                  id="project-settings-name"
                  name="name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="project-settings-description"
                >
                  Description
                </label>
                <textarea
                  className="min-h-24 w-full resize-none rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20 dark:border-white/10 dark:bg-white/5"
                  defaultValue={project.description}
                  id="project-settings-description"
                  name="description"
                />
              </div>
              <button className="h-10 w-full rounded-md bg-ink px-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue hover:shadow-soft dark:bg-paper dark:text-ink">
                Save project
              </button>
            </form>

            <div className="mt-5 rounded-md border border-clay/25 bg-clay/10 p-3">
              <button
                className="flex h-10 w-full items-center justify-between rounded-md px-2 text-sm font-semibold text-clay transition hover:bg-clay/10"
                type="button"
                onClick={() => setConfirmDelete((value) => !value)}
              >
                <span className="inline-flex items-center gap-2">
                  <Trash2 size={15} />
                  Delete project
                </span>
                <span>{confirmDelete ? "Cancel" : "Open"}</span>
              </button>

              {confirmDelete && (
                <form action={deleteProject} className="mt-3">
                  <input name="projectId" type="hidden" value={project.id} />
                  <p className="mb-3 text-sm leading-6 text-clay">
                    This deletes the project, saved links, notes, and comments for every member.
                  </p>
                  <button className="h-10 w-full rounded-md bg-clay px-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-soft">
                    Permanently delete project
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
