import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const TOKENS = {
  vital: "#2FE6C4",
  pulse: "#FF4D5E",
  amber: "#F5B942",
  mist: "#8CA0C4",
  line: "#243350",
  surface2: "#16223A",
  paper: "#EAF0FB",
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-line rounded-lg px-3 py-2 shadow-xl text-xs">
      {label && <div className="text-mist mb-1">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-paper font-mono">{p.value}</span>
          {p.name && <span className="text-mist">{p.name}</span>}
        </div>
      ))}
    </div>
  );
}

// Smooth filled area chart — used for time-series trends (requests/day, logins/day…)
export function TrendArea({ data, dataKey = "value", color = TOKENS.vital, height = 220 }) {
  const gradId = `grad-${dataKey}-${color.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={TOKENS.line} strokeDasharray="3 6" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: TOKENS.mist, fontSize: 11 }} axisLine={{ stroke: TOKENS.line }} tickLine={false} />
        <YAxis tick={{ fill: TOKENS.mist, fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: TOKENS.line }} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill={`url(#${gradId})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Grouped/simple bar chart — used for category comparisons (by role, by hospital…)
export function CategoryBar({ data, dataKey = "value", color = TOKENS.vital, height = 220 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={TOKENS.line} strokeDasharray="3 6" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: TOKENS.mist, fontSize: 11 }} axisLine={{ stroke: TOKENS.line }} tickLine={false} />
        <YAxis tick={{ fill: TOKENS.mist, fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const DONUT_COLORS = [TOKENS.vital, TOKENS.pulse, TOKENS.amber, TOKENS.mist, "#5B8DEF"];

// Donut/pie chart with center label — used for status/role composition.
export function StatusDonut({ data, height = 220, centerLabel, centerValue }) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="90%" paddingAngle={3} stroke="none">
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color || DONUT_COLORS[i % DONUT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue !== undefined) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="font-display text-2xl font-semibold text-paper">{centerValue}</div>
          <div className="text-[11px] text-mist uppercase tracking-wide">{centerLabel}</div>
        </div>
      )}
    </div>
  );
}

export function ChartLegend({ items }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5 text-xs text-mist">
          <span className="w-2 h-2 rounded-full" style={{ background: it.color }} />
          {it.label} <span className="text-paper font-mono">{it.value}</span>
        </div>
      ))}
    </div>
  );
}
