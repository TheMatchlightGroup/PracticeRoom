import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context-supabase";
import { Button } from "@/components/ui/button";
import NotificationCenter from "@/components/NotificationCenter";
import { useNotifications } from "@/hooks/useNotifications";
import {
  LayoutDashboard,
  Music,
  BookOpen,
  Brain,
  Mic,
  ShoppingBag,
  MessageSquare,
  User,
  Settings,
  LogOut,
  CreditCard,
  CheckCircle,
  Users,
  Share2,
  Zap,
  Search,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Array<"student" | "teacher" | "admin">;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  // Student-only items
  { label: "Repertoire", href: "/repertoire", icon: Music, roles: ["student"] },
  { label: "Practice Plan", href: "/practice-plan", icon: BookOpen, roles: ["student"] },
  { label: "Memorization", href: "/memorization", icon: Brain, roles: ["student"] },
  { label: "Audio Check", href: "/audio-check", icon: Mic, roles: ["student"] },
  // Role-specific items
  { label: "Submissions", href: "/submissions", icon: CheckCircle, roles: ["teacher"] },
  { label: "Find Teachers", href: "/teacher-search", icon: Users, roles: ["student"] },
  { label: "Find Students", href: "/student-search", icon: Users, roles: ["teacher"] },
  { label: "Requests", href: "/requests", icon: Share2 },
  // Teacher-only items
  { label: "Assign", href: "/assign", icon: Zap, roles: ["teacher"] },
  { label: "Music Search", href: "/music-search", icon: Search, roles: ["teacher"] },
  // Shared items
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Subscription", href: "/subscription", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { notifications, unreadCount, markAsRead, deleteNotification } =
    useNotifications();

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role || "student");
  });

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-screen fixed left-0 top-0 pt-8 px-6">
        {/* Logo and Notifications */}
        <div className="mb-12 flex items-start justify-between">
          <div>
            <Link to="/" className="text-2xl font-serif font-semibold text-primary">
              PracticeRoom
            </Link>
            <p className="text-xs text-muted-foreground mt-1 font-sans">
              Classical Music Studio
            </p>
          </div>
          <NotificationCenter
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
          />
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-2 mb-8">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        {user && (
          <div className="border-t border-sidebar-border pt-4">
            <div className="mb-4">
              <p className="text-sm font-medium text-sidebar-foreground">
                {user.name}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {user.role}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3">
        <div className="flex justify-around items-center gap-2">
          {filteredNavItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-md text-xs font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:block">{item.label}</span>
              </Link>
            );
          })}

          {/* More menu for mobile */}
          <Link
            to="/profile"
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-md text-xs font-medium transition-colors",
              location.pathname === "/profile"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <User className="w-5 h-5" />
            <span className="hidden sm:block">More</span>
          </Link>
        </div>
      </nav>
    </>
  );
};

export const MainContent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="lg:ml-64 pb-24 lg:pb-8 min-h-screen bg-background">
      <div className="p-4 sm:p-8">{children}</div>
    </div>
  );
};
