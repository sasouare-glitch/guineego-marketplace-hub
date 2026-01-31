import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

const data7Days = [
  { name: "Lun", ventes: 450000, commandes: 12 },
  { name: "Mar", ventes: 380000, commandes: 8 },
  { name: "Mer", ventes: 520000, commandes: 15 },
  { name: "Jeu", ventes: 680000, commandes: 18 },
  { name: "Ven", ventes: 890000, commandes: 24 },
  { name: "Sam", ventes: 1250000, commandes: 32 },
  { name: "Dim", ventes: 750000, commandes: 20 },
];

const data30Days = [
  { name: "S1", ventes: 2450000, commandes: 65 },
  { name: "S2", ventes: 3180000, commandes: 82 },
  { name: "S3", ventes: 2920000, commandes: 74 },
  { name: "S4", ventes: 4680000, commandes: 118 },
];

const periods = [
  { label: "7 jours", value: "7d" },
  { label: "30 jours", value: "30d" },
];

const formatValue = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
};

export function SalesChart() {
  const [period, setPeriod] = useState("7d");
  const data = period === "7d" ? data7Days : data30Days;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-card rounded-xl border border-border shadow-sm p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Évolution des ventes
          </h3>
          <p className="text-sm text-muted-foreground">
            Chiffre d'affaires sur la période
          </p>
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {periods.map((p) => (
            <Button
              key={p.value}
              variant="ghost"
              size="sm"
              className={cn(
                "text-xs",
                period === p.value && "bg-background shadow-sm"
              )}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(152, 81%, 39%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(152, 81%, 39%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tickFormatter={formatValue}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value: number) => [
                `${value.toLocaleString("fr-GN")} GNF`,
                "Ventes",
              ]}
            />
            <Area
              type="monotone"
              dataKey="ventes"
              stroke="hsl(152, 81%, 39%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorVentes)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
