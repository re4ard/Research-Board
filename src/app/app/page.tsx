import { redirect } from "next/navigation";

import { ProjectDashboard } from "@/components/projects/project-dashboard";
import { ResearchWorkspace } from "@/components/research-workspace";
import { currentUserId, demoProject } from "@/lib/mock-data";
import { ensureProfile, listProjectsForUser } from "@/lib/projects";
import { createClient } from "@/lib/supabase/server";

export default async function AppHome({
  searchParams
}: {
  searchParams: Promise<{
    demo?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  if (!supabase) {
    const currentUser =
      demoProject.members.find((member) => member.profile.id === currentUserId)
        ?.profile ?? demoProject.members[0].profile;

    return (
      <ResearchWorkspace
        appUrl="http://127.0.0.1:3000"
        currentUser={currentUser}
        initialProject={demoProject}
      />
    );
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/?next=${encodeURIComponent("/app")}`);
  }

  const currentUser = await ensureProfile(supabase, user);
  const projects = await listProjectsForUser(supabase);

  return (
    <ProjectDashboard
      error={params.error}
      profile={currentUser}
      projects={projects}
    />
  );
}
