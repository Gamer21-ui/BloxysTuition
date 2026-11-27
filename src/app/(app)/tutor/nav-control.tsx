"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Tutor HQ card: switch everyone between the new hub menu and the classic long menu (the backup). */
export function NavControl({ current }: { current: "new" | "classic" | null }) {
  const router = useRouter();
  const [style, setStyle] = useState(current);
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  async function pick(s: "new" | "classic") {
    setMsg(null);
    const { error } = await createClient().rpc("tutor_set_nav_style", { p_style: s });
    if (error) { setMsg({ text: error.message.includes("tutor_set_nav_style") ? "Run the live-lessons SQL update first." : error.message, bad: true }); return; }
    setStyle(s); setMsg({ text: s === "new" ? "Everyone now has the new menu." : "Everyone is back on the classic menu." }); router.refresh();
  }
  return (
    <Card className="space-y-3">
      <div>
        <h2 className="text-lg">🧭 Menu style</h2>
        <p className="text-sm text-muted"><b>New:</b> Home · Courses · Homework · Play · Me, with games, notes and interactive lessons inside each course. <b>Classic:</b> the old long menu (kept as a backup).</p>
      </div>
      <div className="flex gap-2">
        {(["new", "classic"] as const).map((s) => (
          <button key={s} onClick={() => pick(s)} className={cn("btn flex-1", (style ?? "new") === s ? "btn-primary" : "btn-ghost")}>{s === "new" ? "✨ New menu" : "📜 Classic menu"}</button>
        ))}
      </div>
      {msg && <p className={msg.bad ? "text-sm font-bold text-bad" : "text-sm font-bold text-good"} role="status">{msg.text}</p>}
    </Card>
  );
}
