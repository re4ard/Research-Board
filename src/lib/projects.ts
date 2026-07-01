import type { SupabaseClient, User } from "@supabase/supabase-js";

import type {
  ArticleStatus,
  Bookmark,
  BookmarkComment,
  Profile,
  Project,
  ProjectMember,
  ResearchNotes,
  Tag
} from "@/lib/types";

type AnyRow = Record<string, any>;

function profileFromUser(user: User): Profile {
  return {
    id: user.id,
    email: user.email ?? "",
    name:
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email?.split("@")[0] ??
      "New teammate",
    avatarUrl: user.user_metadata?.avatar_url
  };
}

function profileFromRow(row?: AnyRow): Profile {
  return {
    id: row?.id ?? "unknown",
    email: row?.email ?? "",
    name: row?.name ?? "Unknown teammate",
    avatarUrl: row?.avatar_url ?? undefined
  };
}

export async function ensureProfile(supabase: SupabaseClient, user: User) {
  const profile = profileFromUser(user);

  await supabase.from("profiles").upsert({
    id: profile.id,
    email: profile.email,
    name: profile.name,
    avatar_url: profile.avatarUrl ?? null
  });

  return profile;
}

export async function listProjectsForUser(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("project_members")
    .select("role, projects(id, name, description, invite_slug, created_at)")
    .order("created_at", { ascending: false });

  const projects =
    data?.map((row: AnyRow) => {
      const project = Array.isArray(row.projects) ? row.projects[0] : row.projects;
      if (!project) return null;

      return {
        id: project.id as string,
        name: project.name as string,
        description: project.description as string,
        inviteSlug: project.invite_slug as string,
        role: row.role as string
      };
    }) ?? [];

  return projects.filter(
    (project): project is NonNullable<(typeof projects)[number]> =>
      project !== null
  );
}

export async function loadProject(
  supabase: SupabaseClient,
  projectId: string,
  currentUser: Profile
): Promise<Project | null> {
  const { data: projectRow } = await supabase
    .from("projects")
    .select("id, name, description, invite_slug")
    .eq("id", projectId)
    .maybeSingle();

  if (!projectRow) return null;

  const { data: memberRows } = await supabase
    .from("project_members")
    .select("id, role, user_id")
    .eq("project_id", projectId);

  const { data: bookmarkRows } = await supabase
    .from("bookmarks")
    .select(
      "id, project_id, url, normalized_url, title, description, favicon_url, image_url, site_name, status, summary, main_idea, facts, added_by, created_at, updated_at"
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const bookmarkIds = bookmarkRows?.map((row: AnyRow) => row.id) ?? [];
  const userIds = new Set<string>([
    currentUser.id,
    ...(memberRows?.map((row: AnyRow) => row.user_id as string) ?? []),
    ...(bookmarkRows?.map((row: AnyRow) => row.added_by as string) ?? [])
  ]);

  const { data: commentRows } = bookmarkIds.length
    ? await supabase
        .from("bookmark_comments")
        .select("id, bookmark_id, user_id, body, created_at")
        .in("bookmark_id", bookmarkIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  commentRows?.forEach((row: AnyRow) => userIds.add(row.user_id as string));

  const { data: profileRows } = userIds.size
    ? await supabase
        .from("profiles")
        .select("id, email, name, avatar_url")
        .in("id", Array.from(userIds))
    : { data: [] };

  const profiles = new Map<string, Profile>();
  profileRows?.forEach((row: AnyRow) => profiles.set(row.id, profileFromRow(row)));
  profiles.set(currentUser.id, currentUser);

  const commentsByBookmark = new Map<string, BookmarkComment[]>();
  commentRows?.forEach((row: AnyRow) => {
    const comment: BookmarkComment = {
      id: row.id,
      bookmarkId: row.bookmark_id,
      user: profiles.get(row.user_id) ?? profileFromRow(),
      body: row.body,
      createdAt: row.created_at
    };
    commentsByBookmark.set(row.bookmark_id, [
      ...(commentsByBookmark.get(row.bookmark_id) ?? []),
      comment
    ]);
  });

  const members: ProjectMember[] =
    memberRows?.map((row: AnyRow) => ({
      id: row.id,
      role: row.role,
      profile: profiles.get(row.user_id) ?? profileFromRow()
    })) ?? [];

  const bookmarks: Bookmark[] =
    bookmarkRows?.map((row: AnyRow) => {
      const researchNotes: ResearchNotes = {
        summary: row.summary ?? "",
        mainIdea: row.main_idea ?? "",
        facts: Array.isArray(row.facts) ? row.facts : []
      };
      const tags: Tag[] = [];

      return {
        id: row.id,
        projectId: row.project_id,
        url: row.url,
        normalizedUrl: row.normalized_url,
        title: row.title,
        description: row.description,
        faviconUrl: row.favicon_url ?? undefined,
        imageUrl: row.image_url ?? undefined,
        siteName: row.site_name ?? undefined,
        status: row.status as ArticleStatus,
        researchNotes,
        tags,
        addedBy: profiles.get(row.added_by) ?? currentUser,
        comments: commentsByBookmark.get(row.id) ?? [],
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    }) ?? [];

  return {
    id: projectRow.id,
    name: projectRow.name,
    description: projectRow.description,
    inviteSlug: projectRow.invite_slug,
    members,
    bookmarks
  };
}
