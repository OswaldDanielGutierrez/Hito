import Link from "next/link";
import { APP_NAME } from "@/config/app";
import { AvatarMenu } from "./AvatarMenu";
import { NavLinks } from "./NavLinks";
import { NotificationsBell, type NotificationItem } from "./NotificationsBell";
import { SearchTrigger } from "./search/SearchDialog";

export function TopBarSkeleton() {
  return (
    <header className="bg-green-900">
      <div className="mx-auto flex h-[var(--top-bar-height)] max-w-[1376px] items-center px-4 sm:px-8">
        <span aria-hidden className="mr-2 inline-block size-4 rotate-45 rounded-[3px] bg-green-500" />
        <span className="text-base font-extrabold text-white">{APP_NAME}</span>
      </div>
    </header>
  );
}

export function TopBar({
  initials,
  email,
  displayName,
  notifications,
  unread,
}: {
  initials: string;
  email: string;
  displayName: string;
  notifications: NotificationItem[];
  unread: number;
}) {
  return (
    <header className="bg-green-900">
      <div className="mx-auto flex h-[var(--top-bar-height)] max-w-[1376px] items-center gap-4 px-4 sm:px-8 md:gap-6 max-[379px]:gap-1.5 max-[379px]:px-2">
        <Link href="/" className="relative mr-2 flex items-center gap-2 after:absolute after:-inset-3 after:content-[''] max-[379px]:mr-0">
          <span aria-hidden className="inline-block size-4 rotate-45 rounded-[3px] bg-green-500" />
          <span className="hidden text-base font-extrabold text-white min-[420px]:inline">{APP_NAME}</span>
          <span className="sr-only min-[420px]:hidden">{APP_NAME}</span>
        </Link>

        <NavLinks />

        <div className="ml-auto flex items-center gap-3 md:gap-4 max-[379px]:gap-0.5">
          <SearchTrigger />
          <NotificationsBell items={notifications} unread={unread} />
          <AvatarMenu initials={initials} email={email} displayName={displayName} />
        </div>
      </div>
    </header>
  );
}
