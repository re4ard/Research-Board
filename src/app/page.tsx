import { redirect } from "next/navigation";

import { LandingPage } from "@/components/auth/landing-page";
import { createClient } from "@/lib/supabase/server";

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{
    next?: string;
    authError?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      redirect(params.next && params.next.startsWith("/") ? params.next : "/app");
    }
  }

  return (
    <LandingPage
      authError={params.authError}
      demoEnabled={!supabase}
      nextPath={params.next ?? "/app"}
    />
  );
}
