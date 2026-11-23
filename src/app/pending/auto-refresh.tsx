"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-checks every few seconds (and when the tab comes back into focus); the page sends them on once approved. */
export function AutoRefresh({ every = 5000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), every);
    const onFocus = () => router.refresh();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(t); window.removeEventListener("focus", onFocus); };
  }, [router, every]);
  return null;
}
