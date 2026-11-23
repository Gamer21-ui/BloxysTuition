import { BRAND } from "@/lib/brand";

export type Subject = { subject: string; quizzes: number; quiz_pct: number | null; homework_pct: number | null; rating: string };
export type Topics = { subject: string; strong: string[]; average: string[]; weak: string[] };
export type Stats = {
  version?: number; student: string; tier: string; days: number;
  attendance: { sessions: number; present: number; late?: number; absent?: number; excused?: number; pct: number | null };
  quizzes: { count: number; avg_pct?: number | null; subjects?: { subject: string; quizzes: number; pct: number }[] };
  homework: { set?: number; handed_in: number; on_time: number; avg_pct: number | null };
  study_days?: number; subjects?: Subject[]; topics?: Topics[];
  strong?: string[]; weak?: string[];
};

const LEVEL: Record<string, string> = { O: "Cambridge O Level", AS: "Cambridge AS Level", A: "Cambridge A Level" };
const tagClass = (r: string) => r === "Excellent" ? "t-excellent" : r === "Good" ? "t-good" : r === "Satisfactory" ? "t-satisfactory" : r === "Needs improvement" ? "t-needs" : "t-none";
const ratingOf = (pct: number | null) => pct === null ? "Not assessed" : pct >= 80 ? "Excellent" : pct >= 65 ? "Good" : pct >= 50 ? "Satisfactory" : "Needs improvement";
const pc = (v: number | null | undefined) => (v === null || v === undefined ? "–" : `${v}%`);


export type ReportRow = { id: string; created_at: string; period_label: string; parent_name: string | null; comment: string; stats: unknown };

