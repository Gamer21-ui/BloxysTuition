import type { Metadata } from "next";
import { requireApproved } from "@/lib/auth";
import { FriendsHub } from "./friends-hub";

export const metadata: Metadata = { title: "Friends" };

export default async function Friends() {
  const me = await requireApproved();
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="page-title">Friends &amp; party</h1>
      <p className="text-muted">Add friends, then make a party (up to 4). When the party leader creates or joins a battle, everyone in the party is put in it on the same team.</p>
      <FriendsHub meId={me.id} />
    </div>
  );
}
