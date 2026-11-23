import { updateQuestion } from "../../actions";

/** Inline edit form for one question (server action, works without JavaScript). */
export function QuestionEditor({ q, correct }: { q: { id: string; prompt: string; options: string[]; explanation: string | null; battle_ok: boolean }; correct: number | undefined }) {
  return (
    <details className="mt-1">
      <summary className="cursor-pointer text-xs font-bold text-accent">edit</summary>
      <form action={updateQuestion} className="mt-2 grid gap-2 rounded border-2 border-line p-3">
        <input type="hidden" name="id" value={q.id} />
        <textarea name="prompt" required defaultValue={q.prompt} className="input" aria-label="Question" />
        {[0, 1, 2, 3].map((i) => (
          <label key={i} className="flex items-center gap-2">
            <input type="radio" name="correct" value={i} defaultChecked={i === correct} aria-label={`Option ${i + 1} is correct`} />
            <input name={`o${i}`} defaultValue={q.options[i] || ""} className="input" placeholder={`Option ${i + 1}${i < 2 ? "" : " (optional)"}`} required={i < 2} />
          </label>
        ))}
        <textarea name="explanation" defaultValue={q.explanation || ""} className="input" placeholder="Why the right answer is right (and the tempting wrong one is wrong)" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="battle_ok" defaultChecked={q.battle_ok} /> Use in battles and speedruns</label>
        <button className="btn btn-primary btn-sm">Save question</button>
        <p className="text-xs text-muted">Tick the circle next to the correct option. Students see the options in this order.</p>
      </form>
    </details>
  );
}
