import { nameStyle } from "@/lib/cosmetics";
import { cn } from "@/lib/utils";

/** A display name in the player's equipped name colour. */
export function NameTag({ name, style, className }: { name: string; style?: string | null; className?: string }) {
  if (style === "owner") {
    return <span className={className}><span className="fb-owner-name">{name}</span><span className="fb-owner-tag" title="Owner">👑 OWNER</span></span>;
  }
  return <span className={cn(style && "font-bold", className)} style={nameStyle(style)}>{name}</span>;
}
