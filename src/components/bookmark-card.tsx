"use client";

import type { FormEvent } from "react";
import {
  BookOpenText,
  ExternalLink,
  Lightbulb,
  ListChecks,
  MessageSquare,
  MoreHorizontal,
  Plus,
  X
} from "lucide-react";

import { Avatar } from "@/components/avatar";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import {
  STATUSES,
  type ArticleStatus,
  type Bookmark,
  type ResearchNotes
} from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

const statusClassNames: Record<ArticleStatus, string> = {
  to_read: "border-blue/20 bg-blue/10 text-blue dark:text-blue-100",
  reading: "border-clay/25 bg-clay/10 text-clay dark:text-orange-100",
  done: "border-sage/25 bg-sage/10 text-sage dark:text-emerald-100",
  used_in_draft: "border-black/10 bg-ink text-white dark:border-white/10"
};

export function BookmarkCard({
  bookmark,
  compact = false,
  onStatusChange,
  onResearchNotesChange,
  onCommentAdd
}: {
  bookmark: Bookmark;
  compact?: boolean;
  onStatusChange: (id: string, status: ArticleStatus) => void;
  onResearchNotesChange: (id: string, researchNotes: ResearchNotes) => void;
  onCommentAdd: (id: string, body: string) => Promise<void> | void;
}) {
  const status = STATUSES.find((item) => item.value === bookmark.status);
  const researchNotes = bookmark.researchNotes;

  async function handleComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body = String(formData.get("comment") ?? "").trim();
    if (!body) return;
    await onCommentAdd(bookmark.id, body);
    form.reset();
  }

  function updateResearchNotes(patch: Partial<ResearchNotes>) {
    onResearchNotesChange(bookmark.id, {
      ...researchNotes,
      ...patch
    });
  }

  function updateFact(index: number, value: string) {
    updateResearchNotes({
      facts: researchNotes.facts.map((fact, factIndex) =>
        factIndex === index ? value : fact
      )
    });
  }

  function addFact() {
    updateResearchNotes({
      facts: [...researchNotes.facts, ""]
    });
  }

  function removeFact(index: number) {
    updateResearchNotes({
      facts: researchNotes.facts.filter((_, factIndex) => factIndex !== index)
    });
  }

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft dark:border-white/10 dark:bg-white/[0.07]",
        compact && "hover:translate-y-0"
      )}
    >
      {!compact && (
        <a
          aria-label={`Open ${bookmark.title}`}
          className="block h-36 overflow-hidden bg-line dark:bg-white/5"
          href={bookmark.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          {bookmark.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              src={bookmark.imageUrl}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-black/40 dark:text-white/40">
              {bookmark.siteName ?? new URL(bookmark.url).hostname}
            </div>
          )}
        </a>
      )}

      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex min-w-0 items-center gap-2 text-xs text-black/55 dark:text-white/55">
              {bookmark.faviconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="size-4 rounded-sm"
                  src={bookmark.faviconUrl}
                />
              ) : (
                <span className="size-2 rounded-full bg-sage" />
              )}
              <span className="truncate">{bookmark.siteName}</span>
            </div>
            <a
              className="line-clamp-2 text-base font-semibold leading-snug text-ink hover:text-blue dark:text-paper"
              href={bookmark.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {bookmark.title}
            </a>
          </div>
          <a
            aria-label={`Open ${bookmark.title}`}
            className="grid size-8 shrink-0 place-items-center rounded-md border border-black/10 text-black/50 hover:bg-black hover:text-white dark:border-white/10 dark:text-white/60 dark:hover:bg-white dark:hover:text-ink"
            href={bookmark.url}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLink size={16} />
          </a>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-black/62 dark:text-white/62">
          {bookmark.description}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <DropdownSelect
            ariaLabel="Article status"
            buttonClassName={cn("h-8 min-w-32 px-2 text-xs", statusClassNames[bookmark.status])}
            options={STATUSES.map((item) => ({
              value: item.value,
              label: item.label
            }))}
            value={bookmark.status}
            onChange={(value) => onStatusChange(bookmark.id, value)}
          />
          {bookmark.tags.map((tag) => (
            <span
              className="rounded-md border border-black/10 px-2 py-1 text-xs font-medium text-black/60 dark:border-white/10 dark:text-white/60"
              key={tag.id}
              style={{ borderColor: `${tag.color}55`, color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>

        <div className="space-y-3 rounded-md border border-black/10 bg-paper/65 p-3 dark:border-white/10 dark:bg-black/10">
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-black/45 dark:text-white/45">
              <BookOpenText size={14} />
              Research notes
            </label>
            <span className="rounded-md border border-black/10 bg-white px-2 py-1 text-[11px] font-medium text-black/45 dark:border-white/10 dark:bg-white/5 dark:text-white/45">
              Summary + facts
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-black/55 dark:text-white/55">
              Expanded summary
            </label>
            <textarea
              className="min-h-24 w-full resize-none rounded-md border border-black/10 bg-white px-3 py-2 text-sm leading-6 text-ink outline-none placeholder:text-black/35 focus:border-sage dark:border-white/10 dark:bg-white/5 dark:text-paper dark:placeholder:text-white/35"
              placeholder="Write a fuller source summary: argument, scope, methods, and why it matters."
              value={researchNotes.summary}
              onChange={(event) =>
                updateResearchNotes({ summary: event.target.value })
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-black/55 dark:text-white/55">
              <Lightbulb size={13} />
              Main idea
            </label>
            <textarea
              className="min-h-16 w-full resize-none rounded-md border border-black/10 bg-white px-3 py-2 text-sm leading-6 text-ink outline-none placeholder:text-black/35 focus:border-sage dark:border-white/10 dark:bg-white/5 dark:text-paper dark:placeholder:text-white/35"
              placeholder="Capture the one sentence claim or idea this source contributes."
              value={researchNotes.mainIdea}
              onChange={(event) =>
                updateResearchNotes({ mainIdea: event.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-black/55 dark:text-white/55">
                <ListChecks size={13} />
                Facts pulled
              </label>
              <button
                className="inline-flex h-7 items-center gap-1 rounded-md border border-black/10 bg-white px-2 text-xs font-medium text-black/60 hover:bg-black hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white dark:hover:text-ink"
                type="button"
                onClick={addFact}
              >
                <Plus size={13} />
                Fact
              </button>
            </div>
            <div className="space-y-2">
              {researchNotes.facts.length === 0 && (
                <p className="rounded-md border border-dashed border-black/10 px-3 py-2 text-xs text-black/45 dark:border-white/10 dark:text-white/45">
                  Add statistics, dates, claims, definitions, or evidence pulled from the source.
                </p>
              )}
              {researchNotes.facts.map((fact, index) => (
                <div className="flex items-start gap-2" key={index}>
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-sage" />
                  <textarea
                    aria-label={`Fact ${index + 1}`}
                    className="min-h-10 flex-1 resize-none rounded-md border border-black/10 bg-white px-3 py-2 text-sm leading-5 text-ink outline-none placeholder:text-black/35 focus:border-sage dark:border-white/10 dark:bg-white/5 dark:text-paper dark:placeholder:text-white/35"
                    placeholder="Add a fact, number, quote note, or citation detail"
                    value={fact}
                    onChange={(event) => updateFact(index, event.target.value)}
                  />
                  <button
                    aria-label={`Remove fact ${index + 1}`}
                    className="grid size-9 shrink-0 place-items-center rounded-md border border-black/10 text-black/45 hover:bg-clay hover:text-white dark:border-white/10 dark:text-white/45"
                    type="button"
                    onClick={() => removeFact(index)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-black/10 pt-3 text-xs text-black/55 dark:border-white/10 dark:text-white/55">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar profile={bookmark.addedBy} />
            <span className="truncate">Added by {bookmark.addedBy.name}</span>
          </div>
          <span className="shrink-0">{formatDateTime(bookmark.createdAt)}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-black/50 dark:text-white/50">
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare size={14} />
              {bookmark.comments.length} comments
            </span>
            <MoreHorizontal size={16} />
          </div>
          {bookmark.comments.slice(-2).map((comment) => (
            <div
              className="rounded-md bg-black/[0.035] px-3 py-2 text-sm text-black/65 dark:bg-white/[0.06] dark:text-white/65"
              key={comment.id}
            >
              <span className="font-medium text-ink dark:text-paper">
                {comment.user.name}:{" "}
              </span>
              {comment.body}
            </div>
          ))}
          <form className="flex gap-2" onSubmit={handleComment}>
            <input
              className="h-9 min-w-0 flex-1 rounded-md border border-black/10 bg-white px-3 text-sm outline-none transition placeholder:text-black/35 focus:border-sage dark:border-white/10 dark:bg-white/5 dark:placeholder:text-white/35"
              name="comment"
              placeholder="Add comment"
            />
            <button className="grid size-9 shrink-0 place-items-center rounded-md bg-ink text-white hover:bg-blue dark:bg-paper dark:text-ink">
              <MessageSquare size={15} />
            </button>
          </form>
        </div>

        <span className="sr-only">{status?.label}</span>
      </div>
    </article>
  );
}
