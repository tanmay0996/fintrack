import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import toast from "react-hot-toast";
import { LogOut, ChevronDown, Menu } from "lucide-react";

const ROLE_CONFIG = {
  ADMIN:   { label: "Admin",   color: "text-violet-400",  bg: "bg-violet-500/15 border-violet-500/25" },
  ANALYST: { label: "Analyst", color: "text-cyan-400",    bg: "bg-cyan-500/15 border-cyan-500/25" },
  VIEWER:  { label: "Viewer",  color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/25" },
};

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    try {
      await api.post("/api/v1/users/logout");
    } catch {
      // clear local state regardless
    }
    logout();
    toast.success("Signed out");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const roleConf = ROLE_CONFIG[user?.role] || ROLE_CONFIG.VIEWER;

  return (
    <motion.header
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-14 flex items-center justify-between px-4 lg:px-6 shrink-0"
      style={{ borderBottom: "1px solid oklch(0.93 0.008 240 / 7%)" }}
    >
      {/* Mobile hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium text-muted-foreground hidden sm:block">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </span>
      </div>

      {/* Right: role badge + custom user dropdown */}
      <div className="flex items-center gap-3">
        <span className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${roleConf.bg} ${roleConf.color}`}>
          {roleConf.label}
        </span>

        <div className="relative" ref={dropdownRef}>
          {/* Trigger */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setOpen((p) => !p)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors outline-none"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
            >
              {initials}
            </div>
            <span className="hidden sm:block text-sm font-medium text-foreground leading-tight">
              {user?.name}
            </span>
            <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </motion.span>
          </motion.button>

          {/* Dropdown panel */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 top-full mt-2 w-52 rounded-xl shadow-2xl z-50 overflow-hidden"
                style={{
                  background: "oklch(0.14 0.022 265)",
                  border: "1px solid oklch(0.93 0.008 240 / 12%)",
                }}
              >
                {/* User info */}
                <div className="px-4 py-3" style={{ borderBottom: "1px solid oklch(0.93 0.008 240 / 8%)" }}>
                  <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{user?.email}</p>
                </div>

                {/* Sign out */}
                <div className="p-1.5">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
};

export default Navbar;