/** The printable parent report. Plain language, no game terms. */
export function ReportDocument({ r }: { r: ReportRow }) {
  const s = r.stats as Stats;
  const subjects: Subject[] = s.subjects ?? (s.quizzes.subjects || []).map((x) => ({ subject: x.subject, quizzes: x.quizzes, quiz_pct: x.pct, homework_pct: null, rating: ratingOf(x.pct) }));
  const topics: Topics[] = s.topics ?? ((s.strong?.length || s.weak?.length) ? [{ subject: "All subjects", strong: s.strong || [], average: [], weak: s.weak || [] }] : []);
  const quizAvg = s.quizzes.avg_pct ?? null;
  const no = r.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  const fmt = (d: Date, long = false) => d.toLocaleDateString("en-GB", { timeZone: "Indian/Mauritius", day: "numeric", month: long ? "long" : "short", year: "numeric" });
  const issued = fmt(new Date(r.created_at), true);
  const from = fmt(new Date(+new Date(r.created_at) - s.days * 86400_000));
  const to = fmt(new Date(r.created_at));
  const a = s.attendance;
  return (
      <article className="report-doc">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 pb-4" style={{ borderColor: "#1e3a5f" }}>
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest muted">{BRAND.name.replace(/!$/, "")} · Private Tuition · {BRAND.location}</div>
        <h1 className="mt-1 text-[26px] leading-tight">Student Progress Report</h1>
      </div>
      <div className="text-right text-xs muted">Ref. {no}<br />Issued {issued}</div>
    </header>

    <table className="mt-4">
      <tbody>
        <tr><th style={{ width: "22%" }}>Student</th><td>{s.student}</td><th style={{ width: "22%" }}>Parent / Guardian</th><td>{r.parent_name || "–"}</td></tr>
        <tr><th>Programme</th><td>{LEVEL[s.tier] || s.tier}</td><th>Reporting period</th><td>{r.period_label}<div className="text-xs muted">{from} – {to}</div></td></tr>
      </tbody>
    </table>

    <section>
      <h2>Summary</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="kpi"><b>{a.sessions ? pc(a.pct) : "–"}</b>Class attendance</div>
        <div className="kpi"><b>{pc(quizAvg)}</b>Average practice-test score</div>
        <div className="kpi"><b>{pc(s.homework.avg_pct)}</b>Average homework mark</div>
        <div className="kpi"><b>{s.study_days ?? "–"}{s.study_days !== undefined && <span className="text-sm muted"> / {s.days}</span>}</b>Days with study activity</div>
      </div>
    </section>

    <section>
      <h2>Performance by subject</h2>
      {subjects.length ? (
        <table>
          <thead><tr><th>Subject</th><th className="num">Practice tests taken</th><th className="num">Average test score</th><th className="num">Homework average</th><th className="num">Overall</th></tr></thead>
          <tbody>
            {subjects.map((x) => (
              <tr key={x.subject}>
                <td>{x.subject.replace(/^O Level /, "")}</td><td className="num">{x.quizzes}</td><td className="num">{pc(x.quiz_pct)}</td><td className="num">{pc(x.homework_pct)}</td>
                <td className="num"><span className={`tag ${tagClass(x.rating)}`}>{x.rating}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p className="muted">No tests or marked homework in this period.</p>}
    </section>

    <section className="grid gap-x-6 sm:grid-cols-2">
      <div>
        <h2>Attendance</h2>
        <table><tbody>
          <tr><td>Classes held</td><td className="num">{a.sessions}</td></tr>
          <tr><td>Present</td><td className="num">{a.present}</td></tr>
          {a.late !== undefined && <tr><td>Late</td><td className="num">{a.late}</td></tr>}
          {a.absent !== undefined && <tr><td>Absent</td><td className="num">{a.absent}</td></tr>}
          {a.excused !== undefined && <tr><td>Excused</td><td className="num">{a.excused}</td></tr>}
        </tbody></table>
      </div>
      <div>
        <h2>Homework</h2>
        <table><tbody>
          {s.homework.set !== undefined && <tr><td>Assignments set</td><td className="num">{s.homework.set}</td></tr>}
          <tr><td>Handed in</td><td className="num">{s.homework.handed_in}</td></tr>
          <tr><td>Handed in on time</td><td className="num">{s.homework.on_time}</td></tr>
          <tr><td>Average mark</td><td className="num">{pc(s.homework.avg_pct)}</td></tr>
        </tbody></table>
      </div>
    </section>

    {topics.length > 0 && (
      <section>
        <h2>Topic review</h2>
        <table>
          <thead><tr><th style={{ width: "19%" }}>Subject</th><th style={{ width: "27%" }}>Secure</th><th style={{ width: "27%" }}>Developing</th><th>Needs more work</th></tr></thead>
          <tbody>
            {topics.map((t) => (
              <tr key={t.subject}>
                <td className="font-semibold">{t.subject.replace(/^O Level /, "")}</td>
                {[t.strong, t.average, t.weak].map((list, i) => (
                  <td key={i}>{list.length ? <ul className="list-none space-y-0.5">{list.map((x) => <li key={x}>{x}</li>)}</ul> : <span className="muted">–</span>}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    )}

    <section>
      <h2>Tutor&apos;s comments</h2>
      <p className="whitespace-pre-wrap">{r.comment}</p>
    </section>

    <section>
      <h2>Upcoming examinations</h2>
      <p>{LEVEL[s.tier] || "Cambridge"} examinations: October – November 2027 series.</p>
    </section>

    <section className="mt-8 grid gap-8 sm:grid-cols-2">
      <div><div className="border-b border-gray-400 pb-8" /><div className="mt-1 text-xs muted">Tutor signature &amp; date</div></div>
      <div><div className="border-b border-gray-400 pb-8" /><div className="mt-1 text-xs muted">Parent / guardian signature &amp; date</div></div>
    </section>

    <footer className="mt-8 border-t pt-3 text-[11.5px] muted" style={{ borderColor: "#d1d5db" }}>
      <b>How to read this report.</b> Practice tests are short online tests on each syllabus chapter, marked automatically. Homework is marked by the tutor.
      Overall rating combines both: Excellent 80% and above · Good 65–79% · Satisfactory 50–64% · Needs improvement below 50%.
      Topic review is the tutor&apos;s judgement from class work, homework and tests.
    </footer>
  </article>
  );
}
