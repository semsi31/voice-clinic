import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type SiteIconName =
  | "activity"
  | "arrow-right"
  | "award"
  | "building"
  | "calendar"
  | "check-circle"
  | "clipboard-check"
  | "clock"
  | "close"
  | "ear"
  | "facebook"
  | "headset"
  | "heart"
  | "instagram"
  | "mail"
  | "map-pin"
  | "menu"
  | "message-circle"
  | "package"
  | "phone"
  | "settings"
  | "shield-check"
  | "users"
  | "wrench";

type SiteIconProps = {
  name: SiteIconName;
  className?: string;
};

type IconBadgeProps = SiteIconProps & {
  variant?: "dark" | "light" | "gold";
  size?: "sm" | "md";
};

const iconPaths: Record<SiteIconName, ReactNode> = {
  activity: <path d="M4 12h3l2-5 4 10 2-5h5" />,
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" />,
  award: (
    <>
      <circle cx="12" cy="8" r="5" />
      <path d="m8.8 12.2-1.3 7.3L12 17l4.5 2.5-1.3-7.3" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V7l8-4 8 4v14" />
      <path d="M9 21v-7h6v7M8 9h.01M12 9h.01M16 9h.01" />
    </>
  ),
  calendar: (
    <>
      <path d="M7 3v3M17 3v3M4 9h16" />
      <rect width="16" height="17" x="4" y="5" rx="2" />
    </>
  ),
  "check-circle": (
    <>
      <path d="M8 12.5 10.5 15 16 9" />
      <circle cx="12" cy="12" r="8" />
    </>
  ),
  "clipboard-check": (
    <>
      <path d="M9 5h6M9 4h6v3H9z" />
      <path d="M8 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2" />
      <path d="m8 14 2.5 2.5L16 11" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  ear: (
    <>
      <path d="M17 9a5 5 0 0 0-10 0" />
      <path d="M7 9c0 4 5 3 5 7a3 3 0 0 1-3 3" />
      <path d="M11 9a2 2 0 0 1 4 0c0 2-2 2.5-2 4" />
    </>
  ),
  facebook: <path d="M14 8h2V5h-2a4 4 0 0 0-4 4v2H8v3h2v7h3v-7h2.5l.5-3h-3V9a1 1 0 0 1 1-1Z" />,
  headset: (
    <>
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <path d="M5 13h3v5H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1ZM16 13h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3v-5Z" />
      <path d="M16 18c0 1.5-1.5 2-3 2h-1" />
    </>
  ),
  heart: <path d="M20 8.8c0 5.1-8 9.2-8 9.2s-8-4.1-8-9.2A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8 2.8Z" />,
  instagram: (
    <>
      <rect width="15" height="15" x="4.5" y="4.5" rx="4" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="M16.6 7.4h.01" />
    </>
  ),
  mail: (
    <>
      <rect width="16" height="12" x="4" y="6" rx="2" />
      <path d="m5 8 7 5 7-5" />
    </>
  ),
  "map-pin": (
    <>
      <path d="M12 21s6-5.2 6-11a6 6 0 0 0-12 0c0 5.8 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  "message-circle": (
    <>
      <path d="M20 11.5a7.5 7.5 0 0 1-11 6.6L5 19l.9-3.7A7.5 7.5 0 1 1 20 11.5Z" />
      <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
    </>
  ),
  package: (
    <>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m4.5 8 7.5 4 7.5-4M12 12v8" />
    </>
  ),
  phone: (
    <path d="M8 5 5.5 7.5c.5 5.2 5.8 10.5 11 11L19 16l-3-3-2 2c-2.4-.9-4.1-2.6-5-5l2-2-3-3Z" />
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5L9.2 6a7 7 0 0 0-1.7 1L5.1 6l-2 3.5 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 1.7 1l.3 3h5l.3-3a7 7 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5a7 7 0 0 0 .1-1Z" />
    </>
  ),
  "shield-check": (
    <>
      <path d="M12 3 19 6v5c0 4.5-2.8 7.8-7 10-4.2-2.2-7-5.5-7-10V6l7-3Z" />
      <path d="m9 12 2 2 4-5" />
    </>
  ),
  users: (
    <>
      <path d="M16 19a4 4 0 0 0-8 0" />
      <circle cx="12" cy="10" r="3" />
      <path d="M22 19a3.5 3.5 0 0 0-5-3.1M7 15.9A3.5 3.5 0 0 0 2 19" />
      <path d="M18 11a2.5 2.5 0 1 0-1.8-4.2M7.8 6.8A2.5 2.5 0 1 0 6 11" />
    </>
  ),
  wrench: (
    <path d="M21 7.5a5.5 5.5 0 0 1-7 6.7L7.2 21 3 16.8l6.8-6.8A5.5 5.5 0 0 1 16.5 3L13 6.5l4.5 4.5L21 7.5Z" />
  ),
};

export function SiteIcon({ name, className }: SiteIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-5", className)}
    >
      {iconPaths[name]}
    </svg>
  );
}

export function IconBadge({
  name,
  className,
  variant = "dark",
  size = "md",
}: IconBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center border shadow-sm",
        size === "md" ? "size-12 rounded-2xl" : "size-9 rounded-xl",
        variant === "dark" &&
          "border-[#D4AF37]/35 bg-[#071225] text-[#D4AF37] shadow-[#071225]/10",
        variant === "light" &&
          "border-[#D4AF37]/30 bg-[#F7F5EF] text-[#071225]",
        variant === "gold" &&
          "border-[#D4AF37]/45 bg-[#D4AF37] text-[#071225] shadow-[#D4AF37]/20",
        className,
      )}
    >
      <SiteIcon name={name} className={size === "sm" ? "size-4" : "size-5"} />
    </span>
  );
}
