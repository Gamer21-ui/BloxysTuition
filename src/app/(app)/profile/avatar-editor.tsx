"use client";
/* eslint-disable @next/next/no-img-element */
import { useState, useTransition } from "react";
import { Lock } from "lucide-react";
import { BlockyAvatar, BLOCKY_DEFAULT, HAT_UNLOCKS } from "@/components/blocky-avatar";
import { Avatar } from "@/components/avatar";
import { Card } from "@/components/ui";
import type { BlockyConfig, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { saveAvatar } from "../actions";

const SKINS = ["#f5c89a", "#e0ac69", "#c68642", "#8d5524", "#ffdbac", "#f1c27d", "#fde047", "#a3e635"];
const COLORS = ["#1cb0f6", "#58cc02", "#ff4b4b", "#ffc800", "#a855f7", "#f97316", "#111827", "#f8fafc", "#334155", "#0ea5e9", "#ec4899", "#14b8a6"];
const FACES = ["smile", "cool", "wink", "grin", "focused"] as const;
const LEVEL_HATS = Object.keys(HAT_UNLOCKS) as NonNullable<BlockyConfig["hat"]>[];
const MODES: { id: Profile["avatar_mode"]; label: string }[] = [
  { id: "blocky", label: "Blocky" }, { id: "roblox", label: "Roblox" }, { id: "both", label: "Both" }, { id: "discord", label: "Discord pic" },
];

type Init = { mode: Profile["avatar_mode"]; blocky: BlockyConfig; displayName: string; roblox: string | null; robloxImg: string | null; discordImg: string | null };

function Swatches({ value, options, onPick, label }: { value?: string; options: string[]; onPick: (c: string) => void; label: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((c) => (
          <button key={c} type="button" aria-label={`${label} ${c}`} onClick={() => onPick(c)}
            className={cn("h-7 w-7 border-2 border-line", value === c && "ring-2 ring-accent ring-offset-2 ring-offset-surface")}
            style={{ background: c, borderRadius: 6 }} />
        ))}
      </div>
    </div>
  );
}

