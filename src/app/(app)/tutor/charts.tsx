"use client";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const axis = { stroke: "rgb(var(--muted))", fontSize: 12 };
const tip = { contentStyle: { background: "rgb(var(--surface))", border: "2px solid rgb(var(--line))", borderRadius: 8, color: "rgb(var(--ink))" } };

export function XpLine({ data }: { data: { day: string; xp: number; active: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="rgb(var(--line))" strokeDasharray="3 3" />
        <XAxis dataKey="day" {...axis} />
        <YAxis {...axis} />
        <Tooltip {...tip} />
        <Line type="monotone" dataKey="xp" name="XP earned" stroke="rgb(var(--primary))" strokeWidth={3} dot={false} />
        <Line type="monotone" dataKey="active" name="Active students" stroke="rgb(var(--accent))" strokeWidth={2} dot={false} yAxisId={0} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ScoreBars({ data }: { data: { name: string; pct: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="rgb(var(--line))" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" {...axis} />
        <YAxis domain={[0, 100]} {...axis} />
        <Tooltip {...tip} formatter={(v) => `${v}%`} />
        <Bar dataKey="pct" name="Average score" fill="rgb(var(--accent))" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
