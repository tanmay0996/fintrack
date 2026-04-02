import { Outlet, NavLink } from "react-router-dom";
import Navbar from "./Navbar";
import { useAuth } from "../context/AuthContext";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { to: "/dashboard", label: "Dashboard", roles: ["VIEWER", "ANALYST", "ADMIN"] },
  { to: "/records", label: "Records", roles: ["VIEWER", "ANALYST", "ADMIN"] },
  { to: "/users", label: "User Management", roles: ["ADMIN"] },
];

const Layout = () => {
  const { user } = useAuth();

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-52 border-r bg-background flex flex-col py-4 shrink-0">
          <nav className="flex flex-col gap-1 px-3">
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 overflow-auto p-6 bg-muted/30">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
