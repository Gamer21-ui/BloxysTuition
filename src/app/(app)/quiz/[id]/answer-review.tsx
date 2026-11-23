import { Check, X } from "lucide-react";

export type ReviewQ = { id: string; prompt: string; options: string[] };
export type ReviewResult = { id: string; choice: number | null; correct: number; right: boolean; explanation: string | null };
const LETTERS = ["A", "B", "C", "D", "E"];

/** Question-by-question review shown after a quiz or exam. */
export function AnswerReview({ qs, results, onlyWrong = false }: { qs: ReviewQ[]; results: ReviewResult[]; onlyWrong?: boolean }) {
  const list = qs.map((q, k) => ({ q, k, r: results.find((x) => x.id === q.id) })).filter((x) => !onlyWrong || !x.r?.right);
  if (!list.length) return <p className="card text-center text-muted">Nothing wrong to review. 🎉</p>;
  return (
    <div className="space-y-3">
      {list.map(({ q, k, r }) => (
        <div key={q.id} className="card">
          <div className="flex gap-2">
            {r?.right ? <Check className="shrink-0 text-good" aria-label="Correct" /> : <X className="shrink-0 text-bad" aria-label="Wrong" />}
            <div className="font-bold">{k + 1}. {q.prompt}</div>
          </div>
          {r?.choice === null || r?.choice === undefined ? <div className="mt-1 text-xs font-bold text-warn">Not answered</div> : null}
          <div className="mt-2 grid gap-1.5 text-sm">
            {q.options.map((o, oi) => (
              <div key={oi} className={`border-2 px-3 py-1.5 ${oi === r?.correct ? "border-good bg-good/10" : oi === r?.choice ? "border-bad bg-bad/10" : "border-transparent"}`} style={{ borderRadius: "calc(var(--radius)*.5)" }}>
                {LETTERS[oi]}. {o}
              </div>
            ))}
          </div>
          {r?.explanation && <p className="mt-2 text-sm text-muted">💡 {r.explanation}</p>}
        </div>
      ))}
    </div>
  );
}
