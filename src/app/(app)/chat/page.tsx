import type { Metadata } from "next";
import { requireApproved } from "@/lib/auth";
import { ChatRoom } from "./chat-room";

export const metadata: Metadata = { title: "Chat" };

export default async function Chat() {
  const me = await requireApproved();
  return <ChatRoom meId={me.id} isTutor={me.role === "tutor"} myTier={me.tier} />;
}
