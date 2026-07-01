"use client";

import { useState } from "react";
import { LogOut, Pencil, ShieldAlert, Trash2, User, X } from "lucide-react";

import { deleteAccount, updateAccountName } from "@/app/app/project-actions";
import { signOut } from "@/app/auth/actions";
import { Avatar } from "@/components/avatar";
import type { Profile } from "@/lib/types";

export function AccountMenu({
  profile,
  align = "right"
}: {
  profile: Profile;
  align?: "right" | "left";
}) {
  const [open, setOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="relative">
      <button
        aria-label="Open account menu"
        className="grid size-9 place-items-center rounded-md border border-black/10 bg-white hover:bg-black hover:text-white dark:border-white/10 dark:bg-white/[0.07] dark:hover:bg-white dark:hover:text-ink"
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar className="size-7 border-0 shadow-none" profile={profile} />
      </button>

      {open && (
        <div
          className={`absolute top-11 z-50 w-80 rounded-lg border border-black/10 bg-paper p-3 shadow-soft dark:border-white/10 dark:bg-[#20201d] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="flex items-start justify-between gap-3 border-b border-black/10 pb-3 dark:border-white/10">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar profile={profile} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{profile.name}</p>
                <p className="truncate text-xs text-black/50 dark:text-white/50">
                  {profile.email}
                </p>
              </div>
            </div>
            <button
              aria-label="Close account menu"
              className="grid size-7 place-items-center rounded-md border border-black/10 text-black/45 hover:bg-white dark:border-white/10 dark:text-white/45 dark:hover:bg-white/10"
              type="button"
              onClick={() => setOpen(false)}
            >
              <X size={14} />
            </button>
          </div>

          <div className="mt-3 space-y-2">
            <button
              className="flex h-10 w-full items-center gap-2 rounded-md px-2 text-sm font-medium text-black/65 hover:bg-white dark:text-white/65 dark:hover:bg-white/10"
              type="button"
              onClick={() => setEditingName((value) => !value)}
            >
              <Pencil size={15} />
              Change account name
            </button>

            {editingName && (
              <form action={updateAccountName} className="space-y-2 rounded-md border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-white/5">
                <label className="sr-only" htmlFor="account-name">
                  Account name
                </label>
                <input
                  className="h-10 w-full rounded-md border border-black/10 bg-paper px-3 text-sm outline-none focus:border-sage dark:border-white/10 dark:bg-black/10"
                  defaultValue={profile.name}
                  id="account-name"
                  name="name"
                  required
                />
                <button className="h-9 w-full rounded-md bg-ink px-3 text-sm font-semibold text-white hover:bg-blue dark:bg-paper dark:text-ink">
                  Save name
                </button>
              </form>
            )}

            <form action={signOut}>
              <button className="flex h-10 w-full items-center gap-2 rounded-md px-2 text-sm font-medium text-black/65 hover:bg-white dark:text-white/65 dark:hover:bg-white/10">
                <LogOut size={15} />
                Sign out
              </button>
            </form>

            <button
              className="flex h-10 w-full items-center gap-2 rounded-md px-2 text-sm font-medium text-clay hover:bg-clay/10"
              type="button"
              onClick={() => setConfirmDelete((value) => !value)}
            >
              <Trash2 size={15} />
              Delete account
            </button>

            {confirmDelete && (
              <div className="rounded-md border border-clay/30 bg-clay/10 p-3">
                <div className="flex gap-2 text-sm font-medium text-clay">
                  <ShieldAlert className="mt-0.5 shrink-0" size={16} />
                  This permanently deletes your account and removes you from workspaces.
                </div>
                <form action={deleteAccount} className="mt-3">
                  <button className="h-9 w-full rounded-md bg-clay px-3 text-sm font-semibold text-white">
                    Delete my account
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
