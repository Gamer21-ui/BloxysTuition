import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ReportDocument } from "@/components/report-document";
import { toggleReportShare } from "../../tutor/actions";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Progress report" };
export const dynamic = "force-dynamic";

export default async function Report({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireApproved();
  const sb = await createClient();
  const { data: r } = await sb.from("reports").select("*").eq("id", id).maybeSingle();
  if (!r) notFound();
  const tutor = me.role === "tutor";
  return (
    <div className="mx-auto max-w-3xl pb-16">
      <div className="no-print mb-6 flex flex-wrap items-center gap-2">
        <Link href={tutor ? `/tutor/students/${r.student_id}` : "/dashboard"} className="btn btn-ghost btn-sm">← Back</Link>
        <PrintButton />
        {tutor && (
          <form action={toggleReportShare}>
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="share" value={r.shared_with_student ? "0" : "1"} />
            <button className="btn btn-ghost btn-sm">{r.shared_with_student ? "Hide from student" : "Share with student"}</button>
          </form>
        )}
      </div>

      <ReportDocument r={r} />
    </div>
  );
}
