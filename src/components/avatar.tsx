/* eslint-disable @next/next/no-img-element */
import { BlockyAvatar } from "@/components/blocky-avatar";
import { FRAMES } from "@/lib/cosmetics";
import type { BlockyConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  mode: "discord" | "roblox" | "blocky" | "both";
  discordUrl?: string | null;
  robloxUrl?: string | null;
  blocky?: BlockyConfig;
  size?: number;
  className?: string;
  ring?: string;
  frame?: string | null;
};

function Frame({ children, size, ring, className }: { children: React.ReactNode; size: number; ring?: string; className?: string }) {
  return (
    <div
      className={cn("relative shrink-0 overflow-hidden bg-surface2 border-2 border-line", className)}
      style={{ width: size, height: size, borderRadius: "calc(var(--radius) * 0.7)", borderColor: ring }}
    >
      {children}
    </div>
  );
}

/** Wraps an avatar in a shop frame (a gradient ring) when one is equipped. */
export function Avatar(props: Props) {
  const f = props.frame ? FRAMES[props.frame] : undefined;
  const pad = Math.max(2, Math.round((props.size || 48) / 16));
  if (props.frame === "owner") {
    return (
      <div className={cn("fb-owner-frame shrink-0", props.className)} style={{ padding: pad + 1, borderRadius: `calc(var(--radius) * 0.7 + ${pad + 1}px)` }}>
        <AvatarInner {...props} className={undefined} size={(props.size || 48) - (pad + 1) * 2} />
      </div>
    );
  }
  if (!f) return <AvatarInner {...props} />;
  return (
    <div className={cn("shrink-0", props.className)} style={{ padding: pad, background: f, borderRadius: `calc(var(--radius) * 0.7 + ${pad}px)` }}>
      <AvatarInner {...props} className={undefined} size={(props.size || 48) - pad * 2} />
    </div>
  );
}

function AvatarInner({ name, mode, discordUrl, robloxUrl, blocky, size = 48, className, ring }: Props) {
  const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const img = (src: string, alt: string) => <img src={src} alt={alt} width={size} height={size} className="h-full w-full object-cover" />;

  if (mode === "both" && robloxUrl) {
    return (
      <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
        <Frame size={size} ring={ring}>{img(robloxUrl, `${name}'s Roblox avatar`)}</Frame>
        <div className="absolute -bottom-1 -right-1 overflow-hidden border-2 border-surface" style={{ width: size * 0.45, height: size * 0.45, borderRadius: 6 }}>
          <BlockyAvatar config={blocky} size={size * 0.45} />
        </div>
      </div>
    );
  }
  let inner: React.ReactNode;
  if ((mode === "roblox" || mode === "both") && robloxUrl) inner = img(robloxUrl, `${name}'s Roblox avatar`);
  else if (mode === "blocky" || mode === "both") inner = <BlockyAvatar config={blocky} size={size} />;
  else if (discordUrl) inner = img(discordUrl, `${name}'s avatar`);
  else inner = <div className="grid h-full w-full place-items-center bg-accent font-display text-white" style={{ fontSize: size * 0.38 }}>{initials}</div>;
  return <Frame size={size} ring={ring} className={className}>{inner}</Frame>;
}
