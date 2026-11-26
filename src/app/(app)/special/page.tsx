import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { SpecialView } from "./special-view";

export const metadata: Metadata = { title: "Special Training" };
export const dynamic = "force-dynamic";

export default async function Special() {
  const me = await requireApproved();
  if (me.role !== "tutor" && !me.special) redirect("/dashboard");
  return <SpecialView name={me.display_name} />;
}
