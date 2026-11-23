"use client";
import { useTransition } from "react";
import { setStudentStatus } from "../actions";

export function StatusButtons({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const go = (s: "approved" | "suspended") => start(() => setStudentStatus(id, s));
  return (
    <div className="flex gap-2">
      {status !== "approved" && <button className="btn btn-primary btn-sm" disabled={pending} onClick={() => go("approved")}>Approve</button>}
      {status !== "suspended" && <button className="btn btn-danger btn-sm" disabled={pending}
        onClick={() => { if (confirm("Suspend this account? They won't be able to sign in until you approve them again.")) go("suspended"); }}>Suspend</button>}
    </div>
  );
}
