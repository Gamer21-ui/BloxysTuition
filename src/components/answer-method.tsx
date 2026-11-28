/**
 * The tutor's way of answering Business questions: explain the HOW and the WHY to someone who
 * knows no business, in five steps (Knowledge → Understanding → Application → Reasoning → "it depends").
 * Shown (collapsed) on every Business course and chapter page. No client code needed.
 */
const STEPS = [
  { k: "K", name: "Knowledge", ask: "What is it?", tip: "Define the term as if the reader has never heard of it.", aos: "AO1",
    ex: "Break-even is the level of output where total revenue equals total costs, so the business makes neither a profit nor a loss." },
  { k: "U", name: "Understanding (the HOW)", ask: "How does it work?", tip: "Explain the process or the working, step by step.", aos: "AO1",
    ex: "It is found by dividing fixed costs by the contribution per unit (selling price − variable cost). Every unit sold after break-even adds its contribution to profit." },
  { k: "A", name: "Application", ask: "What does it mean for THIS business?", tip: "Use the case: names, products, numbers. Never a generic answer.", aos: "AO2",
    ex: "Sana's Bakery has fixed costs of $1 200 a month and sells cakes at $10 that cost $4 to make. Each cake contributes $6, so she breaks even at 1 200 ÷ 6 = 200 cakes. She sells 260, so her margin of safety is 60 cakes." },
  { k: "R", name: "Reasoning (the WHY)", ask: "Why does it matter? Overall, what does this mean?", tip: "Link the chain: \"this means that… which leads to… so…\"", aos: "AO3",
    ex: "Overall, this means Sana knows the minimum she must sell to stop losing money, so she can set a sales target and plan her finance. Because she is 60 cakes above break-even, a small drop in sales would not cause a loss." },
  { k: "D", name: "It depends (balance + judgement)", ask: "When would it NOT be right? Is it still right overall?", tip: "\"However, this depends on… and on… Even so, it is still… because…\"", aos: "AO4",
    ex: "However, this depends on her costs and prices staying the same, and on selling every cake she bakes. If flour prices rise, her break-even point goes up. Even so, break-even is still useful because it gives Sana a clear target and can be worked out again whenever costs change." },
];

const STARTERS = ["This means that…", "This is because…", "As a result…", "This leads to…", "However, this depends on…", "On the other hand…", "Even so / Overall…"];

export function AnswerMethod({ compact = false }: { compact?: boolean }) {
  return (
    <details className="card group" open={!compact}>
      <summary className="flex cursor-pointer list-none items-center gap-2">
        <span className="shrink-0 whitespace-nowrap font-mono text-sm font-bold text-accent">[KUARD]</span>
        <span className="font-display text-lg">How to answer Business questions</span>
        <span className="ml-auto text-xs text-muted group-open:hidden">tap to open</span>
      </summary>
      <div className="mt-3 space-y-3 text-sm">
        <p>
          Every question has a <b>how</b> and a <b>why</b>. Write as if you&apos;re explaining to someone who knows <b>nothing</b> about business:
          say what it is, how it works, what it means for this business, why it matters, and when it might not be right.
        </p>
        <div className="rounded border-2 border-line bg-surface2 p-2 text-xs">
          <b>Example question:</b> Explain why breaking even is important for Sana&apos;s Bakery. Each step below adds one part of the answer.
        </div>
        <ol className="space-y-2">
          {STEPS.map((s) => (
            <li key={s.k} className="rounded border-2 border-line p-2">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-accent font-mono text-xs font-bold text-white">{s.k}</span>
                <b>{s.name}</b>
                <span className="text-muted">{s.ask}</span>
                <span className="ml-auto font-mono text-[10px] text-muted">{s.aos}</span>
              </div>
              <div className="mt-1 text-xs text-muted">{s.tip}</div>
              <p className="mt-1 border-l-4 border-accent/50 pl-2 italic">{s.ex}</p>
            </li>
          ))}
        </ol>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted">Linking words that earn marks</div>
          <div className="mt-1 flex flex-wrap gap-1.5">{STARTERS.map((x) => <span key={x} className="chip text-xs">{x}</span>)}</div>
        </div>
        <p className="text-xs text-muted">
          Short &quot;state/identify&quot; questions only need <b>K</b>. &quot;Explain&quot; needs <b>K → U → A → R</b>. &quot;Discuss / recommend / justify&quot; needs all five, ending with a clear decision.
          The AO labels are Cambridge&apos;s marking areas: application (AO2) carries 30% of the marks in the new syllabus, so always use the case.
        </p>
      </div>
    </details>
  );
}
