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

  const { data: projectId, error } = await supabase.rpc(
    "create_project_with_owner",
    {
      project_name: name,
      project_description: description
    }
  );

  if (error || !projectId) {
    redirect(`/app?error=${encodeURIComponent(error?.message ?? "Unable to create project")}`);
  }

  redirect(`/app/projects/${projectId}`);
}

export async function updateAccountName(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
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

  if (!name) {
    redirect("/app?error=Name%20is%20required");
  }

  await supabase
    .from("profiles")
    .update({
      name
    })
    .eq("id", user.id);

  redirect("/app");
}

export async function deleteAccount() {
  const supabase = await createClient();

  if (!supabase) {
    redirect("/");
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { error } = await supabase.rpc("delete_current_user");

  if (error) {
    redirect(`/app?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.auth.signOut();
  redirect("/");
}
