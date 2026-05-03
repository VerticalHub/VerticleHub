import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceSparklineProps {
  industry: string;
  currentPrice?: number;
  compact?: boolean;
}

export default function PriceSparkline({ industry, currentPrice, compact = false }: PriceSparklineProps) {
  const { data: resp, isLoading } = useQuery<any>({
    queryKey: ["/api/price-history", industry],
    queryFn: () => fetch(`/api/price-history?industry=${encodeURIComponent(industry)}`).then(r => r.json()),
    staleTime: 120_000,
  });

  const hist = resp?.data;
  const daily: any[] = hist?.daily ?? [];
  const trend: "up" | "down" = hist?.trend ?? "up";
  const changePct: number = hist?.changePct ?? 0;
  const color = trend === "up" ? "#00d084" : "#ff4d4d";

  if (isLoading) {
    return (
      <div className={`${compact ? "w-16 h-6" : "w-full h-16"} shimmer rounded`} />
    );
  }

  if (!daily.length) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <div className="w-16 h-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily} margin={{ top: 1, right: 0, bottom: 1, left: 0 }}>
              <defs>
                <linearGradient id={`sg-${industry}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="price"
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#sg-${industry})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-0.5">
          {trend === "up"
            ? <TrendingUp className="w-2.5 h-2.5" style={{ color }} />
            : <TrendingDown className="w-2.5 h-2.5" style={{ color }} />}
          <span className="text-[9px] font-mono num" style={{ color }}>
            {changePct >= 0 ? "+" : ""}{changePct}%
          </span>
        </div>
      </div>
    );
  }

  // Full chart for modal
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {trend === "up"
            ? <TrendingUp className="w-3.5 h-3.5 text-[#00d084]" />
            : <TrendingDown className="w-3.5 h-3.5 text-[#ff4d4d]" />}
          <span className="text-[10px] font-mono font-bold" style={{ color }}>
            {changePct >= 0 ? "+" : ""}{changePct}% (30d)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono text-[#3a5070]">
            LOW <span className="text-[#94b4d4] num">${hist?.minPrice?.toFixed(2)}</span>
          </span>
          <span className="text-[9px] font-mono text-[#3a5070]">
            HIGH <span className="text-[#94b4d4] num">${hist?.maxPrice?.toFixed(2)}</span>
          </span>
          <span className="text-[9px] font-mono text-[#3a5070]">
            NOW <span className="num font-bold" style={{ color }}>${hist?.currentPrice?.toFixed(2)}</span>
          </span>
        </div>
      </div>
      <div className="w-full h-28">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={daily} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
            <defs>
              <linearGradient id={`grad-${industry}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              contentStyle={{ background: "#0a1120", border: "1px solid #1e2d4a", fontFamily: "monospace", fontSize: 10, color: "#c8daf0" }}
              formatter={(v: any) => [`$${Number(v).toFixed(2)}`, "Avg Price"]}
              labelFormatter={(l: string) => l}
              cursor={{ stroke: "#2563eb", strokeWidth: 1, strokeDasharray: "3 3" }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#grad-${industry})`}
              dot={(props: any) => {
                if (!props.payload?.real) return <g key={props.key} />;
                return <circle key={props.key} cx={props.cx} cy={props.cy} r={2.5} fill={color} stroke="#0a1120" strokeWidth={1} />;
              }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-between text-[8px] font-mono text-[#2a4060]">
        <span>{daily[0]?.label}</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00d084] inline-block" /> Real transaction
          <span className="w-1.5 h-1.5 rounded-full bg-[#2a4060] inline-block ml-2" /> Estimated
        </span>
        <span>{daily[daily.length - 1]?.label}</span>
      </div>
    </div>
  );
}
