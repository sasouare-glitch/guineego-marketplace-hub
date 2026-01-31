import { useState } from "react";
import { motion } from "framer-motion";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const performanceData = [
  { month: "Jan", value: 45000000, profit: 0 },
  { month: "Fév", value: 46200000, profit: 1200000 },
  { month: "Mar", value: 47800000, profit: 2800000 },
  { month: "Avr", value: 48500000, profit: 3500000 },
  { month: "Mai", value: 50200000, profit: 5200000 },
  { month: "Juin", value: 51800000, profit: 6800000 },
  { month: "Juil", value: 52500000, profit: 7500000 },
  { month: "Août", value: 54250000, profit: 8750000 },
];

const allocationData = [
  { name: "E-commerce", value: 35, color: "hsl(152, 81%, 39%)" },
  { name: "Immobilier", value: 25, color: "hsl(38, 96%, 51%)" },
  { name: "Agriculture", value: 20, color: "hsl(217, 91%, 60%)" },
  { name: "Transit", value: 15, color: "hsl(280, 85%, 65%)" },
  { name: "Crypto", value: 5, color: "hsl(4, 83%, 56%)" },
];

const periods = ["7J", "1M", "3M", "6M", "1A", "Tout"];

export const PortfolioChart = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("6M");

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Performance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display font-semibold text-foreground">Performance du portfolio</h3>
            <p className="text-sm text-muted-foreground">Évolution de votre capital</p>
          </div>
          <div className="flex gap-1 bg-secondary rounded-lg p-1">
            {periods.map((period) => (
              <Button
                key={period}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3",
                  selectedPeriod === period && "bg-background shadow-sm"
                )}
                onClick={() => setSelectedPeriod(period)}
              >
                {period}
              </Button>
            ))}
          </div>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(152, 81%, 39%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(152, 81%, 39%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={formatValue}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-lg)'
                }}
                formatter={(value: number) => [`${value.toLocaleString()} GNF`, 'Valeur']}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(152, 81%, 39%)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Allocation Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl p-6 border border-border"
      >
        <div className="mb-6">
          <h3 className="font-display font-semibold text-foreground">Répartition</h3>
          <p className="text-sm text-muted-foreground">Par secteur d'activité</p>
        </div>

        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px'
                }}
                formatter={(value: number) => [`${value}%`, 'Part']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3 mt-4">
          {allocationData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{item.value}%</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
