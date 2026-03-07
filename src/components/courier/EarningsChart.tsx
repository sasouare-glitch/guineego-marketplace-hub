import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DeliveryMission } from "@/hooks/useCourierMissions";
import { useMemo } from "react";
import { startOfDay, startOfWeek, startOfMonth, startOfYear, subDays, format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
import { fr } from "date-fns/locale";

export type EarningsPeriod = "today" | "week" | "month" | "year";

interface EarningsChartProps {
  missions?: DeliveryMission[];
  period?: EarningsPeriod;
}

function getMissionDate(m: DeliveryMission): Date | null {
  const raw = m.deliveredAt || m.createdAt;
  if (!raw) return null;
  const d = (raw as any)?.toDate?.() ? (raw as any).toDate() : new Date(raw as any);
  return isNaN(d.getTime()) ? null : d;
}

export const EarningsChart = ({ missions = [], period = "week" }: EarningsChartProps) => {
  const { data, total, title } = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let chartTitle: string;

    switch (period) {
      case "today":
        startDate = startOfDay(now);
        chartTitle = "Revenus d'aujourd'hui";
        break;
      case "week":
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        chartTitle = "Revenus de la semaine";
        break;
      case "month":
        startDate = startOfMonth(now);
        chartTitle = "Revenus du mois";
        break;
      case "year":
        startDate = startOfYear(now);
        chartTitle = "Revenus de l'année";
        break;
      default:
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        chartTitle = "Revenus de la semaine";
    }

    // Filter delivered missions in period
    const delivered = missions.filter((m) => {
      if (m.status !== "delivered") return false;
      const d = getMissionDate(m);
      return d && d >= startDate && d <= now;
    });

    // Build chart data based on period
    let chartData: { label: string; earnings: number }[] = [];

    if (period === "today") {
      // Group by hour
      const hours: Record<string, number> = {};
      for (let h = 0; h <= now.getHours(); h++) {
        hours[`${h}h`] = 0;
      }
      delivered.forEach((m) => {
        const d = getMissionDate(m);
        if (d) hours[`${d.getHours()}h`] = (hours[`${d.getHours()}h`] || 0) + (m.fee || 0);
      });
      chartData = Object.entries(hours).map(([label, earnings]) => ({ label, earnings }));
    } else if (period === "week") {
      const days = eachDayOfInterval({ start: startDate, end: now });
      const dayMap: Record<string, number> = {};
      days.forEach((d) => {
        dayMap[format(d, "EEE", { locale: fr })] = 0;
      });
      delivered.forEach((m) => {
        const d = getMissionDate(m);
        if (d) {
          const key = format(d, "EEE", { locale: fr });
          if (key in dayMap) dayMap[key] += m.fee || 0;
        }
      });
      chartData = Object.entries(dayMap).map(([label, earnings]) => ({ label, earnings }));
    } else if (period === "month") {
      const days = eachDayOfInterval({ start: startDate, end: now });
      const dayMap: Record<string, number> = {};
      days.forEach((d) => {
        dayMap[format(d, "dd", { locale: fr })] = 0;
      });
      delivered.forEach((m) => {
        const d = getMissionDate(m);
        if (d) {
          const key = format(d, "dd", { locale: fr });
          if (key in dayMap) dayMap[key] += m.fee || 0;
        }
      });
      chartData = Object.entries(dayMap).map(([label, earnings]) => ({ label, earnings }));
    } else if (period === "year") {
      const months = eachMonthOfInterval({ start: startDate, end: now });
      const monthMap: Record<string, number> = {};
      months.forEach((d) => {
        monthMap[format(d, "MMM", { locale: fr })] = 0;
      });
      delivered.forEach((m) => {
        const d = getMissionDate(m);
        if (d) {
          const key = format(d, "MMM", { locale: fr });
          if (key in monthMap) monthMap[key] += m.fee || 0;
        }
      });
      chartData = Object.entries(monthMap).map(([label, earnings]) => ({ label, earnings }));
    }

    const totalEarnings = chartData.reduce((sum, d) => sum + d.earnings, 0);
    return { data: chartData, total: totalEarnings, title: chartTitle };
  }, [missions, period]);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-display text-lg">{title}</CardTitle>
        <p className="text-2xl font-bold text-guinea-green">{total.toLocaleString("fr-GN")} GNF</p>
        <p className="text-sm text-muted-foreground">
          {data.filter((d) => d.earnings > 0).length} {period === "today" ? "heures actives" : period === "year" ? "mois actifs" : "jours actifs"}
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
              <XAxis dataKey="label" axisLine={false} tickLine={false} className="text-xs text-muted-foreground" />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => value >= 1000 ? `${value / 1000}K` : `${value}`} className="text-xs text-muted-foreground" />
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
