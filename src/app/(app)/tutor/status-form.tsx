import { setStatus } from "./actions";

const toLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() + 4 * 3600_000).toISOString().slice(0, 16) : "");

/** Draft / locked / scheduled / published picker (times are Mauritius time). */
export function StatusForm({ table, id, status, releaseAt }: { table: string; id: string; status: string; releaseAt: string | null }) {
  return (
    <form action={setStatus} className="flex flex-wrap items-center gap-1.5">
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={id} />
      <select name="status" defaultValue={status} className="input h-8 w-auto py-0 text-xs" aria-label="Status">
        <option value="draft">draft (hidden)</option>
        <option value="locked">locked (visible, closed)</option>
        <option value="scheduled">scheduled</option>
        <option value="published">published</option>
      </select>
      <input type="datetime-local" name="release_at" defaultValue={toLocal(releaseAt)} className="input h-8 w-auto py-0 text-xs" aria-label="Release time" />
      <button className="btn btn-ghost btn-sm">Save</button>
    </form>
  );
}
