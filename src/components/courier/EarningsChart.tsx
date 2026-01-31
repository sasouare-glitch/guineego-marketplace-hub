import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { day: "Lun", earnings: 85000 },
  { day: "Mar", earnings: 120000 },
  { day: "Mer", earnings: 95000 },
  { day: "Jeu", earnings: 145000 },
  { day: "Ven", earnings: 180000 },
  { day: "Sam", earnings: 210000 },
  { day: "Dim", earnings: 125000 },
];

export const EarningsChart = () => {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-display text-lg">Revenus de la semaine</CardTitle>
        <p className="text-2xl font-bold text-guinea-green">960 000 GNF</p>
        <p className="text-sm text-muted-foreground">+12% vs semaine précédente</p>
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
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                className="text-xs text-muted-foreground"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value / 1000}K`}
                className="text-xs text-muted-foreground"
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toLocaleString('fr-GN')} GNF`, 'Revenus']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Area 
                type="monotone" 
                dataKey="earnings" 
                stroke="hsl(152, 81%, 39%)" 
                strokeWidth={2}
                fill="url(#earningsGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
