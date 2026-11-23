import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtDate(d: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { timeZone: "Indian/Mauritius", ...opts });
}

export function fmtDateTime(d: string | Date | null | undefined) {
  return fmtDate(d, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(d: string | Date) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/** "in 5h", "in 2d" for a future date. */
export function timeUntil(d: string | Date) {
  const s = Math.max(0, Math.floor((new Date(d).getTime() - Date.now()) / 1000));
  if (s < 3600) return `in ${Math.max(1, Math.floor(s / 60))}m`;
  if (s < 86400) return `in ${Math.floor(s / 3600)}h`;
  return `in ${Math.floor(s / 86400)}d`;
}

export function isLive(status: string, releaseAt: string | null) {
  return status === "published" || (status === "scheduled" && !!releaseAt && new Date(releaseAt) <= new Date());
}
