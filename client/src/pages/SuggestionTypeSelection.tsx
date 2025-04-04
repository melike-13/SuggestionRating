import { User } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Zap, Sparkles } from "lucide-react";

interface SuggestionTypeSelectionProps {
  user: User | null;
}

export default function SuggestionTypeSelection({ user }: SuggestionTypeSelectionProps) {
  const [_, setLocation] = useLocation();

  if (!user) {
    setLocation("/");
    return null;
  }

  const handleSelection = (type: string) => {
    localStorage.setItem("selectedSuggestionType", type);
    setLocation("/dashboard");
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Öneri Tipi Seçin</h1>
        <p className="text-gray-600">
          Merhaba {user.displayName}, lütfen oluşturmak istediğiniz öneri tipini seçin.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-2 hover:border-primary hover:shadow-lg transition-all cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Sparkles className="mr-2 h-6 w-6 text-primary" />
              Kaizen Önerisi
            </CardTitle>
            <CardDescription>
              Süreç iyileştirme ve verimlilik artırma odaklı öneriler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600 text-sm">
              Kaizen önerileri, üretim süreçlerindeki israfı azaltmayı, verimliliği artırmayı ve
              sürekli iyileştirmeyi hedefleyen kapsamlı önerilerdir.
            </p>
            <Button 
              onClick={() => handleSelection("kaizen")} 
              className="w-full"
            >
              Kaizen Önerisi Oluştur
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary hover:shadow-lg transition-all cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-6 w-6 text-primary" />
              Kıvılcım Önerisi
            </CardTitle>
            <CardDescription>
              Hızlı uygulanabilir, basit iyileştirme önerileri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600 text-sm">
              Kıvılcım önerileri, daha hızlı uygulanabilir, daha az kaynak gerektiren ve basit
              süreç iyileştirmelerine odaklanan küçük ölçekli önerilerdir.
            </p>
            <Button 
              onClick={() => handleSelection("kivilcim")} 
              className="w-full"
            >
              Kıvılcım Önerisi Oluştur
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}