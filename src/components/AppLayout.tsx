import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { TrendingUp, Calculator, Flame, Heart, Menu, X, LayoutDashboard } from "lucide-react";
import { useState } from "react";

const navItems = [
  { path: "/", label: "Home", icon: null },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/score", label: "Health Score", icon: TrendingUp },
  { path: "/tax", label: "Tax Optimizer", icon: Calculator },
  { path: "/fire", label: "FIRE Planner", icon: Flame },
  { path: "/life-event", label: "Life Events", icon: Heart },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">₹</span>
            </div>
            <span className="font-display font-bold text-lg text-foreground">
              AI Money <span className="text-gradient-gold">Mentor</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-muted-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/50 bg-card/95 backdrop-blur-xl">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <main className="pt-16">{children}</main>
    </div>
  );
}
