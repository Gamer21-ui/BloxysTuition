import Link from "next/link";
import { ANSWER_RECIPES, COMMAND_WORDS, LADDER } from "@/lib/special-content";

function Code({ lines, label }: { lines: string; label: string }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted">{label}</div>
      <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-slate-100 sm:text-sm">{lines}</pre>
    </div>
  );
}

export function SpecialView({ name }: { name: string }) {
  const first = name.split(" ")[0];
  const stages = [...new Set(LADDER.map((t) => t.stage))];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="relative overflow-hidden rounded-xl border-2 border-xp bg-gradient-to-br from-xp/20 via-surface to-accent/10 p-5">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-xp">🌟 Special Training · invite only</div>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">Welcome, {first}.</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          AS &amp; A Level Computer Science, built around a busy timetable. Short, focused work that sticks until exam day.
          Theory gets polished, then revised a little at a time, while programming grows alongside it in live sessions.
        </p>
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
          <div className="rounded-lg border-2 border-line bg-surface p-3"><b>📘 Theory</b><div className="text-muted">Command words + answer recipes below. Self-mark every worksheet first.</div></div>
          <div className="rounded-lg border-2 border-line bg-surface p-3"><b>💻 Programming</b><div className="text-muted">Pseudocode first. When it&apos;s right, build the VB.NET version.</div></div>
          <div className="rounded-lg border-2 border-line bg-surface p-3"><b>🔁 Keep it fresh</b><div className="text-muted">10 min/day in <Link className="font-bold underline" href="/practice">Fix my mistakes</Link> + a <Link className="font-bold underline" href="/arcade/trace-master">Trace Master Pro</Link> run.</div></div>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 text-sm">
        <a href="#words" className="chip">🗝️ Command words</a>
        <a href="#recipes" className="chip">🧱 Answer recipes</a>
        <a href="#ladder" className="chip">🪜 Programming ladder</a>
        <Link href="/arcade/trace-master" className="chip border-xp">🧮 Trace Master Pro</Link>
      </nav>

      <section id="words" className="card space-y-3">
        <div>
          <h2 className="font-display text-2xl">🗝️ Command words</h2>
          <p className="text-sm text-muted">The first word of a question tells you how to answer it. Read it, circle it, answer THAT, and nothing else.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {COMMAND_WORDS.map((c) => (
            <div key={c.word} className="rounded-lg border-2 border-line bg-surface2 p-3 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-1"><b className="text-base">{c.word}</b><span className="text-[11px] font-bold text-accent">{c.marks}</span></div>
              <p className="mt-1">{c.means}</p>
              <p className="mt-1 text-xs text-muted">e.g. {c.example}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="recipes" className="card space-y-3">
        <div>
          <h2 className="font-display text-2xl">🧱 Answer recipes</h2>
          <p className="text-sm text-muted">How to BUILD an answer the way examiners mark it. Try the question yourself first, then open the model answer.</p>
        </div>
        {ANSWER_RECIPES.map((r) => (
          <details key={r.title} className="rounded-lg border-2 border-line bg-surface2 p-3 text-sm">
            <summary className="cursor-pointer font-bold">{r.title}</summary>
            <ol className="mt-2 list-decimal space-y-0.5 pl-5">{r.recipe.map((x) => <li key={x}>{x}</li>)}</ol>
            <div className="mt-3 rounded border-2 border-dashed border-line p-2"><b>Try it:</b> {r.question}</div>
            <details className="mt-2">
              <summary className="cursor-pointer font-bold text-good">✅ Show the model answer</summary>
              <pre className="mt-1 whitespace-pre-wrap rounded bg-surface p-2 font-body">{r.model}</pre>
            </details>
            <div className="mt-2 rounded bg-bad/10 p-2"><b>⚠️ Common trap:</b> {r.trap}</div>
          </details>
        ))}
      </section>

      <section id="ladder" className="card space-y-3">
        <div>
          <h2 className="font-display text-2xl">🪜 Programming ladder</h2>
          <p className="text-sm text-muted">
            Small tasks first, exam-size later. For each task: write the <b>pseudocode</b> on paper → check it with your tutor → build the <b>VB.NET</b> version → test it.
            Only open the models AFTER you&apos;ve tried.
          </p>
        </div>
        {stages.map((st) => (
          <div key={st} className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-muted">Stage {st}</div>
            {LADDER.filter((t) => t.stage === st).map((t) => (
              <details key={t.title} className="rounded-lg border-2 border-line bg-surface2 p-3 text-sm">
                <summary className="cursor-pointer"><b>{t.title}</b> <span className="text-muted">· {t.task}</span></summary>
                <div className="mt-3 space-y-3">
                  <div className="rounded border-2 border-accent/50 bg-accent/5 p-2">
                    <b>🎙️ Be ready to answer:</b>
                    <ul className="mt-1 list-disc pl-5">{t.ask.map((q) => <li key={q}>{q}</li>)}</ul>
                  </div>
                  <details><summary className="cursor-pointer font-bold">📝 Model pseudocode</summary><div className="mt-2"><Code label="Pseudocode (9618 style)" lines={t.pseudo} /></div></details>
                  <details><summary className="cursor-pointer font-bold">💻 VB.NET version</summary><div className="mt-2"><Code label="VB.NET" lines={t.vb} /></div></details>
                </div>
              </details>
            ))}
          </div>
        ))}
      </section>

      <p className="pb-4 text-center text-xs text-muted">🌟 This page is only visible to you and your tutor. Model answers are Cambridge-style examples, not official mark schemes.</p>
    </div>
  );
}
