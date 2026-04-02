import { useState, useEffect } from "react";
import { api } from "../utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [summaryRes, trendsRes] = await Promise.all([
          api.get("/api/v1/dashboard/summary"),
          api.get("/api/v1/dashboard/trends"),
        ]);
        setSummary(summaryRes.data);
        setTrends(trendsRes.data);
      } catch (err) {
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="text-muted-foreground text-sm">Loading dashboard...</div>;
  if (error) return <div className="text-destructive text-sm">{error}</div>;

  const maxTrendValue = Math.max(...(trends?.trends.map((t) => Math.max(t.income, t.expenses)) || [1]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{fmt(summary.totalIncome)}</div>
            <p className="text-xs text-muted-foreground mt-1">{summary.incomeCount} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{fmt(summary.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">{summary.expenseCount} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.netBalance >= 0 ? "text-green-600" : "text-red-500"}`}>
              {fmt(summary.netBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.netBalance >= 0 ? "Surplus" : "Deficit"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      {trends && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Trends ({trends.year})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trends.trends.map((m) => {
                const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                const monthName = months[parseInt(m.month) - 1];
                return (
                  <div key={m.month} className="flex items-center gap-3 text-sm">
                    <span className="w-8 text-muted-foreground text-xs">{monthName}</span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 rounded bg-green-500"
                          style={{ width: `${maxTrendValue ? (m.income / maxTrendValue) * 100 : 0}%`, minWidth: m.income > 0 ? "4px" : "0" }}
                        />
                        <span className="text-xs text-muted-foreground">{fmt(m.income)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 rounded bg-red-400"
                          style={{ width: `${maxTrendValue ? (m.expenses / maxTrendValue) * 100 : 0}%`, minWidth: m.expenses > 0 ? "4px" : "0" }}
                        />
                        <span className="text-xs text-muted-foreground">{fmt(m.expenses)}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-medium w-24 text-right ${m.net >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {fmt(m.net)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-500 inline-block" /> Income</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-400 inline-block" /> Expenses</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      {summary?.categoryTotals?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.categoryTotals.slice(0, 8).map((c, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={c.type === "INCOME" ? "outline" : "secondary"} className="text-xs">
                      {c.type}
                    </Badge>
                    <span>{c.category}</span>
                  </div>
                  <span className={`font-medium ${c.type === "INCOME" ? "text-green-600" : "text-red-500"}`}>
                    {fmt(c._sum.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {summary?.recentActivity?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.recentActivity.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                  <div>
                    <span className="font-medium">{r.category}</span>
                    {r.notes && <span className="text-muted-foreground ml-2 text-xs">— {r.notes}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                    <span className={`font-semibold ${r.type === "INCOME" ? "text-green-600" : "text-red-500"}`}>
                      {r.type === "INCOME" ? "+" : "-"}{fmt(r.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