export function AvatarEditor({ level, initial, ownedHats = [], ownedPatterns = [], ownedFace = [], ownedBack = [], frame }: { level: number; initial: Init; ownedHats?: string[]; ownedPatterns?: string[]; ownedFace?: string[]; ownedBack?: string[]; frame?: string | null }) {
  const HATS = [...LEVEL_HATS, ...(ownedHats as NonNullable<BlockyConfig["hat"]>[])];
  const [mode, setMode] = useState(initial.mode);
  const [b, setB] = useState<Required<BlockyConfig>>({ ...BLOCKY_DEFAULT, ...(initial.blocky || {}) });
  const [name, setName] = useState(initial.displayName);
  const [roblox, setRoblox] = useState(initial.roblox || "");
  const [robloxImg, setRobloxImg] = useState(initial.robloxImg);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof BlockyConfig, v: string) => setB((x) => ({ ...x, [k]: v }));

  function save() {
    setMsg(null);
    start(async () => {
      try { await saveAvatar({ mode, blocky: b, displayName: name }); setMsg("Saved ✔"); }
      catch (e) { setMsg((e as Error).message || "Couldn't save"); }
    });
  }
  async function linkRoblox() {
    setMsg(null);
    const r = await fetch("/api/roblox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: roblox }) });
    const j = await r.json();
    if (!r.ok) return setMsg(j.error || "Couldn't link");
    setRobloxImg(j.image); setRoblox(j.name);
    if (mode === "discord") setMode("roblox");
    setMsg(`Linked ${j.name} ✔`);
  }
  async function unlinkRoblox() {
    await fetch("/api/roblox", { method: "DELETE" });
    setRobloxImg(null); setRoblox("");
    if (mode === "roblox" || mode === "both") setMode("blocky");
  }

  return (
    <Card className="grid gap-6 md:grid-cols-[220px_1fr]">
      <div className="flex flex-col items-center gap-3">
        <Avatar name={name} mode={mode} blocky={b} robloxUrl={robloxImg} discordUrl={initial.discordImg} size={168} frame={frame} />
        <div className="flex flex-wrap justify-center gap-1.5">
          {MODES.map((m) => (
            <button key={m.id} type="button" onClick={() => setMode(m.id)} disabled={(m.id === "roblox" || m.id === "both") && !robloxImg}
              className={cn("btn btn-sm", mode === m.id ? "btn-primary" : "btn-ghost")}>{m.label}</button>
          ))}
        </div>
        <p className="text-center text-xs text-muted">“Both” shows your Roblox face with your blocky buddy in the corner.</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="dn">Display name</label>
          <input id="dn" className="input" value={name} maxLength={32} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="rb">Roblox username</label>
          <div className="flex gap-2">
            <input id="rb" className="input" value={roblox} placeholder="e.g. Builderman" onChange={(e) => setRoblox(e.target.value)} />
            <button type="button" className="btn btn-accent btn-sm" onClick={linkRoblox} disabled={!roblox}>Link</button>
            {robloxImg && <button type="button" className="btn btn-ghost btn-sm" onClick={unlinkRoblox}>Unlink</button>}
          </div>
        </div>
        <Swatches label="Skin" value={b.skin} options={SKINS} onPick={(c) => set("skin", c)} />
        <Swatches label="Shirt" value={b.shirt} options={COLORS} onPick={(c) => set("shirt", c)} />
        <Swatches label="Pants" value={b.pants} options={COLORS} onPick={(c) => set("pants", c)} />
        <Swatches label="Background" value={b.bg} options={COLORS} onPick={(c) => set("bg", c)} />
        <div>
          <div className="label">Face</div>
          <div className="flex flex-wrap gap-2">
            {FACES.map((f) => (
              <button key={f} type="button" onClick={() => set("face", f)} className={cn("overflow-hidden border-2 border-line", b.face === f && "ring-2 ring-accent")} style={{ borderRadius: 8 }}>
                <BlockyAvatar config={{ ...b, face: f, hat: "none" }} size={48} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="label">Hat <span className="text-muted">(more unlock as you level up)</span></div>
          <div className="flex flex-wrap gap-2">
            {HATS.map((h) => {
              const need = HAT_UNLOCKS[h] ?? 1;
              const locked = level < need;
              return (
                <button key={h} type="button" disabled={locked} onClick={() => set("hat", h)} title={locked ? `Unlocks at level ${need}` : h}
                  className={cn("relative overflow-hidden border-2 border-line", b.hat === h && "ring-2 ring-accent", locked && "opacity-50")} style={{ borderRadius: 8 }}>
                  <BlockyAvatar config={{ ...b, hat: h }} size={48} />
                  {locked && <span className="absolute inset-0 grid place-items-center bg-black/50 text-[10px] font-bold text-white"><Lock size={14} />Lv {need}</span>}
                </button>
              );
            })}
          </div>
        </div>
        {([["face_acc", "Face item", ownedFace], ["back", "Back item", ownedBack]] as const).map(([slot, label, owned]) => (
          <div key={slot}>
            <div className="label">{label} {owned.length === 0 && <span className="text-muted">(get some in the <a className="underline" href="/shop">shop</a>)</span>}</div>
            <div className="flex flex-wrap gap-2">
              {["none", ...owned].map((code) => (
                <button key={code} type="button" onClick={() => set(slot, code)} title={code} className={cn("overflow-hidden border-2 border-line", (b[slot] || "none") === code && "ring-2 ring-accent")} style={{ borderRadius: 8 }}>
                  <BlockyAvatar config={{ ...b, [slot]: code }} size={48} />
                </button>
              ))}
            </div>
          </div>
        ))}
        <div>
          <div className="label">Background pattern {ownedPatterns.length === 0 && <span className="text-muted">(buy more in the <a className="underline" href="/shop">shop</a>)</span>}</div>
          <div className="flex flex-wrap gap-2">
            {(["none", ...ownedPatterns] as NonNullable<BlockyConfig["pattern"]>[]).map((pt) => (
              <button key={pt} type="button" onClick={() => set("pattern", pt)} title={pt} className={cn("overflow-hidden border-2 border-line", b.pattern === pt && "ring-2 ring-accent")} style={{ borderRadius: 8 }}>
                <BlockyAvatar config={{ ...b, pattern: pt }} size={48} />
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="btn btn-primary" onClick={save} disabled={pending}>{pending ? "Saving…" : "Save avatar"}</button>
          {msg && <span className="text-sm text-muted" role="status">{msg}</span>}
        </div>
      </div>
    </Card>
  );
}
