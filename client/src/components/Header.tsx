import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";
import LavLogo from "@/assets/lav-logo";
//import { useAuth } from "@/App";
import { Zap, Sparkles } from "lucide-react";

interface HeaderProps {
  user: User | null;
  isLoading: boolean;
}

export default function Header({ user, isLoading }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  // AuthContext'i props ile alıyoruz artık
  const selectedSuggestionType = localStorage.getItem("selectedSuggestionType");
  
  // setSelectedSuggestionType işlevi için geçici bir çözüm
  const setSelectedSuggestionType = (type: string | null) => {
    if (type) {
      localStorage.setItem("selectedSuggestionType", type);
    } else {
      localStorage.removeItem("selectedSuggestionType");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setSelectedSuggestionType(null);
      localStorage.removeItem("selectedSuggestionType");
      setLocation("/login");
      toast({
        title: "Çıkış Başarılı",
        description: "Başarıyla çıkış yaptınız.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Çıkış yapılırken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };
  
  const handleChangeSuggestionType = () => {
    setSelectedSuggestionType(null);
    localStorage.removeItem("selectedSuggestionType");
    setLocation("/select-type");
    toast({
      title: "Öneri Tipi Değiştiriliyor",
      description: "Lütfen yeni bir öneri tipi seçin.",
    });
  };

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white">LAV</span>
              <h1 className="text-xl font-bold cursor-pointer">Kaizen Öneri Sistemi</h1>
            </div>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          {!isLoading && user && (
            <div className="relative">
              <button 
                className="flex items-center space-x-2 focus:outline-none"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <span className="material-icons">account_circle</span>
                <span>{user.displayName}</span>
                <span className="material-icons">arrow_drop_down</span>
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <p className="font-medium">{user.displayName}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                    <p className="text-xs text-gray-500">{user.department || "Departman belirtilmedi"}</p>
                  </div>
                  
                  {selectedSuggestionType && (
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <p className="font-medium">Aktif Öneri Tipi:</p>
                      <p className="text-xs text-gray-500 flex items-center">
                        {selectedSuggestionType === "kaizen" ? (
                          <>
                            <Sparkles className="h-3 w-3 mr-1 text-primary" /> 
                            Kaizen Önerisi
                          </>
                        ) : (
                          <>
                            <Zap className="h-3 w-3 mr-1 text-primary" /> 
                            Kıvılcım Önerisi
                          </>
                        )}
                      </p>
                    </div>
                  )}
                  
                  {selectedSuggestionType && (
                    <button
                      onClick={handleChangeSuggestionType}
                      className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Öneri Tipini Değiştir
                    </button>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
