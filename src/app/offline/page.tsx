export const metadata = { title: "Offline" };
export default function Offline() {
  return (
    <main className="grid min-h-dvh place-items-center p-5">
      <div className="card max-w-sm text-center">
        <h1 className="text-3xl">You're offline</h1>
        <p className="mt-2 text-muted">No connection right now. Your progress is saved on the server, so reconnect and pick up where you left off.</p>
      </div>
    </main>
  );
}
