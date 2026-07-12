"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export type ReportsPaymentChartDatum = {
  name: string;
  value: number;
  color: string;
};

type ReportsPaymentChartProps = {
  data: ReportsPaymentChartDatum[];
};

export function ReportsPaymentChart({ data }: ReportsPaymentChartProps) {
  return (
    <div className="w-full">
      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={3}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [
                new Intl.NumberFormat("tr-TR", {
                  style: "currency",
                  currency: "TRY",
                  maximumFractionDigits: 0,
                }).format(value),
                name,
              ]}
              contentStyle={{
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                boxShadow: "0 12px 30px rgb(15 23 42 / 0.12)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {data.map((entry) => (
          <div
            key={entry.name}
            className="inline-flex items-center gap-2 text-sm leading-none text-slate-700"
          >
            <span
              className="inline-block size-3 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-semibold">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
