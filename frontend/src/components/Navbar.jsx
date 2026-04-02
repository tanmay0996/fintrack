import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import toast from "react-hot-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const roleBadgeVariant = {
  ADMIN: "destructive",
  ANALYST: "default",
  VIEWER: "secondary",
};

const Navbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await api.post("/api/v1/users/logout");
    } catch {
      // ignore — clear local state regardless
    }
    logout();
    toast.success("Logged out");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-lg tracking-tight">FinTrack</span>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={roleBadgeVariant[user?.role] || "secondary"}>
          {user?.role}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="outline-none">
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="font-medium">{user?.name}</div>
              <div className="text-xs text-muted-foreground font-normal truncate">
                {user?.email}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive cursor-pointer"
              onClick={handleLogout}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Navbar;
