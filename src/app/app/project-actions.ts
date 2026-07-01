"use server";

import { redirect } from "next/navigation";

import { ensureProfile } from "@/lib/projects";
import { createClient } from "@/lib/supabase/server";

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    redirect("/app?error=Project%20name%20is%20required");
  }

  const supabase = await createClient();

  if (!supabase) {
    redirect("/app?demo=1");
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/?next=${encodeURIComponent("/app")}`);
  }

  await ensureProfile(supabase, user);

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      name,
      description,
      owner_id: user.id
    })
    .select("id")
    .single();

  if (error || !project) {
    redirect(`/app?error=${encodeURIComponent(error?.message ?? "Unable to create project")}`);
  }

  await supabase.from("project_members").insert({
    project_id: project.id,
    user_id: user.id,
    role: "owner"
  });

  redirect(`/app/projects/${project.id}`);
}
