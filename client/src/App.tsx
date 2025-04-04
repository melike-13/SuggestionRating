import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import SuggestionsList from "@/pages/SuggestionsList";
import CreateSuggestion from "@/pages/CreateSuggestion";
import AdminPanel from "@/pages/AdminPanel";
import UserAdmin from "@/pages/UserAdmin";
import SuggestionTypeSelection from "@/pages/SuggestionTypeSelection";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState, useEffect, createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  selectedSuggestionType: string | null;
  setSelectedSuggestionType: (type: string | null) => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

function App() {
  const [location, setLocation] = useLocation();
  const [selectedSuggestionType, setSelectedSuggestionType] = useState<string | null>(
    localStorage.getItem("selectedSuggestionType")
  );
  
  const { data, isLoading } = useQuery<{ user: User | null }>({
    queryKey: ["/api/auth/user"],
  });

  const user = data?.user || null;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user && location !== "/login") {
      setLocation("/login");
      // Clear suggestion type when logging out
      setSelectedSuggestionType(null);
      localStorage.removeItem("selectedSuggestionType");
    }
  }, [user, isLoading, location, setLocation]);

  return (
    <AuthContext.Provider value={{ user, isLoading, selectedSuggestionType, setSelectedSuggestionType }}>
      <div className="min-h-screen flex flex-col">
        <Header user={user} isLoading={isLoading} />

        <main className="flex-grow container mx-auto px-4 py-6">
          {!isLoading && (
            <>
              {!user ? (
                <Switch>
                  <Route path="/login" component={() => <LoginPage />} />
                  <Route component={() => <LoginPage />} />
                </Switch>
              ) : (
                <>
                  {!selectedSuggestionType ? (
                    <Switch>
                      <Route path="/select-type" component={() => <SuggestionTypeSelection user={user} />} />
                      <Route component={() => <SuggestionTypeSelection user={user} />} />
                    </Switch>
                  ) : (
                    <Switch>
                      <Route path="/login" component={() => <LoginPage />} />
                      <Route path="/select-type" component={() => <SuggestionTypeSelection user={user} />} />
                      <Route path="/" component={Dashboard} />
                      <Route path="/dashboard" component={Dashboard} />
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
                  )}
                </>
              )}
            </>
          )}
        </main>

        <Footer />
        <Toaster />
      </div>
    </AuthContext.Provider>
  );
}

function LoginPage() {
  const [employeeId, setEmployeeId] = useState("");
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
        body: JSON.stringify({ 
          username: employeeId,
          // Şifre artık gerekli değil, sicil no aynı zamanda şifre olarak kullanılacak
          // Passport yapılandırması bunu destekleyecek şekilde değiştirildi
        }),
        credentials: "include",
      });

      if (response.ok) {
        // Oturum açma başarılı, sayfayı yenileyelim (zorla yeniden yükleme)
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        window.location.href = "/"; // Sayfayı tamamen yeniden yükle
      } else {
        const data = await response.json();
        setError(data.message || "Geçersiz sicil numarası");
      }
    } catch (err: any) {
      setError(err.message || "Beklenmeyen bir hata oluştu");
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col md:flex-row items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary mb-1">
            <span className="font-extrabold">LAV</span> Kaizen Öneri Sistemi
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
            <button
              type="submit"
              className="w-full px-4 py-2 text-white bg-primary rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Giriş Yap
            </button>
          </div>

          <div className="text-sm text-center text-gray-500">
            <p className="mb-1">Örnek kullanıcılar:</p>
            <p>Sicil No: 1001 (Genel Müdür)</p>
            <p>Sicil No: 2001 (Bölüm Müdürü)</p>
            <p>Sicil No: 3001 (Çalışan)</p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
