import Link from "next/link";
import { BlockyAvatar } from "@/components/blocky-avatar";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-5">
      <div className="card max-w-md text-center">
        <div className="mx-auto w-fit overflow-hidden border-2 border-line" style={{ borderRadius: "var(--radius)" }}>
          <BlockyAvatar size={120} config={{ face: "focused", hat: "cap", bg: "#ff4b4b" }} />
        </div>
        <h1 className="mt-4 text-5xl">404</h1>
        <p className="mt-2 text-muted">This level doesn't exist (yet). Maybe your tutor hasn't unlocked it?</p>
        <Link href="/dashboard" className="btn btn-primary mt-6">Respawn at home</Link>
      </div>
    </main>
  );
}
