"use client";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { setTopicLabel } from "../../actions";

type Label = "weak" | "average" | "strong" | "none";
type Chapter = { id: string; number: string; title: string; label: Label; quizPct: number | null; tries: number };
type Course = { id: string; title: string; code: string; color: string; tier?: string; chapters: Chapter[] };

const OPTIONS: { id: Exclude<Label, "none">; text: string; on: string }[] = [
  { id: "weak", text: "Needs work", on: "bg-bad text-white border-bad" },
  { id: "average", text: "Average", on: "bg-warn text-white border-warn" },
  { id: "strong", text: "Strong", on: "bg-good text-white border-good" },
];

export function TopicEditor({ studentId, courses }: { studentId: string; courses: Course[] }) {
  const [tab, setTab] = useState(courses[0]?.id);
  const [labels, setLabels] = useState<Record<string, Label>>(
    () => Object.fromEntries(courses.flatMap((c) => c.chapters.map((ch) => [ch.id, ch.label]))),
  );
  const [, start] = useTransition();
  const course = courses.find((c) => c.id === tab) || courses[0];

  function pick(chapter: string, l: Label) {
    const next = labels[chapter] === l ? "none" : l; // clicking the active option clears it
    setLabels((x) => ({ ...x, [chapter]: next }));
    start(() => setTopicLabel(studentId, chapter, next));
  }
  const tally = (c: Course, l: Label) => c.chapters.filter((ch) => labels[ch.id] === l).length;

  if (!course) return null;
  return (
    <div className="card p-0">
      <div className="flex flex-wrap gap-2 border-b-2 border-line p-3" role="tablist">
        {courses.map((c) => (
          <button key={c.id} role="tab" aria-selected={c.id === course.id} onClick={() => setTab(c.id)}
            className={cn("btn btn-sm", c.id === course.id ? "btn-primary" : "btn-ghost")}>
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c.color }} /> <span className="text-xs opacity-70">{c.tier === "AS" || c.tier === "A" ? "AS/A" : "O"}</span> {c.title.replace(/^(O|AS|A) Level /, "")}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 px-4 pt-3 text-sm">
        <span className="font-bold text-good">{tally(course, "strong")} strong</span>
        <span className="font-bold text-warn">{tally(course, "average")} average</span>
        <span className="font-bold text-bad">{tally(course, "weak")} need work</span>
        <span className="text-muted">{tally(course, "none")} not rated</span>
      </div>
      <div className="divide-y divide-line">
        {course.chapters.map((ch) => (
          <div key={ch.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-[200px] flex-1">
              <div className="font-bold">{ch.number}. {ch.title}</div>
              <div className="text-xs text-muted">
                {ch.tries ? <>Their quiz average: <b className={ch.quizPct! >= 65 ? "text-good" : ch.quizPct! >= 50 ? "text-warn" : "text-bad"}>{ch.quizPct}%</b> ({ch.tries} {ch.tries === 1 ? "try" : "tries"})</> : "No quiz attempts yet"}
              </div>
            </div>
            <div className="flex overflow-hidden rounded border-2 border-line" role="radiogroup" aria-label={`Rating for ${ch.title}`}>
              {OPTIONS.map((o, i) => (
                <button key={o.id} role="radio" aria-checked={labels[ch.id] === o.id} onClick={() => pick(ch.id, o.id)}
                  className={cn("px-3 py-1.5 text-sm font-bold transition", i > 0 && "border-l-2 border-line",
                    labels[ch.id] === o.id ? o.on : "bg-surface2 text-muted hover:text-ink")}>
                  {o.text}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="px-4 pb-3 pt-1 text-xs text-muted">Saves instantly. Click a selected rating again to clear it. These show on the parent report, and “Needs work” / “Strong” show on the student&apos;s Courses page.</p>
    </div>
  );
}
