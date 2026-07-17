"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface VisibilityTrendProps {
  data: Array<{ date: string; readiness: number; mentions: number }>;
}

export function VisibilityTrend({ data }: VisibilityTrendProps) {
  return (
    <div>
      <p className="sr-only">ارتفعت جاهزية المتجر من {data[0]?.readiness} إلى {data.at(-1)?.readiness} خلال سبعة أيام. الظهور الفعلي معروض منفصلًا في قسم الظهور.</p>
      <div aria-hidden="true" className="h-64 w-full" dir="ltr">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis axisLine={false} dataKey="date" fontSize={11} tickLine={false} />
            <YAxis axisLine={false} domain={[60, 80]} fontSize={11} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, borderColor: "var(--border)", fontFamily: "inherit" }} formatter={(value) => [`${value}/100`, "الجاهزية"]} />
            <Line activeDot={{ r: 5 }} dataKey="readiness" dot={false} stroke="var(--primary)" strokeWidth={3} type="monotone" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
