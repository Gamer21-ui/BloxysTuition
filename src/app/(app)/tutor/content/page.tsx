import type { Metadata } from "next";
import Link from "next/link";
import { requireTutor } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, SectionTitle, StatusChip } from "@/components/ui";
import { StatusForm } from "../status-form";
import { ResourceUploader } from "./[chapter]/resource-uploader";

export const metadata: Metadata = { title: "Content" };
export const dynamic = "force-dynamic";

export default async function Content() {
  await requireTutor();
  const { data: courses } = await createAdminClient().from("courses")
    .select("id, title, code, exam_label, color, chapters(id, number, title, status, release_at, sort, parts(count), resources(count)), quizzes(id, title, kind, status, release_at, chapter_id)").order("sort");
  type Ch = { id: string; number: string; title: string; status: string; release_at: string | null; sort: number; parts: { count: number }[]; resources: { count: number }[] };
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="page-title">Content</h1>
      <p className="text-muted"><b>Draft</b> is hidden, <b>locked</b> shows a padlock, <b>scheduled</b> opens by itself at the time you set (Mauritius time), <b>published</b> is open now.</p>
      {(courses || []).map((c) => (
        <div key={c.id}>
          <SectionTitle><span style={{ color: c.color }}>■</span> {c.title} <span className="text-sm font-normal text-muted">{c.exam_label}</span></SectionTitle>
          <Card className="divide-y divide-line p-0">
            {((c.chapters as Ch[]) || []).sort((a, b) => a.sort - b.sort).map((ch) => (
              <div key={ch.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                <Link href={`/tutor/content/${ch.id}`} className="min-w-0 flex-1 font-bold hover:underline">{ch.number}. {ch.title}
                  <span className="ml-2 text-xs font-normal text-muted">{ch.parts?.[0]?.count ?? 0} parts · {ch.resources?.[0]?.count ?? 0} files</span></Link>
                <StatusChip status={ch.status} />
                <StatusForm table="chapters" id={ch.id} status={ch.status} releaseAt={ch.release_at} />
              </div>
            ))}
          </Card>
          <Card className="mt-2 divide-y divide-line p-0">
            {((c.quizzes as { id: string; title: string; kind: string; status: string; release_at: string | null; chapter_id: string | null }[]) || [])
              .filter((z) => !z.chapter_id).map((z) => (
              <div key={z.id} className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm">
                <span className="chip">{z.kind === "exam" ? "timed test" : z.kind === "review" ? "mistakes deck" : z.kind}</span>
                <span className="flex-1 font-bold">{z.title}</span>
                <StatusChip status={z.status} />
                <StatusForm table="quizzes" id={z.id} status={z.status} releaseAt={z.release_at} />
              </div>
            ))}
          </Card>
          <details className="mt-2"><summary className="cursor-pointer text-sm font-bold">+ Add a course-wide file (not tied to one chapter)</summary>
            <div className="mt-2"><ResourceUploader courseId={c.id} chapterId={null} /></div></details>
        </div>
      ))}
    </div>
  );
}
