export type MemberRole = "owner" | "admin" | "member";

export type ArticleStatus = "to_read" | "reading" | "done" | "used_in_draft";

export type ViewMode = "gallery" | "kanban";

export type Profile = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

export type ProjectMember = {
  id: string;
  role: MemberRole;
  profile: Profile;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
};

export type BookmarkComment = {
  id: string;
  bookmarkId: string;
  user: Profile;
  body: string;
  createdAt: string;
};

export type ResearchNotes = {
  summary: string;
  mainIdea: string;
  facts: string[];
};

export type Bookmark = {
  id: string;
  projectId: string;
  url: string;
  normalizedUrl: string;
  title: string;
  description: string;
  faviconUrl?: string;
  imageUrl?: string;
  siteName?: string;
  status: ArticleStatus;
  researchNotes: ResearchNotes;
  tags: Tag[];
  addedBy: Profile;
  comments: BookmarkComment[];
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  inviteSlug: string;
  members: ProjectMember[];
  bookmarks: Bookmark[];
};

export type ScrapedMetadata = {
  url: string;
  normalizedUrl: string;
  title: string;
  description: string;
  faviconUrl?: string;
  imageUrl?: string;
  siteName?: string;
};

export const STATUSES: Array<{
  value: ArticleStatus;
  label: string;
  shortLabel: string;
}> = [
  { value: "to_read", label: "To Read", shortLabel: "To Read" },
  { value: "reading", label: "Reading", shortLabel: "Reading" },
  { value: "done", label: "Done", shortLabel: "Done" },
  {
    value: "used_in_draft",
    label: "Used in Draft",
    shortLabel: "Draft"
  }
];
