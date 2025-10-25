import { ReactNode, useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Home, Upload, PlaySquare, User, Search, Menu, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Browse", path: "/browse" },
    { icon: Upload, label: "Upload", path: "/upload" },
    { icon: PlaySquare, label: "My Videos", path: "/dashboard" },
    { icon: Heart, label: "Favorites", path: "/favorites" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  const NavContent = () => (
    <nav className="flex flex-col gap-2">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
              isActive
                ? "bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 text-white backdrop-blur-sm border border-white/10 hover-glow"
                : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-white"
            )
          }
        >
          <item.icon className="h-5 w-5" />
          <span>{item.label}</span>
        </NavLink>
      ))}
      <Button
        onClick={handleLogout}
        variant="ghost"
        className="justify-start text-sidebar-foreground/80 hover:bg-white/5 hover:text-white mt-4"
      >
        Logout
      </Button>
    </nav>
  );

  if (!user) return null;

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Desktop Sidebar */}
     <aside className="hidden md:flex w-64 bg-sidebar-background border-r border-sidebar-border flex-col p-4">
  <div className="mb-8">
    <div className="flex flex-col items-center gap-2 mb-2">
      <img src="/logo.png" alt="KLH Tube Logo" className="h-25 w-auto" />
    </div>
    <p className="text-sm text-sidebar-foreground/60 text-center">Educational Videos of KLH</p>
  </div>

  <NavContent />
</aside>


      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 glass-sidebar p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="KLH Tube Logo" className="h-10 w-auto hover-glow" />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white/80 hover:text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="glass-sidebar border-0">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <img src="/logo.png" alt="KLH Tube Logo" className="h-12 w-auto hover-glow" />
                  <h1 className="text-xl font-bold gradient-text">KLH Tube</h1>
                </div>
                <p className="text-sm text-white/60">Educational Videos of KLH</p>
              </div>
              <NavContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:mt-0 mt-16">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
