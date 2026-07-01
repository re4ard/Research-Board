"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Check,
  Copy,
  Grid2X2,
  KanbanSquare,
  Link2,
  Menu,
  Moon,
  Plus,
  Search,
  SlidersHorizontal,
  Sun,
  Users,
  X
} from "lucide-react";

import { Avatar } from "@/components/avatar";
import { BookmarkCard } from "@/components/bookmark-card";
import { AccountMenu } from "@/components/account-menu";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { ProjectSettingsDialog } from "@/components/projects/project-settings-dialog";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  STATUSES,
  type ArticleStatus,
  type Bookmark,
  type Profile,
  type Project,
  type ResearchNotes,
  type ScrapedMetadata,
  type ViewMode
} from "@/lib/types";
import { cn, normalizeUrl } from "@/lib/utils";

type WorkspaceMessage = {
  type: "bookmarks-updated";
  bookmarks: Bookmark[];
};

const tagPalette = ["#365a8c", "#6f826a", "#b96f5a", "#7b6ba8", "#8a7045"];

function buildBookmark({
  metadata,
  projectId,
  user
}: {
  metadata: ScrapedMetadata;
  projectId: string;
  user: Profile;
}): Bookmark {
  const now = new Date().toISOString();
  const host = new URL(metadata.normalizedUrl).hostname.replace(/^www\./, "");

  return {
    id: crypto.randomUUID(),
    projectId,
    url: metadata.url,
    normalizedUrl: metadata.normalizedUrl,
    title: metadata.title,
    description: metadata.description,
    faviconUrl: metadata.faviconUrl,
    imageUrl: metadata.imageUrl,
    siteName: metadata.siteName ?? host,
    status: "to_read",
    researchNotes: {
      summary: "",
      mainIdea: "",
      facts: []
    },
    tags: [
      {
        id: crypto.randomUUID(),
        name: host.split(".")[0],
        color: tagPalette[Math.floor(Math.random() * tagPalette.length)]
      }
    ],
    addedBy: user,
    comments: [],
    createdAt: now,
    updatedAt: now
  };
}

function fallbackMetadata(urlValue: string): ScrapedMetadata {
  const normalizedUrl = normalizeUrl(urlValue);
  const host = new URL(normalizedUrl).hostname.replace(/^www\./, "");

  return {
    url: normalizedUrl,
    normalizedUrl,
    title: host,
    description:
      "Metadata could not be fetched locally. The saved source is still available to the team.",
    siteName: host,
    faviconUrl: `https://www.google.com/s2/favicons?domain=${host}&sz=64`
  };
}

