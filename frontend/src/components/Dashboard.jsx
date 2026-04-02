import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from "recharts";
import { api } from "../utils/api";
import { DashboardSkeleton } from "./Skeleton";
import PageTransition from "./PageTransition";
import {
  TrendingUp, TrendingDown, Wallet,
  ArrowUpRight, ArrowDownRight, Activity,
} from "lucide-react";

/* ── helpers ── */
const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    notation: Math.abs(n) >= 1_00_000 ? "compact" : "standard",
  }).format(n);

const fmtFull = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CATEGORY_COLORS = [
  "#6366f1","#8b5cf6","#06b6d4","#10b981","#f59e0b",
  "#f43f5e","#84cc16","#fb923c","#e879f9","#38bdf8",
];

/* ── Count-up animation hook ── */
const useCountUp = (target, duration = 1400) => {
  const [value, setValue] = useState(0);
  const startTime = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    startTime.current = null;
    const step = (ts) => {
      if (!startTime.current) startTime.current = ts;
      const progress = Math.min((ts - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
};

/* ── Custom tooltip ── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl px-3 py-2.5 shadow-xl border-white/8 text-sm">
      <p className="text-muted-foreground text-xs mb-1.5 font-medium">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
          <span className="text-foreground/80 capitalize">{entry.name}:</span>
          <span className="text-foreground font-semibold">{fmtFull(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

/* ── Stat card ── */
const StatCard = ({ title, value, subtitle, icon: Icon, gradient, delay = 0 }) => {
  const animated = useCountUp(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="relative rounded-2xl p-6 overflow-hidden cursor-default"
      style={{ background: "oklch(0.115 0.022 265)" }}
    >
      {/* gradient glow overlay */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{ background: gradient }}
      />
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2 opacity-[0.12] pointer-events-none"
        style={{ background: gradient }}
      />
      {/* border */}
      <div className="absolute inset-0 rounded-2xl border border-white/6 pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-1.5 tracking-tight">
            {fmt(animated)}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 opacity-90"
          style={{ background: gradient }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

/* ── Main Dashboard ── */
const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [sRes, tRes] = await Promise.all([
          api.get("/api/v1/dashboard/summary"),
          api.get("/api/v1/dashboard/trends"),
        ]);
        setSummary(sRes.data);
        setTrends(tRes.data);
      } catch (err) {
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-destructive text-sm">{error}</p>
    </div>
  );

  /* Prep chart data */
  const trendData = trends?.trends.map((t) => ({
    month: MONTHS[parseInt(t.month) - 1],
    income: t.income,
    expenses: t.expenses,
    net: t.net,
  })) || [];

  /* Category data — top 8 */
  const categoryMap = {};
  for (const c of summary?.categoryTotals || []) {
    if (!categoryMap[c.category]) categoryMap[c.category] = { name: c.category, total: 0 };
    categoryMap[c.category].total += c._sum.amount;
  }
  const categoryData = Object.values(categoryMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  return (
    <PageTransition>
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Financial overview and analytics</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-muted-foreground"
            style={{ background: "oklch(0.93 0.008 240 / 5%)", border: "1px solid oklch(0.93 0.008 240 / 8%)" }}>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Live data
          </div>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Income"
            value={summary.totalIncome}
            subtitle={`${summary.incomeCount} transactions`}
            icon={ArrowUpRight}
            gradient="linear-gradient(135deg, #10b981 0%, #06b6d4 100%)"
            delay={0.05}
          />
          <StatCard
            title="Total Expenses"
            value={summary.totalExpenses}
            subtitle={`${summary.expenseCount} transactions`}
            icon={ArrowDownRight}
            gradient="linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)"
            delay={0.1}
          />
          <StatCard
            title="Net Balance"
            value={Math.abs(summary.netBalance)}
            subtitle={summary.netBalance >= 0 ? "Surplus this period" : "Deficit this period"}
            icon={summary.netBalance >= 0 ? TrendingUp : TrendingDown}
            gradient={summary.netBalance >= 0
              ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
              : "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)"}
            delay={0.15}
          />
        </div>

        {/* Area chart — monthly trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-2xl p-6"
          style={{ background: "oklch(0.115 0.022 265)", border: "1px solid oklch(0.93 0.008 240 / 6%)" }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Monthly Trends</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{trends?.year} overview</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,255,255,0.05)", strokeWidth: 2 }} />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }}
                formatter={(v) => <span style={{ color: "#94a3b8", textTransform: "capitalize" }}>{v}</span>} />
              <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5}
                fill="url(#incomeGrad)" dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: "#10b981" }} />
              <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2.5}
                fill="url(#expenseGrad)" dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: "#f43f5e" }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Bottom row: category bar + recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Category bar chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="rounded-2xl p-6"
            style={{ background: "oklch(0.115 0.022 265)", border: "1px solid oklch(0.93 0.008 240 / 6%)" }}
          >
            <h2 className="text-base font-semibold text-foreground mb-1">Spending by Category</h2>
            <p className="text-xs text-muted-foreground mb-5">Top categories across all records</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="total" radius={[0, 6, 6, 0]} maxBarSize={18}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Recent activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="rounded-2xl p-6"
            style={{ background: "oklch(0.115 0.022 265)", border: "1px solid oklch(0.93 0.008 240 / 6%)" }}
          >
            <h2 className="text-base font-semibold text-foreground mb-1">Recent Activity</h2>
            <p className="text-xs text-muted-foreground mb-4">Latest 10 transactions</p>
            <div className="space-y-1 overflow-y-auto max-h-[236px] pr-1">
              {(summary?.recentActivity || []).map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.04 }}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl transition-colors hover:bg-white/4 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold text-white"
                      style={{
                        background: r.type === "INCOME"
                          ? "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)"
                          : "linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)",
                      }}
                    >
                      {r.type === "INCOME" ? "↑" : "↓"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground/90 truncate">{r.category}</p>
                      {r.notes && <p className="text-xs text-muted-foreground truncate">{r.notes}</p>}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className={`text-sm font-semibold ${r.type === "INCOME" ? "text-emerald-400" : "text-rose-400"}`}>
                      {r.type === "INCOME" ? "+" : "-"}{fmt(r.amount)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Dashboard;
