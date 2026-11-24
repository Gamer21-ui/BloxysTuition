"use client";
import { useState, useTransition } from "react";
import { setStudentStatus } from "../actions";

/** Approve (choosing their class first) / suspend buttons for a student. */
export function StatusButtons({ id, status, tier = "O" }: { id: string; status: string; tier?: string }) {
  const [pending, start] = useTransition();
  const [cls, setCls] = useState(tier as "O" | "AS" | "A");
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "approved" && (
        <>
          <select value={cls} onChange={(e) => setCls(e.target.value as "O" | "AS" | "A")} className="input h-8 w-auto py-0 text-sm" aria-label="Class">
            <option value="O">O Level class</option>
            <option value="AS">AS Level class</option>
            <option value="A">A Level class</option>
          </select>
          <button className="btn btn-primary btn-sm" disabled={pending} onClick={() => start(() => setStudentStatus(id, "approved", cls))}>Approve</button>
        </>
      )}
      {status !== "suspended" && <button className="btn btn-danger btn-sm" disabled={pending}
        onClick={() => { if (confirm("Suspend this account? They won't be able to sign in until you approve them again.")) start(() => setStudentStatus(id, "suspended")); }}>Suspend</button>}
    </div>
  );
}
