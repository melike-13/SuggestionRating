import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/utils/formatDate";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Suggestion, User, categoryLabels } from "@shared/schema";

export default function RewardManagement() {
  const { toast } = useToast();
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [amount, setAmount] = useState("0");
  const [description, setDescription] = useState("");
  
  const { data: suggestions = [] } = useQuery<Suggestion[]>({
    queryKey: ["/api/suggestions/status/approved"],
  });
  
  const { data: implementedSuggestions = [] } = useQuery<Suggestion[]>({
    queryKey: ["/api/suggestions/status/implemented"],
  });
  
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users/top-contributors", 100],
  });
  
  const { data: suggestionRewards = [] } = useQuery({
    queryKey: [`/api/rewards/suggestion/${selectedSuggestion?.id}`],
    enabled: !!selectedSuggestion,
  });
  
  const rewardableSuggestions = [...suggestions, ...implementedSuggestions];
  
  const getUserName = (userId: number) => {
    if (!users) return "Bilinmiyor";
    const user = users.find((u) => u.id === userId);
    return user ? user.fullName : "Bilinmiyor";
  };
  
  const rewardMutation = useMutation({
    mutationFn: async ({ suggestionId, userId, amount, description }: any) => {
      const response = await apiRequest("POST", "/api/rewards", { 
        suggestionId, 
        userId, 
        amount, 
        description 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/top-contributors"] });
      queryClient.invalidateQueries({ queryKey: [`/api/rewards/suggestion/${selectedSuggestion?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      setAmount("0");
      setDescription("");
      toast({
        title: "Ödül kaydedildi",
        description: "Ödül başarıyla eklendi.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Hata oluştu",
        description: "Ödül eklenemedi. Lütfen tekrar deneyin.",
      });
    },
  });
  
  const handleSelectSuggestion = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setAmount("0");
    setDescription("");
  };
  
  const handleRewardSubmit = () => {
    if (!selectedSuggestion) {
      toast({
        variant: "destructive",
        title: "Öneri seçilmedi",
        description: "Lütfen bir öneri seçin.",
      });
      return;
    }
    
    const amountValue = parseInt(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        variant: "destructive",
        title: "Geçersiz miktar",
        description: "Lütfen geçerli bir ödül miktarı girin.",
      });
      return;
    }
    
    rewardMutation.mutate({
      suggestionId: selectedSuggestion.id,
      userId: selectedSuggestion.userId,
      amount: amountValue,
      description
    });
  };
  
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Ödül Yönetimi</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Ödüllendirilebilir Öneriler</CardTitle>
              <CardDescription>Onaylanan veya uygulamaya alınan öneriler</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {rewardableSuggestions.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  Ödüllendirilebilir öneri bulunmuyor.
                </div>
              ) : (
                rewardableSuggestions.map((suggestion) => (
                  <div 
                    key={suggestion.id}
                    className={`p-4 border rounded-md cursor-pointer transition-colors ${
                      selectedSuggestion?.id === suggestion.id 
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 hover:border-primary/50"
                    }`}
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-slate-900 mb-1">{suggestion.title}</h3>
                      <StatusBadge status={suggestion.status as any} />
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      Öneren: {getUserName(suggestion.userId)}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Kategori: {categoryLabels[suggestion.category]}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          {!selectedSuggestion ? (
            <Card className="h-full flex items-center justify-center min-h-[300px]">
              <CardContent className="text-center text-slate-500">
                <p>Lütfen ödüllendirmek için bir öneri seçin.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{selectedSuggestion.title}</CardTitle>
                <CardDescription>
                  <div className="flex flex-col gap-1 mt-2">
                    <p>Öneren: {getUserName(selectedSuggestion.userId)}</p>
                    <p>Durum: <StatusBadge status={selectedSuggestion.status as any} /></p>
                    <p>Tarih: {formatDate(selectedSuggestion.submittedAt)}</p>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Ödül Bilgileri</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium mb-1">
                        Ödül Miktarı (₺)
                      </label>
                      <Input
                        id="amount"
                        type="number"
                        min="0"
                        step="50"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium mb-1">
                        Açıklama
                      </label>
                      <Textarea
                        id="description"
                        placeholder="Ödül için açıklama girin..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-3">Önceki Ödüller</h3>
                  {!suggestionRewards || suggestionRewards.length === 0 ? (
                    <p className="text-sm text-slate-500">Bu öneri için henüz ödül verilmemiş.</p>
                  ) : (
                    <ul className="space-y-3">
                      {suggestionRewards.map((reward: any) => (
                        <li key={reward.id} className="border rounded-md p-3">
                          <div className="flex justify-between">
                            <span className="font-medium">{reward.amount.toLocaleString('tr-TR')}₺</span>
                            <span className="text-sm text-slate-500">{formatDate(reward.awardedAt)}</span>
                          </div>
                          {reward.description && (
                            <p className="text-sm mt-1">{reward.description}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedSuggestion(null)}
                >
                  İptal
                </Button>
                <Button
                  onClick={handleRewardSubmit}
                  disabled={parseInt(amount) <= 0 || rewardMutation.isPending}
                >
                  {rewardMutation.isPending ? "Ödül Ekleniyor..." : "Ödül Ekle"}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
