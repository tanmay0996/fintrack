import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import RecordForm from "./RecordForm";
import { TableSkeleton } from "./Skeleton";
import PageTransition from "./PageTransition";
import { CATEGORIES } from "../utils/constants";
import {
  Plus, Search, Filter, ChevronLeft, ChevronRight,
  Pencil, Trash2, X, ArrowUpDown,
} from "lucide-react";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const CATEGORY_COLORS = {
  Salary: "#10b981", Freelance: "#06b6d4", Investment: "#6366f1",
  Business: "#8b5cf6", Food: "#f59e0b", Transport: "#84cc16",
  Housing: "#f43f5e", Utilities: "#fb923c", Healthcare: "#e879f9",
  Entertainment: "#38bdf8", Education: "#a78bfa", Shopping: "#fbbf24", Other: "#94a3b8",
};

const LIMIT = 15;

const FilterChip = ({ label, value, onClear }) => (
  <motion.span
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-primary"
    style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}
  >
    {label}: {value}
    <button onClick={onClear} className="hover:text-white transition-colors">
      <X className="w-3 h-3" />
    </button>
  </motion.span>
);

const RecordsTable = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ type: "", category: "", search: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: LIMIT };
      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;
      const res = await api.get("/api/v1/records", params);
      setRecords(res.data.records);
      setTotal(res.data.total);
    } catch (err) {
      setError(err.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this record?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/v1/records/${id}`);
      toast.success("Record deleted");
      fetchRecords();
    } catch (err) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const setFilter = (key, value) => {
    setFilters((p) => ({ ...p, [key]: value }));
    setPage(1);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <PageTransition>
      <div className="space-y-5 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Financial Records</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {total > 0 ? `${total} transactions found` : "No transactions yet"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowFilters((p) => !p)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                showFilters || activeFilterCount > 0
                  ? "text-primary border-primary/30"
                  : "text-muted-foreground border-white/8 hover:border-white/15 hover:text-foreground"
              }`}
              style={{ background: showFilters || activeFilterCount > 0 ? "rgba(99,102,241,0.1)" : "oklch(0.93 0.008 240 / 4%)" }}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </motion.button>

            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setEditRecord(null); setFormOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
              >
                <Plus className="w-4 h-4" />
                Add Record
              </motion.button>
            )}
          </div>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl p-4 space-y-3"
                style={{ background: "oklch(0.115 0.022 265)", border: "1px solid oklch(0.93 0.008 240 / 7%)" }}>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by category or notes..."
                    value={filters.search}
                    onChange={(e) => setFilter("search", e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-white/5 border border-white/8 hover:border-white/15 focus:border-primary/50 focus:ring-2 focus:ring-primary/30 outline-none text-foreground placeholder:text-muted-foreground/40 transition-all"
                  />
                </div>
                {/* Type pills */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground self-center mr-1">Type:</span>
                  {["", "INCOME", "EXPENSE"].map((t) => (
                    <motion.button
                      key={t || "all"}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setFilter("type", t)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                        filters.type === t
                          ? t === "INCOME"
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                            : t === "EXPENSE"
                            ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                            : "bg-primary/20 border-primary/40 text-primary"
                          : "bg-white/5 border-white/8 text-muted-foreground hover:border-white/15"
                      }`}
                    >
                      {t === "" ? "All" : t === "INCOME" ? "↑ Income" : "↓ Expense"}
                    </motion.button>
                  ))}
                </div>
                {/* Category pills */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs text-muted-foreground self-center mr-1">Category:</span>
                  {CATEGORIES.map((c) => (
                    <motion.button
                      key={c}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setFilter("category", filters.category === c ? "" : c)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                        filters.category === c
                          ? "border-primary/50 text-primary"
                          : "bg-white/5 border-white/7 text-muted-foreground hover:border-white/15"
                      }`}
                      style={filters.category === c ? { background: "rgba(99,102,241,0.15)" } : {}}
                    >
                      {c}
                    </motion.button>
                  ))}
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => { setFilters({ type: "", category: "", search: "" }); setPage(1); }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active filter chips */}
        <AnimatePresence>
          {activeFilterCount > 0 && !showFilters && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap gap-2"
            >
              {filters.type && (
                <FilterChip label="Type" value={filters.type} onClear={() => setFilter("type", "")} />
              )}
              {filters.category && (
                <FilterChip label="Category" value={filters.category} onClear={() => setFilter("category", "")} />
              )}
              {filters.search && (
                <FilterChip label="Search" value={`"${filters.search}"`} onClear={() => setFilter("search", "")} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="p-4 rounded-xl text-sm text-rose-400" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)" }}>
            {error}
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "oklch(0.115 0.022 265)", border: "1px solid oklch(0.93 0.008 240 / 7%)" }}>
          {/* Table header */}
          <div className="grid px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60"
            style={{
              gridTemplateColumns: isAdmin ? "1fr 90px 100px 1fr 120px 100px" : "1fr 90px 100px 1fr 120px",
              borderBottom: "1px solid oklch(0.93 0.008 240 / 7%)",
            }}>
            <span className="flex items-center gap-1">Date <ArrowUpDown className="w-3 h-3" /></span>
            <span>Type</span>
            <span>Category</span>
            <span>Notes</span>
            <span className="text-right">Amount</span>
            {isAdmin && <span className="text-right">Actions</span>}
          </div>

          {/* Rows */}
          <div>
            {loading ? (
              <div className="p-4"><TableSkeleton rows={8} /></div>
            ) : records.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: "oklch(0.93 0.008 240 / 6%)" }}>
                  <Search className="w-5 h-5 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-foreground/60">No records found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeFilterCount > 0 ? "Try adjusting your filters" : "Add your first financial record"}
                </p>
              </motion.div>
            ) : (
              <AnimatePresence initial={false}>
                {records.map((r, i) => {
                  const catColor = CATEGORY_COLORS[r.category] || "#94a3b8";
                  const isDeleting = deletingId === r.id;
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.03, duration: 0.25 }}
                      className="grid px-4 py-3 text-sm items-center group transition-colors hover:bg-white/[0.03]"
                      style={{
                        gridTemplateColumns: isAdmin ? "1fr 90px 100px 1fr 120px 100px" : "1fr 90px 100px 1fr 120px",
                        borderBottom: "1px solid oklch(0.93 0.008 240 / 5%)",
                        opacity: isDeleting ? 0.5 : 1,
                      }}
                    >
                      {/* Date */}
                      <span className="text-foreground/70 text-xs">
                        {new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>

                      {/* Type badge */}
                      <span>
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold border"
                          style={r.type === "INCOME"
                            ? { background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#34d399" }
                            : { background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.25)", color: "#fb7185" }
                          }
                        >
                          {r.type === "INCOME" ? "↑" : "↓"} {r.type}
                        </span>
                      </span>

                      {/* Category dot */}
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: catColor }} />
                        <span className="text-foreground/80 text-xs truncate">{r.category}</span>
                      </span>

                      {/* Notes */}
                      <span className="text-muted-foreground text-xs truncate pr-4">
                        {r.notes || <span className="opacity-30">—</span>}
                      </span>

                      {/* Amount */}
                      <span className={`text-right font-semibold ${r.type === "INCOME" ? "text-emerald-400" : "text-rose-400"}`}>
                        {r.type === "INCOME" ? "+" : "-"}{fmt(r.amount)}
                      </span>

                      {/* Actions */}
                      {isAdmin && (
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => { setEditRecord(r); setFormOpen(true); }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(r.id)}
                            disabled={isDeleting}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-xs text-muted-foreground">
              Showing {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} of {total}
            </span>
            <div className="flex items-center gap-1.5">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:text-foreground"
                style={{ background: "oklch(0.115 0.022 265)", border: "1px solid oklch(0.93 0.008 240 / 8%)" }}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </motion.button>
              <span className="px-3 py-1.5 rounded-xl text-xs font-medium"
                style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8" }}>
                {page} / {totalPages}
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:text-foreground"
                style={{ background: "oklch(0.115 0.022 265)", border: "1px solid oklch(0.93 0.008 240 / 8%)" }}
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </motion.div>
        )}

        <RecordForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          record={editRecord}
          onSaved={fetchRecords}
        />
      </div>
    </PageTransition>
  );
};

export default RecordsTable;
