import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { UserSkeleton } from "./Skeleton";
import PageTransition from "./PageTransition";
import {
  UserPlus, X, Loader2, Shield, Eye, BarChart2,
  ToggleLeft, ToggleRight, Trash2, Search, Users,
} from "lucide-react";

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["VIEWER", "ANALYST", "ADMIN"]),
});

const ROLE_CONFIG = {
  ADMIN:   { label: "Admin",   icon: Shield,   color: "text-violet-400", bg: "bg-violet-500/15 border-violet-500/30" },
  ANALYST: { label: "Analyst", icon: BarChart2, color: "text-cyan-400",   bg: "bg-cyan-500/15 border-cyan-500/30" },
  VIEWER:  { label: "Viewer",  icon: Eye,       color: "text-emerald-400",bg: "bg-emerald-500/15 border-emerald-500/30" },
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#6366f1,#8b5cf6)",
  "linear-gradient(135deg,#06b6d4,#6366f1)",
  "linear-gradient(135deg,#10b981,#06b6d4)",
  "linear-gradient(135deg,#f59e0b,#f43f5e)",
  "linear-gradient(135deg,#8b5cf6,#e879f9)",
  "linear-gradient(135deg,#fb923c,#f43f5e)",
];

const avatarGradient = (email) =>
  AVATAR_GRADIENTS[(email?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];

const inputClass = (hasError) =>
  `w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-200 outline-none text-foreground placeholder:text-muted-foreground/40
  focus:ring-2 focus:ring-primary/40 focus:border-primary/50
  ${hasError ? "bg-rose-500/8 border border-rose-500/40" : "bg-white/5 border border-white/8 hover:border-white/15"}`;

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [roleChanging, setRoleChanging] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(createUserSchema), defaultValues: { role: "VIEWER" } });

  const roleValue = watch("role");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      const res = await api.get("/api/v1/users", params);
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch (err) {
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const handleCreateUser = async (data) => {
    try {
      await api.post("/api/v1/users", data);
      toast.success("User created successfully");
      reset({ role: "VIEWER" });
      setFormOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || "Failed to create user");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setRoleChanging(userId);
    try {
      await api.patch(`/api/v1/users/${userId}`, { role: newRole });
      toast.success("Role updated");
      fetchUsers();
    } catch (err) {
      toast.error(err.message || "Failed to update role");
    } finally {
      setRoleChanging(null);
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    setTogglingId(userId);
    try {
      await api.patch(`/api/v1/users/${userId}`, { isActive: !currentStatus });
      toast.success(`User ${!currentStatus ? "activated" : "deactivated"}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm("Permanently delete this user and all their records?")) return;
    setDeletingId(userId);
    try {
      await api.delete(`/api/v1/users/${userId}`);
      toast.success("User deleted");
      fetchUsers();
    } catch (err) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-5 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{total} total users</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { reset({ role: "VIEWER" }); setFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white self-start sm:self-auto"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/8 hover:border-white/15 focus:border-primary/50 focus:ring-2 focus:ring-primary/30 outline-none text-foreground placeholder:text-muted-foreground/40 transition-all"
          />
        </div>

        {/* Users list */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "oklch(0.115 0.022 265)", border: "1px solid oklch(0.93 0.008 240 / 7%)" }}>
          {/* Column headers */}
          <div className="grid px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50"
            style={{ gridTemplateColumns: "1fr 100px 80px 100px 100px", borderBottom: "1px solid oklch(0.93 0.008 240 / 7%)" }}>
            <span>User</span>
            <span>Role</span>
            <span>Status</span>
            <span className="text-center">Joined</span>
            <span className="text-right">Actions</span>
          </div>

          {loading ? (
            <div className="p-5"><UserSkeleton rows={5} /></div>
          ) : users.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: "oklch(0.93 0.008 240 / 6%)" }}>
                <Users className="w-5 h-5 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">No users found</p>
            </motion.div>
          ) : (
            <AnimatePresence initial={false}>
              {users.map((u, i) => {
                const conf = ROLE_CONFIG[u.role] || ROLE_CONFIG.VIEWER;
                const RoleIcon = conf.icon;
                const isSelf = u.id === currentUser.id;
                const isDeleting = deletingId === u.id;
                const isToggling = togglingId === u.id;
                const isRoleChanging = roleChanging === u.id;

                return (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                    className="grid px-5 py-3.5 items-center group transition-colors hover:bg-white/[0.025]"
                    style={{
                      gridTemplateColumns: "1fr 100px 80px 100px 100px",
                      borderBottom: "1px solid oklch(0.93 0.008 240 / 5%)",
                      opacity: isDeleting ? 0.4 : 1,
                    }}
                  >
                    {/* Avatar + name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ background: avatarGradient(u.email) }}
                      >
                        {u.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-foreground/90 truncate">{u.name}</p>
                          {isSelf && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md text-primary font-semibold"
                              style={{ background: "rgba(99,102,241,0.12)" }}>
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>

                    {/* Role selector */}
                    <div className="relative">
                      {isSelf ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${conf.bg} ${conf.color}`}>
                          <RoleIcon className="w-3 h-3" />
                          {conf.label}
                        </span>
                      ) : (
                        <div className="flex gap-1 flex-wrap">
                          {Object.entries(ROLE_CONFIG).map(([role, rc]) => {
                            const Ic = rc.icon;
                            return (
                              <motion.button
                                key={role}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleRoleChange(u.id, role)}
                                disabled={isRoleChanging}
                                title={rc.label}
                                className={`p-1.5 rounded-lg transition-all border ${
                                  u.role === role
                                    ? `${rc.bg} ${rc.color}`
                                    : "bg-white/4 border-white/7 text-muted-foreground/40 hover:text-muted-foreground hover:border-white/15"
                                }`}
                              >
                                <Ic className="w-3.5 h-3.5" />
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Active toggle */}
                    <div>
                      {isSelf ? (
                        <span className="text-xs text-emerald-400 font-medium">Active</span>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleToggleActive(u.id, u.isActive)}
                          disabled={isToggling}
                          className={`flex items-center gap-1 transition-colors ${
                            u.isActive ? "text-emerald-400 hover:text-emerald-300" : "text-muted-foreground/40 hover:text-muted-foreground"
                          }`}
                          title={u.isActive ? "Deactivate" : "Activate"}
                        >
                          {u.isActive
                            ? <ToggleRight className="w-5 h-5" />
                            : <ToggleLeft className="w-5 h-5" />
                          }
                          <span className="text-xs">{u.isActive ? "Active" : "Off"}</span>
                        </motion.button>
                      )}
                    </div>

                    {/* Joined date */}
                    <span className="text-xs text-muted-foreground text-center">
                      {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                    </span>

                    {/* Delete */}
                    <div className="flex justify-end">
                      {!isSelf && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(u.id)}
                          disabled={isDeleting}
                          className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-rose-400 hover:bg-rose-400/10 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Role legend */}
        <div className="flex flex-wrap gap-3 px-1">
          {Object.entries(ROLE_CONFIG).map(([role, rc]) => {
            const Ic = rc.icon;
            return (
              <div key={role} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${rc.bg} ${rc.color}`}>
                <Ic className="w-3 h-3" />
                {rc.label} — {role === "ADMIN" ? "Full access" : role === "ANALYST" ? "View + analytics" : "View only"}
              </div>
            );
          })}
        </div>

        {/* Create user modal */}
        <AnimatePresence>
          {formOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setFormOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 16 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
                style={{ background: "oklch(0.115 0.022 265)", border: "1px solid oklch(0.93 0.008 240 / 10%)" }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4"
                  style={{ borderBottom: "1px solid oklch(0.93 0.008 240 / 8%)" }}>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Create New User</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Add a new team member</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setFormOpen(false)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/8 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(handleCreateUser)} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Full Name</label>
                    <input placeholder="Jane Doe" {...register("name")} className={inputClass(!!errors.name)} />
                    {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
                    <input type="email" placeholder="jane@example.com" {...register("email")} className={inputClass(!!errors.email)} />
                    {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Password</label>
                    <input type="password" placeholder="Min 6 characters" {...register("password")} className={inputClass(!!errors.password)} />
                    {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-2">Role</label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(ROLE_CONFIG).map(([role, rc]) => {
                        const Ic = rc.icon;
                        return (
                          <motion.button
                            key={role}
                            type="button"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setValue("role", role)}
                            className={`flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                              roleValue === role ? `${rc.bg} ${rc.color}` : "bg-white/5 border-white/8 text-muted-foreground hover:border-white/15"
                            }`}
                          >
                            <Ic className="w-4 h-4" />
                            {rc.label}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFormOpen(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium text-muted-foreground transition-colors"
                      style={{ background: "oklch(0.93 0.008 240 / 6%)", border: "1px solid oklch(0.93 0.008 240 / 10%)" }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60"
                      style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create User"}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default UserManagement;
