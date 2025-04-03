import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tag, Calendar, User } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/utils/formatDate";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Suggestion, 
  Status, 
  statuses, 
  statusLabels, 
  categoryLabels 
} from "@shared/schema";

export default function ReviewSuggestions() {
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState<Status>("new");
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [status, setStatus] = useState<Status | "">("");
  const [reviewNotes, setReviewNotes] = useState("");
  
  const { data: suggestions = [] } = useQuery<Suggestion[]>({
    queryKey: [`/api/suggestions/status/${currentTab}`],
  });
  
  const { data: allUsers } = useQuery({
    queryKey: ["/api/users/top-contributors", 100],
  });
  
  const getUserName = (userId: number) => {
    if (!allUsers) return "Bilinmiyor";
    const user = allUsers.find((u: any) => u.id === userId);
    return user ? user.fullName : "Bilinmiyor";
  };
  
  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, reviewNotes }: { id: number, status: Status, reviewNotes: string }) => {
      const response = await apiRequest("PATCH", `/api/suggestions/${id}/review`, { 
        status, 
        reviewNotes 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suggestions"] });
      queryClient.invalidateQueries({ queryKey: [`/api/suggestions/status/${currentTab}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      setSelectedSuggestion(null);
      setStatus("");
      setReviewNotes("");
      toast({
        title: "Değerlendirme kaydedildi",
        description: "Öneri başarıyla değerlendirildi.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Hata oluştu",
        description: "Değerlendirme kaydedilemedi. Lütfen tekrar deneyin.",
      });
    },
  });
  
  const handleSelectSuggestion = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setStatus(suggestion.status as Status);
    setReviewNotes(suggestion.reviewNotes || "");
  };
  
  const handleReviewSubmit = () => {
    if (!selectedSuggestion || !status) {
      toast({
        variant: "destructive",
        title: "Eksik bilgi",
        description: "Lütfen bir durum seçin.",
      });
      return;
    }
    
    reviewMutation.mutate({
      id: selectedSuggestion.id,
      status,
      reviewNotes
    });
  };
  
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Öneri Değerlendirme</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Öneriler</CardTitle>
              <CardDescription>Değerlendirilecek önerileri görüntüleyin</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs 
                defaultValue="new" 
                value={currentTab}
                onValueChange={(value) => setCurrentTab(value as Status)}
              >
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="new">Yeni</TabsTrigger>
                  <TabsTrigger value="under_review">İncelemede</TabsTrigger>
                  <TabsTrigger value="approved">Onaylanan</TabsTrigger>
                </TabsList>
                
                <TabsContent value={currentTab} className="space-y-4">
                  {suggestions.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">
                      Bu durumda öneri bulunmuyor.
                    </div>
                  ) : (
                    suggestions.map((suggestion) => (
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
                          <StatusBadge status={suggestion.status as Status} />
                        </div>
                        <div className="text-sm text-slate-500 flex items-center mt-2">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{formatDate(suggestion.submittedAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          {!selectedSuggestion ? (
            <Card className="h-full flex items-center justify-center min-h-[300px]">
              <CardContent className="text-center text-slate-500">
                <p>Lütfen değerlendirmek için bir öneri seçin.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{selectedSuggestion.title}</CardTitle>
                <CardDescription>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <div className="flex items-center text-sm">
                      <Tag className="mr-1 h-4 w-4" />
                      <span>{categoryLabels[selectedSuggestion.category]}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-1 h-4 w-4" />
                      <span>{formatDate(selectedSuggestion.submittedAt)}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <User className="mr-1 h-4 w-4" />
                      <span>{getUserName(selectedSuggestion.userId)}</span>
                    </div>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Açıklama</h3>
                  <p className="text-slate-700 whitespace-pre-line">
                    {selectedSuggestion.description}
                  </p>
                </div>
                
                {selectedSuggestion.benefits && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Beklenen Faydalar</h3>
                    <p className="text-slate-700 whitespace-pre-line">
                      {selectedSuggestion.benefits}
                    </p>
                  </div>
                )}
                
                <Separator className="my-4" />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium mb-2">Değerlendirme</h3>
                  
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium mb-1">
                      Durum
                    </label>
                    <Select
                      value={status}
                      onValueChange={(value) => setStatus(value as Status)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Durum seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((statusOption) => (
                          <SelectItem key={statusOption} value={statusOption}>
                            {statusLabels[statusOption]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium mb-1">
                      Değerlendirme Notları
                    </label>
                    <Textarea
                      id="notes"
                      placeholder="Değerlendirme notlarınızı girin..."
                      rows={4}
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                    />
                  </div>
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
                  onClick={handleReviewSubmit}
                  disabled={!status || reviewMutation.isPending}
                >
                  {reviewMutation.isPending ? "Kaydediliyor..." : "Değerlendirmeyi Kaydet"}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
