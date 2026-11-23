"use client";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/** Exam scores over time, one line per subject. */
export function ScoreChart({ rows, series }: { rows: Record<string, string | number | null>[]; series: { key: string; name: string; color: string }[] }) {
  const axis = { stroke: "rgb(var(--muted))", fontSize: 12 };
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="rgb(var(--line))" strokeDasharray="3 3" />
        <XAxis dataKey="label" {...axis} />
        <YAxis domain={[0, 100]} unit="%" {...axis} />
        <Tooltip contentStyle={{ background: "rgb(var(--surface))", border: "2px solid rgb(var(--line))", borderRadius: 8, color: "rgb(var(--ink))" }} formatter={(v) => `${v}%`} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s) => <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={3} connectNulls dot={{ r: 4 }} />)}
      </LineChart>
    </ResponsiveContainer>
  );
}
