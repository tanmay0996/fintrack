import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./Navbar";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, FileText, Users, TrendingUp, X } from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard",       icon: LayoutDashboard, roles: ["VIEWER", "ANALYST", "ADMIN"] },
  { to: "/records",   label: "Records",          icon: FileText,        roles: ["VIEWER", "ANALYST", "ADMIN"] },
  { to: "/users",     label: "User Management",  icon: Users,           roles: ["ADMIN"] },
];

const SidebarContent = ({ onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-5 shrink-0" style={{ borderBottom: "1px solid oklch(0.93 0.008 240 / 7%)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
          >
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight gradient-text">FinTrack</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors lg:hidden">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 px-3 py-2">
          Navigation
        </p>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className="block"
            >
              <motion.div
                whileHover={{ x: 2 }}
                transition={{ duration: 0.15 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                  isActive
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.9) 0%, rgba(139,92,246,0.9) 100%)" }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10 shrink-0" />
                <span className="relative z-10">{item.label}</span>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 shrink-0" style={{ borderTop: "1px solid oklch(0.93 0.008 240 / 7%)" }}>
        <div className="px-3 py-2 rounded-xl" style={{ background: "oklch(0.93 0.008 240 / 4%)" }}>
          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            Logged in as <span className="text-muted-foreground font-medium">{user?.role}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex w-56 shrink-0 flex-col"
        style={{ background: "var(--sidebar)", borderRight: "1px solid oklch(0.93 0.008 240 / 7%)" }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", stiffness: 380, damping: 35 }}
              className="fixed top-0 left-0 h-full w-56 z-50 lg:hidden"
              style={{ background: "var(--sidebar)", borderRight: "1px solid oklch(0.93 0.008 240 / 7%)" }}
            >
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <Outlet />
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Layout;
