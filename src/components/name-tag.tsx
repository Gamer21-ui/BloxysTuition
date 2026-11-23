import { nameStyle } from "@/lib/cosmetics";
import { cn } from "@/lib/utils";

/** A display name in the player's equipped name colour. */
export function NameTag({ name, style, className }: { name: string; style?: string | null; className?: string }) {
  return <span className={cn(style && "font-bold", className)} style={nameStyle(style)}>{name}</span>;
}
