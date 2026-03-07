import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DeliveryMission } from "@/hooks/useCourierMissions";
import { useMemo } from "react";

interface EarningsChartProps {
  missions?: DeliveryMission[];
}

export const EarningsChart = ({ missions = [] }: EarningsChartProps) => {
  const { data, total } = useMemo(() => {
    const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const now = new Date();
    const weekData: Record<string, number> = {};

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      weekData[dayNames[d.getDay()]] = 0;
    }

    // Aggregate delivered missions
    const delivered = missions.filter((m) => m.status === "delivered" && m.deliveredAt);
    delivered.forEach((m) => {
      const date = m.deliveredAt?.toDate?.() ? m.deliveredAt.toDate() : new Date(m.deliveredAt as any);
      const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        const dayName = dayNames[date.getDay()];
        if (dayName in weekData) {
          weekData[dayName] += m.fee || 0;
        }
      }
    });

    const chartData = Object.entries(weekData).map(([day, earnings]) => ({ day, earnings }));
    const totalEarnings = chartData.reduce((sum, d) => sum + d.earnings, 0);

    return { data: chartData, total: totalEarnings };
  }, [missions]);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-display text-lg">Revenus de la semaine</CardTitle>
        <p className="text-2xl font-bold text-guinea-green">{total.toLocaleString("fr-GN")} GNF</p>
        <p className="text-sm text-muted-foreground">
          {data.filter((d) => d.earnings > 0).length} jours actifs
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(152, 81%, 39%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(152, 81%, 39%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} className="text-xs text-muted-foreground" />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}K`} className="text-xs text-muted-foreground" />
              <Tooltip
                formatter={(value: number) => [`${value.toLocaleString("fr-GN")} GNF`, "Revenus"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Area type="monotone" dataKey="earnings" stroke="hsl(152, 81%, 39%)" strokeWidth={2} fill="url(#earningsGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
