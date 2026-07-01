import { notFound, redirect } from "next/navigation";

import { ResearchWorkspace } from "@/components/research-workspace";
import { currentUserId, demoProject } from "@/lib/mock-data";
import { ensureProfile, loadProject } from "@/lib/projects";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectPage({
  params
}: {
  params: Promise<{
    projectId: string;
  }>;
}) {
  const { projectId } = await params;
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
    redirect(`/?next=${encodeURIComponent(`/app/projects/${projectId}`)}`);
  }

  const currentUser = await ensureProfile(supabase, user);
  const project = await loadProject(supabase, projectId, currentUser);

  if (!project) {
    notFound();
  }

  return (
    <ResearchWorkspace
      appUrl={process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000"}
      currentUser={currentUser}
      initialProject={project}
    />
  );
}
