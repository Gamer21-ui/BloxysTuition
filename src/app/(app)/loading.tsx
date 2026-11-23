/** Shown instantly while a page loads, so clicks feel responsive. */
export default function Loading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-56 rounded bg-surface2" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card h-32 bg-surface2/60" />)}
      </div>
    </div>
  );
}
