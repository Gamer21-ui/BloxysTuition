import Link from "next/link";

export function HubTile({ href, emoji, title, text, badge, accent }: { href: string; emoji: string; title: string; text: string; badge?: number; accent?: boolean }) {
  return (
    <Link href={href} className={`card group relative flex items-center gap-3 transition hover:-translate-y-0.5 ${accent ? "border-accent/60" : ""}`}>
      <span className="text-4xl transition group-hover:scale-110">{emoji}</span>
      <span className="min-w-0">
        <span className="block font-display text-xl leading-tight">{title}</span>
        <span className="block text-xs text-muted">{text}</span>
      </span>
      {!!badge && <span className="absolute right-3 top-3 rounded-full bg-accent px-2 text-xs font-bold text-white">{badge > 99 ? "99+" : badge}</span>}
    </Link>
  );
}
