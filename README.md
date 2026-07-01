# Collaborative Research Workspace

A modern collaborative research and bookmarking app for small teams. It includes a responsive Gallery view, Kanban workflow, URL metadata scraping endpoint, Supabase-ready schema, and realtime subscription hooks.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, Realtime, and Row Level Security

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The UI works with bundled demo data if Supabase environment variables are not set. Each bookmark has structured research notes for an expanded summary, main idea, and facts pulled from the source.

## Configure Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Enable Google in Supabase Auth under **Authentication > Providers > Google**.
6. Add `http://localhost:3000/auth/callback` and your deployed `/auth/callback` URL to the Google OAuth redirect URIs.
7. Restart the dev server.

If you already created the database before the latest project settings/account updates, run these migration files in order from the Supabase SQL editor:

```text
supabase/migrations/202607010151_project_account_rpcs.sql
supabase/migrations/202607010230_project_settings_rpcs.sql
```

## Real deployment checklist

1. Push the app to GitHub.
2. Import the repo into Vercel.
3. Add these Vercel environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

4. In Supabase, add these auth URLs:

```text
Site URL: https://your-domain.com
Redirect URLs:
https://your-domain.com/auth/callback
http://localhost:3000/auth/callback
```

5. In Google Cloud Console, create an OAuth web client and add the Supabase callback URL shown in Supabase's Google provider settings.
6. Deploy on Vercel.
7. Create a project, copy `/join/[inviteSlug]`, and test it from a second Google account.

Invite links preserve sign-in state by sending users to Google with `next=/join/[inviteSlug]`; after `/auth/callback`, the app returns them to the invite route and adds them to the project.

## Google sign-in troubleshooting

If Supabase returns `{"error":"requested path is invalid"}`, the `redirect_to` URL is not allowlisted in Supabase Auth.

For local development with the default `.env.local`, add this in Supabase:

```text
http://localhost:3000/auth/callback
```

Then open the app at:

```text
http://localhost:3000
```

For production, set `NEXT_PUBLIC_APP_URL` to the deployed URL and add:

```text
https://your-domain.com/auth/callback
```

Do not mix `localhost` and `127.0.0.1` unless both callback URLs are allowlisted.

## Production notes

- Add email delivery for project invites.
- Put the scrape route behind authenticated server actions before production launch.
- Consider adding a metadata cache table if users save many links from the same domains.
