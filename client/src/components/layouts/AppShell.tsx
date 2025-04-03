import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Home,
  PlusCircle,
  ClipboardList,
  Shield,
  DollarSign,
  BarChart,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AppShellProps {
  children: React.ReactNode;
}

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Anasayfa",
    icon: <Home className="w-6 h-6 mr-3" />,
  },
  {
    href: "/suggestions/new",
    label: "Yeni Öneri Ekle",
    icon: <PlusCircle className="w-6 h-6 mr-3" />,
  },
  {
    href: "/suggestions",
    label: "Tüm Öneriler",
    icon: <ClipboardList className="w-6 h-6 mr-3" />,
  },
  {
    href: "/admin/review",
    label: "Öneri Değerlendirme",
    icon: <Shield className="w-6 h-6 mr-3" />,
    adminOnly: true,
  },
  {
    href: "/admin/rewards",
    label: "Ödül Yönetimi",
    icon: <DollarSign className="w-6 h-6 mr-3" />,
    adminOnly: true,
  },
  {
    href: "/admin/reports",
    label: "Raporlar",
    icon: <BarChart className="w-6 h-6 mr-3" />,
    adminOnly: true,
  },
];

export default function AppShell({ children }: AppShellProps) {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const isAdmin = user?.role === "admin";

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Çıkış yapılamadı",
        description: "Lütfen tekrar deneyin",
        variant: "destructive",
      });
    }
  };

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  const renderNavItem = (item: NavItem) => {
    if (item.adminOnly && !isAdmin) return null;

    return (
      <Link key={item.href} href={item.href}>
        <a
          className={cn(
            "flex items-center px-4 py-3 text-sm font-medium rounded-md group",
            location === item.href
              ? "text-white bg-primary hover:bg-primary/90"
              : "text-slate-700 hover:bg-slate-100"
          )}
        >
          {item.icon}
          <span>{item.label}</span>
        </a>
      </Link>
    );
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // If not logged in, show login form
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-slate-200 bg-white">
          <div className="flex items-center justify-center h-16 px-4 border-b border-slate-200 bg-primary">
            <h1 className="text-xl font-bold text-white">Kaizen Öneri Sistemi</h1>
          </div>
          <div className="flex flex-col flex-grow px-4 py-4 overflow-y-auto">
            <nav className="flex-1 space-y-1">
              {navItems.map(renderNavItem)}

              {isAdmin && (
                <div className="pt-4 mt-4 border-t border-slate-200">
                  <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Yönetici Paneli
                  </h3>
                </div>
              )}
            </nav>
          </div>
          
          {/* User profile section */}
          <div className="flex items-center p-4 border-t border-slate-200">
            <Avatar>
              <AvatarFallback className="bg-primary text-white">
                {user.fullName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-700">{user.fullName}</p>
              <p className="text-xs text-slate-500">{user.role === "admin" ? "Yönetici" : "Çalışan"}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto" 
              onClick={handleLogout}
            >
              Çıkış
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <div className="md:hidden fixed top-0 left-0 z-20 w-full bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            type="button"
            className="p-2 text-slate-600 rounded-md hover:bg-slate-100 focus:outline-none"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          <h1 className="text-lg font-bold text-primary">Kaizen Öneri Sistemi</h1>
          <div className="w-6"></div>
        </div>
      </div>

      {/* Mobile sidebar */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-10 bg-slate-800 bg-opacity-75">
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 bg-primary">
              <h1 className="text-xl font-bold text-white">Kaizen Öneri Sistemi</h1>
              <button
                type="button"
                className="p-2 text-white rounded-md hover:bg-primary-700 focus:outline-none"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex flex-col flex-grow px-4 py-4 overflow-y-auto">
              <nav className="flex-1 space-y-1">
                {navItems.map(renderNavItem)}

                {isAdmin && (
                  <div className="pt-4 mt-4 border-t border-slate-200">
                    <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Yönetici Paneli
                    </h3>
                  </div>
                )}
              </nav>
            </div>
            
            {/* User profile section */}
            <div className="flex items-center p-4 border-t border-slate-200">
              <Avatar>
                <AvatarFallback className="bg-primary text-white">
                  {user.fullName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-700">{user.fullName}</p>
                <p className="text-xs text-slate-500">{user.role === "admin" ? "Yönetici" : "Çalışan"}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-auto" 
                onClick={handleLogout}
              >
                Çıkış
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto pt-0 md:pt-0 mt-16 md:mt-0">
        {children}
      </main>
    </div>
  );
}

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError("Kullanıcı adı ve şifre gereklidir");
      return;
    }
    
    try {
      setIsLoading(true);
      setError("");
      
      await apiRequest("POST", "/api/auth/login", { username, password });
      window.location.href = "/";
    } catch (error) {
      setError("Kullanıcı adı veya şifre hatalı");
      toast({
        title: "Giriş başarısız",
        description: "Kullanıcı adı veya şifre hatalı",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-primary">Kaizen Öneri Sistemi</h1>
        <p className="mt-2 text-gray-600">Giriş yaparak önerilerinizi paylaşın</p>
      </div>
      
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Kullanıcı Adı
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Şifre
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
        
        <div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Button>
        </div>
      </form>
      
      <div className="mt-4 text-center text-sm text-gray-600">
        <p>Test Kullanıcıları:</p>
        <p className="mt-1">Admin: admin / admin123</p>
        <p>Çalışan: employee1 / employee123</p>
      </div>
    </div>
  );
}