export function ResearchWorkspace({
  initialProject,
  currentUser,
  appUrl
}: {
  initialProject: Project;
  currentUser: Profile;
  appUrl: string;
}) {
  const [bookmarks, setBookmarks] = useState(initialProject.bookmarks);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | "all">("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [view, setView] = useState<ViewMode>("gallery");
  const [darkMode, setDarkMode] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [syncLabel, setSyncLabel] = useState(
    isSupabaseConfigured() ? "Supabase realtime ready" : "Local realtime ready"
  );
  const [isPending, startTransition] = useTransition();
  const channelRef = useRef<BroadcastChannel | null>(null);
  const noteSaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const project = { ...initialProject, bookmarks };
  const inviteUrl = `${appUrl.replace(/\/$/, "")}/join/${project.inviteSlug}`;

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("workspace-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(storedTheme ? storedTheme === "dark" : prefersDark);
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    document.documentElement.classList.toggle("dark", darkMode);
    window.localStorage.setItem("workspace-theme", darkMode ? "dark" : "light");
  }, [darkMode, themeReady]);

  useEffect(() => {
    return () => {
      Object.values(noteSaveTimers.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    const channel = new BroadcastChannel(`research-board:${project.id}`);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<WorkspaceMessage>) => {
      if (event.data?.type === "bookmarks-updated") {
        setBookmarks(event.data.bookmarks);
        setSyncLabel("Synced just now");
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [project.id]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`project:${project.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `project_id=eq.${project.id}`
        },
        () => setSyncLabel("Database update received")
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmark_comments"
        },
        () => setSyncLabel("Comment update received")
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [project.id]);

  function publish(nextBookmarks: Bookmark[]) {
    setBookmarks(nextBookmarks);
    channelRef.current?.postMessage({
      type: "bookmarks-updated",
      bookmarks: nextBookmarks
    } satisfies WorkspaceMessage);
  }

  const filteredBookmarks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return bookmarks.filter((bookmark) => {
      const matchesStatus =
        statusFilter === "all" || bookmark.status === statusFilter;
      const matchesMember =
        memberFilter === "all" || bookmark.addedBy.id === memberFilter;
      const haystack = [
        bookmark.title,
        bookmark.description,
        bookmark.researchNotes.summary,
        bookmark.researchNotes.mainIdea,
        ...bookmark.researchNotes.facts,
        bookmark.siteName,
        bookmark.addedBy.name,
        bookmark.url,
        ...bookmark.tags.map((tag) => tag.name)
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && matchesMember && haystack.includes(normalizedQuery);
    });
  }, [bookmarks, memberFilter, query, statusFilter]);

  const counts = useMemo(() => {
    return STATUSES.reduce(
      (acc, status) => {
        acc[status.value] = bookmarks.filter(
          (bookmark) => bookmark.status === status.value
        ).length;
        return acc;
      },
      {} as Record<ArticleStatus, number>
    );
  }, [bookmarks]);

  async function addBookmark(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rawUrl = String(formData.get("url") ?? "").trim();
    setError(null);

    if (!rawUrl) return;

    startTransition(async () => {
      try {
        const normalizedUrl = normalizeUrl(rawUrl);

        if (
          bookmarks.some((bookmark) => bookmark.normalizedUrl === normalizedUrl)
        ) {
          setError("This source already exists in the project.");
          return;
        }

        let metadata: ScrapedMetadata;
        const response = await fetch("/api/scrape", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: normalizedUrl })
        });

        if (response.ok) {
          const payload = (await response.json()) as {
            metadata: ScrapedMetadata;
          };
          metadata = payload.metadata;
        } else {
          metadata = fallbackMetadata(normalizedUrl);
        }

        let newBookmark = buildBookmark({
          metadata,
          projectId: project.id,
          user: currentUser
        });
        const supabase = createClient();

        if (supabase) {
          const { data, error } = await supabase
            .from("bookmarks")
            .insert({
              project_id: project.id,
              url: newBookmark.url,
              normalized_url: newBookmark.normalizedUrl,
              title: newBookmark.title,
              description: newBookmark.description,
              favicon_url: newBookmark.faviconUrl ?? null,
              image_url: newBookmark.imageUrl ?? null,
              site_name: newBookmark.siteName ?? null,
              status: newBookmark.status,
              summary: newBookmark.researchNotes.summary,
              main_idea: newBookmark.researchNotes.mainIdea,
              facts: newBookmark.researchNotes.facts,
              added_by: currentUser.id
            })
            .select("id, created_at, updated_at")
            .single();

          if (error) {
            setError(error.message);
            return;
          }

          if (data) {
            newBookmark = {
              ...newBookmark,
              id: data.id,
              createdAt: data.created_at,
              updatedAt: data.updated_at
            };
          }
        }

        const nextBookmarks = [newBookmark, ...bookmarks];

        publish(nextBookmarks);
        setUrlValue("");
        setSyncLabel("Shared with active tabs");
      } catch {
        setError("Enter a complete URL, including https://");
      }
    });
  }

  function updateStatus(id: string, status: ArticleStatus) {
    publish(
      bookmarks.map((bookmark) =>
        bookmark.id === id
          ? { ...bookmark, status, updatedAt: new Date().toISOString() }
          : bookmark
      )
    );

    void createClient()
      ?.from("bookmarks")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
  }

  function updateResearchNotes(id: string, researchNotes: ResearchNotes) {
    publish(
      bookmarks.map((bookmark) =>
        bookmark.id === id
          ? { ...bookmark, researchNotes, updatedAt: new Date().toISOString() }
          : bookmark
      )
    );

    const supabase = createClient();
    if (!supabase) return;

    if (noteSaveTimers.current[id]) {
      clearTimeout(noteSaveTimers.current[id]);
    }

    noteSaveTimers.current[id] = setTimeout(async () => {
      const { error } = await supabase
        .from("bookmarks")
        .update({
          summary: researchNotes.summary,
          main_idea: researchNotes.mainIdea,
          facts: researchNotes.facts,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) {
        setError(error.message);
      }
    }, 450);
  }

  async function addComment(id: string, body: string) {
    const temporaryId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const optimistic = bookmarks.map((bookmark) =>
        bookmark.id === id
          ? {
              ...bookmark,
              updatedAt: createdAt,
              comments: [
                ...bookmark.comments,
                {
                  id: temporaryId,
                  bookmarkId: id,
                  user: currentUser,
                  body,
                  createdAt
                }
              ]
            }
          : bookmark
      );

    publish(optimistic);

    const supabase = createClient();
    if (!supabase) return;

    const { data, error } = await supabase
      .from("bookmark_comments")
      .insert({
        bookmark_id: id,
        user_id: currentUser.id,
        body
      })
      .select("id, created_at")
      .single();

    if (error) {
      setError(error.message);
      publish(bookmarks);
      return;
    }

    if (data) {
      publish(
        optimistic.map((bookmark) =>
          bookmark.id === id
            ? {
                ...bookmark,
                comments: bookmark.comments.map((comment) =>
                  comment.id === temporaryId
                    ? {
                        ...comment,
                        id: data.id,
                        createdAt: data.created_at
                      }
                    : comment
                )
              }
            : bookmark
        )
      );
    }
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="min-h-screen text-ink dark:text-paper">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 border-r border-black/10 bg-paper/95 p-4 backdrop-blur transition-transform dark:border-white/10 dark:bg-[#181816]/95 lg:static lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between">
            <ProjectSettingsDialog project={project} />
            <button
              aria-label="Close sidebar"
              className="grid size-8 place-items-center rounded-md border border-black/10 lg:hidden dark:border-white/10"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between px-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-black/40 dark:text-white/40">
                Projects
              </p>
              <CreateProjectDialog compact />
            </div>
            <button className="flex w-full items-center justify-between rounded-lg bg-white px-3 py-3 text-left shadow-sm ring-1 ring-black/10 dark:bg-white/[0.07] dark:ring-white/10">
              <span>
                <span className="block text-sm font-semibold">{project.name}</span>
                <span className="block text-xs text-black/50 dark:text-white/50">
                  {bookmarks.length} sources
                </span>
              </span>
              <span className="rounded-md bg-sage/12 px-2 py-1 text-xs font-medium text-sage">
                Active
              </span>
            </button>
          </div>

          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between px-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-black/40 dark:text-white/40">
                Team
              </p>
              <button
                aria-label="Invite members"
                className="grid size-7 place-items-center rounded-md border border-black/10 hover:bg-white dark:border-white/10 dark:hover:bg-white/10"
                onClick={() => setInviteOpen(true)}
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {project.members.map((member) => (
                <div
                  className="flex items-center gap-3 rounded-md px-2 py-2"
                  key={member.id}
                >
                  <Avatar profile={member.profile} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {member.profile.name}
                    </p>
                    <p className="text-xs capitalize text-black/45 dark:text-white/45">
                      {member.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-2">
            {STATUSES.map((status) => (
              <div
                className="rounded-lg border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/[0.06]"
                key={status.value}
              >
                <p className="text-xl font-semibold">{counts[status.value]}</p>
                <p className="text-xs text-black/50 dark:text-white/50">
                  {status.shortLabel}
                </p>
              </div>
            ))}
          </div>
        </aside>

        {sidebarOpen && (
          <button
            aria-label="Close navigation overlay"
            className="fixed inset-0 z-30 bg-black/25 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-black/10 bg-paper/85 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-[#181816]/85 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  aria-label="Open sidebar"
                  className="grid size-9 place-items-center rounded-md border border-black/10 lg:hidden dark:border-white/10"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu size={18} />
                </button>
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-semibold sm:text-2xl">
                    {project.name}
                  </h1>
                  <p className="truncate text-sm text-black/50 dark:text-white/50">
                    {project.description}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <div className="hidden items-center -space-x-2 sm:flex">
                  {project.members.map((member) => (
                    <Avatar
                      className="ring-2 ring-paper dark:ring-[#181816]"
                      key={member.id}
                      profile={member.profile}
                    />
                  ))}
                </div>
                <button
                  aria-label="Invite members"
                  className="hidden h-9 items-center gap-2 rounded-md border border-black/10 bg-white px-3 text-sm font-medium hover:bg-black hover:text-white dark:border-white/10 dark:bg-white/[0.07] dark:hover:bg-white dark:hover:text-ink sm:flex"
                  onClick={() => setInviteOpen(true)}
                >
                  <Users size={16} />
                  Invite
                </button>
                <CreateProjectDialog />
                <AccountMenu profile={currentUser} />
                <button
                  aria-label="Toggle color theme"
                  className="grid size-9 place-items-center rounded-md border border-black/10 bg-white hover:bg-black hover:text-white dark:border-white/10 dark:bg-white/[0.07] dark:hover:bg-white dark:hover:text-ink"
                  onClick={() => setDarkMode((value) => !value)}
                >
                  {darkMode ? <Sun size={17} /> : <Moon size={17} />}
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
            <form
              className="flex flex-col gap-3 rounded-lg border border-black/10 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.07] sm:flex-row"
              onSubmit={addBookmark}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-black/10 px-3 dark:border-white/10">
                <Link2 className="shrink-0 text-black/45 dark:text-white/45" size={17} />
                <input
                  className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-black/35 dark:placeholder:text-white/35"
                  name="url"
                  placeholder="https://example.com/article"
                  type="url"
                  value={urlValue}
                  onChange={(event) => setUrlValue(event.target.value)}
                />
              </div>
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-blue disabled:cursor-not-allowed disabled:opacity-60 dark:bg-paper dark:text-ink"
                disabled={isPending}
              >
                <Plus size={17} />
                {isPending ? "Saving" : "Add source"}
              </button>
            </form>
            {error && (
              <p className="mt-2 text-sm font-medium text-clay">{error}</p>
            )}

            <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 shadow-sm dark:border-white/10 dark:bg-white/[0.07]">
                <Search className="shrink-0 text-black/45 dark:text-white/45" size={18} />
                <input
                  className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-black/35 dark:placeholder:text-white/35"
                  placeholder="Search title, tags, notes, or contributor"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="hidden items-center gap-2 rounded-lg border border-black/10 bg-white px-3 shadow-sm dark:border-white/10 dark:bg-white/[0.07] sm:flex">
                  <SlidersHorizontal size={16} className="text-black/45 dark:text-white/45" />
                </label>
                <DropdownSelect
                  ariaLabel="Filter by status"
                  options={[
                    { value: "all", label: "All statuses" },
                    ...STATUSES.map((status) => ({
                      value: status.value,
                      label: status.label
                    }))
                  ]}
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value as ArticleStatus | "all")}
                />

                <label className="hidden items-center gap-2 rounded-lg border border-black/10 bg-white px-3 shadow-sm dark:border-white/10 dark:bg-white/[0.07] sm:flex">
                  <Users size={16} className="text-black/45 dark:text-white/45" />
                </label>
                <DropdownSelect
                  ariaLabel="Filter by contributor"
                  options={[
                    { value: "all", label: "All people" },
                    ...project.members.map((member) => ({
                      value: member.profile.id,
                      label: member.profile.name
                    }))
                  ]}
                  value={memberFilter}
                  onChange={setMemberFilter}
                />

                <div className="grid h-11 grid-cols-2 rounded-lg border border-black/10 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-white/[0.07]">
                  <button
                    aria-label="Gallery view"
                    className={cn(
                      "grid size-9 place-items-center rounded-md text-black/55 dark:text-white/55",
                      view === "gallery" &&
                        "bg-ink text-white dark:bg-paper dark:text-ink"
                    )}
                    type="button"
                    onClick={() => setView("gallery")}
                  >
                    <Grid2X2 size={17} />
                  </button>
                  <button
                    aria-label="Kanban view"
                    className={cn(
                      "grid size-9 place-items-center rounded-md text-black/55 dark:text-white/55",
                      view === "kanban" &&
                        "bg-ink text-white dark:bg-paper dark:text-ink"
                    )}
                    type="button"
                    onClick={() => setView("kanban")}
                  >
                    <KanbanSquare size={17} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5">
              {view === "gallery" ? (
                <GalleryView
                  bookmarks={filteredBookmarks}
                  onCommentAdd={addComment}
                  onStatusChange={updateStatus}
                  onResearchNotesChange={updateResearchNotes}
                />
              ) : (
                <KanbanView
                  bookmarks={filteredBookmarks}
                  onCommentAdd={addComment}
                  onStatusChange={updateStatus}
                  onResearchNotesChange={updateResearchNotes}
                />
              )}
            </div>
          </div>
        </section>
      </div>

      {inviteOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
          <div className="w-full max-w-md rounded-lg border border-black/10 bg-paper p-5 shadow-soft dark:border-white/10 dark:bg-[#20201d]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Invite teammates</h2>
                <p className="mt-1 text-sm text-black/55 dark:text-white/55">
                  {project.name}
                </p>
              </div>
              <button
                aria-label="Close invite dialog"
                className="grid size-8 place-items-center rounded-md border border-black/10 dark:border-white/10"
                onClick={() => setInviteOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block text-sm font-medium">Email address</label>
              <div className="flex gap-2">
                <input
                  className="h-11 min-w-0 flex-1 rounded-md border border-black/10 bg-white px-3 text-sm outline-none focus:border-sage dark:border-white/10 dark:bg-white/5"
                  placeholder="teammate@example.edu"
                  type="email"
                />
                <button className="rounded-md bg-ink px-4 text-sm font-semibold text-white dark:bg-paper dark:text-ink">
                  Send
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-md border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-wide text-black/40 dark:text-white/40">
                Share link
              </p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
                  readOnly
                  value={inviteUrl}
                />
                <button
                  aria-label="Copy invite link"
                  className="grid size-10 place-items-center rounded-md border border-black/10 hover:bg-black hover:text-white dark:border-white/10 dark:hover:bg-white dark:hover:text-ink"
                  onClick={copyInvite}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function GalleryView({
  bookmarks,
  onStatusChange,
  onResearchNotesChange,
  onCommentAdd
}: {
  bookmarks: Bookmark[];
  onStatusChange: (id: string, status: ArticleStatus) => void;
  onResearchNotesChange: (id: string, researchNotes: ResearchNotes) => void;
  onCommentAdd: (id: string, body: string) => void;
}) {
  if (bookmarks.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {bookmarks.map((bookmark) => (
        <BookmarkCard
          bookmark={bookmark}
          key={bookmark.id}
          onCommentAdd={onCommentAdd}
          onStatusChange={onStatusChange}
          onResearchNotesChange={onResearchNotesChange}
        />
      ))}
    </div>
  );
}

function KanbanView({
  bookmarks,
  onStatusChange,
  onResearchNotesChange,
  onCommentAdd
}: {
  bookmarks: Bookmark[];
  onStatusChange: (id: string, status: ArticleStatus) => void;
  onResearchNotesChange: (id: string, researchNotes: ResearchNotes) => void;
  onCommentAdd: (id: string, body: string) => void;
}) {
  return (
    <div className="scrollbar-thin -mx-4 flex gap-4 overflow-x-auto px-4 pb-3">
      {STATUSES.map((status) => {
        const columnBookmarks = bookmarks.filter(
          (bookmark) => bookmark.status === status.value
        );

        return (
          <section
            className="min-w-[18rem] flex-1 rounded-lg border border-black/10 bg-black/[0.025] p-3 dark:border-white/10 dark:bg-white/[0.04]"
            key={status.value}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">{status.label}</h2>
              <span className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs text-black/55 dark:border-white/10 dark:bg-white/[0.07] dark:text-white/55">
                {columnBookmarks.length}
              </span>
            </div>
            <div className="space-y-3">
              {columnBookmarks.map((bookmark) => (
                <BookmarkCard
                  compact
                  bookmark={bookmark}
                  key={bookmark.id}
                  onCommentAdd={onCommentAdd}
                  onStatusChange={onStatusChange}
                  onResearchNotesChange={onResearchNotesChange}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-black/15 bg-white/50 p-6 text-center dark:border-white/15 dark:bg-white/[0.04]">
      <div>
        <div className="mx-auto grid size-11 place-items-center rounded-lg bg-sage/12 text-sage">
          <Search size={20} />
        </div>
        <h2 className="mt-3 text-base font-semibold">No matching sources</h2>
        <p className="mt-1 text-sm text-black/55 dark:text-white/55">
          Adjust search or filters to bring items back into view.
        </p>
      </div>
    </div>
  );
}
