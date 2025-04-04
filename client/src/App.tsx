import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import SuggestionsList from "@/pages/SuggestionsList";
import CreateSuggestion from "@/pages/CreateSuggestion";
import AdminPanel from "@/pages/AdminPanel";
import UserAdmin from "@/pages/UserAdmin";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { User } from "@shared/schema";

export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
};

function App() {
  const [location, setLocation] = useLocation();
  const { data, isLoading } = useQuery<{ user: User | null }>({
    queryKey: ["/api/auth/user"],
  });

  const user = data?.user || null;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user && location !== "/login") {
      setLocation("/login");
    }
  }, [user, isLoading, location, setLocation]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} isLoading={isLoading} />

      <main className="flex-grow container mx-auto px-4 py-6">
        <Switch>
          <Route path="/login" component={() => <LoginPage />} />
          <Route path="/" component={Dashboard} />
          <Route path="/suggestions" component={SuggestionsList} />
          <Route path="/create" component={CreateSuggestion} />
          <Route
            path="/admin"
            component={() => {
              if (user?.isAdmin) {
                return <AdminPanel />;
              } else {
                // Admin olmayan kullanıcılar için yönlendirme
                setTimeout(() => setLocation("/"), 0);
                return (
                  <div>
                    Yetkisiz erişim, ana sayfaya yönlendiriliyorsunuz...
                  </div>
                );
              }
            }}
          />
          <Route
            path="/users"
            component={() => {
              if (user?.isAdmin) {
                return <UserAdmin />;
              } else {
                // Admin olmayan kullanıcılar için yönlendirme
                setTimeout(() => setLocation("/"), 0);
                return (
                  <div>
                    Yetkisiz erişim, ana sayfaya yönlendiriliyorsunuz...
                  </div>
                );
              }
            }}
          />
          <Route component={NotFound} />
        </Switch>
      </main>

      <Footer />
      <Toaster />
    </div>
  );
}

function LoginPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: employeeId, password }), // username parametresi sicil no için kullanılıyor
        credentials: "include",
      });

      if (response.ok) {
        // Oturum açma başarılı, sayfayı yenileyelim (zorla yeniden yükleme)
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        window.location.href = "/"; // Sayfayı tamamen yeniden yükle
      } else {
        const data = await response.json();
        setError(data.message || "Giriş başarısız");
      }
    } catch (err: any) {
      setError(err.message || "Beklenmeyen bir hata oluştu");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">
            Kaizen Öneri Sistemi
          </h1>
          <p className="mt-2 text-gray-600">
            Giriş yaparak önerilerinizi paylaşabilirsiniz
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>
        )}

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div>
            <label
              htmlFor="employeeId"
              className="block text-sm font-medium text-gray-700"
            >
              Sicil Numarası
            </label>
            <input
              id="employeeId"
              name="employeeId"
              type="text"
              required
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Sicil numaranızı girin"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Şifre
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 text-white bg-primary rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Giriş Yap
            </button>
          </div>

          <div className="text-sm text-center text-gray-500">
            <p>Sicil No: 1001, Şifre: admin123 (Genel Müdür)</p>
            <p>Sicil No: 2001, Şifre: manager123 (Bölüm Müdürü)</p>
            <p>Sicil No: 3001, Şifre: employee123 (Çalışan)</p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
