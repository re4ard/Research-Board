import type { Profile } from "@/lib/types";
import { cn, initials } from "@/lib/utils";

export function Avatar({
  profile,
  className
}: {
  profile: Profile;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-[11px] font-semibold text-ink shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-paper",
        className
      )}
      title={profile.name}
    >
      {profile.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={profile.name}
          className="size-full rounded-full object-cover"
          src={profile.avatarUrl}
        />
      ) : (
        initials(profile.name)
      )}
    </span>
  );
}
