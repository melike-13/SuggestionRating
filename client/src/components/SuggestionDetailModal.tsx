import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Suggestion, User, SUGGESTION_STATUSES, REWARD_TYPES } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface SuggestionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestion: Suggestion | null;
  currentUser: User | null;
}

export default function SuggestionDetailModal({ 
  open, 
  onOpenChange, 
  suggestion, 
  currentUser 
}: SuggestionDetailModalProps) {
  const { toast } = useToast();
  const isAdmin = currentUser?.isAdmin || false;
  
  const [status, setStatus] = useState(suggestion?.status || SUGGESTION_STATUSES.NEW);
  const [rating, setRating] = useState<number>(suggestion?.rating || 0);
  const [feedback, setFeedback] = useState(suggestion?.feedback || "");
  const [rewardAmount, setRewardAmount] = useState<string>("");
  const [rewardType, setRewardType] = useState<string>(REWARD_TYPES.MONEY);
  
  // Reset form when suggestion changes
  useState(() => {
    if (suggestion) {
      setStatus(suggestion.status);
      setRating(suggestion.rating || 0);
      setFeedback(suggestion.feedback || "");
      setRewardAmount("");
    }
  });
  
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "-";
    return format(new Date(date), "dd.MM.yyyy");
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case SUGGESTION_STATUSES.NEW:
        return "Yeni";
      case SUGGESTION_STATUSES.REVIEW:
        return "İnceleniyor";
      case SUGGESTION_STATUSES.APPROVED:
        return "Onaylandı";
      case SUGGESTION_STATUSES.IMPLEMENTED:
        return "Uygulandı";
      case SUGGESTION_STATUSES.REJECTED:
        return "Reddedildi";
      default:
        return status;
    }
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case SUGGESTION_STATUSES.NEW:
        return "bg-blue-500";
      case SUGGESTION_STATUSES.REVIEW:
        return "bg-yellow-500";
      case SUGGESTION_STATUSES.APPROVED:
        return "bg-green-500";
      case SUGGESTION_STATUSES.IMPLEMENTED:
        return "bg-indigo-700";
      case SUGGESTION_STATUSES.REJECTED:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };
  
  const handleSave = async () => {
    if (!suggestion) return;
    
    try {
      // Update suggestion
      await apiRequest("PATCH", `/api/suggestions/${suggestion.id}`, {
        status,
        rating: rating || null,
        feedback
      });
      
      // Create reward if amount is provided
      if (rewardAmount && parseFloat(rewardAmount) > 0) {
        await apiRequest("POST", "/api/rewards", {
          suggestionId: suggestion.id,
          amount: parseFloat(rewardAmount),
          type: rewardType,
          assignedBy: currentUser?.id
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/suggestions'] });
      queryClient.invalidateQueries({ queryKey: [`/api/suggestions/${suggestion.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/suggestions'] });
      
      toast({
        title: "Başarılı",
        description: "Değişiklikler kaydedildi.",
      });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Değişiklikler kaydedilirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };
  
  // Star rating component
  const StarRating = () => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`cursor-pointer material-icons ${rating >= star ? "text-yellow-500" : "text-neutral-300"}`}
            onClick={() => isAdmin && setRating(star)}
          >
            star
          </span>
        ))}
      </div>
    );
  };
  
  if (!suggestion) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Öneri Detayı</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-lg font-bold text-neutral-900">{suggestion.title}</h4>
              <p className="text-sm text-neutral-600">
                {suggestion.submittedBy} tarafından {formatDate(suggestion.submittedAt)} tarihinde gönderildi
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm text-white ${getStatusClass(suggestion.status)}`}>
              {getStatusLabel(suggestion.status)}
            </span>
          </div>
          
          <div className="mb-4">
            <h5 className="text-sm font-medium text-neutral-700 mb-1">Kategori</h5>
            <p className="text-neutral-900">{suggestion.category}</p>
          </div>
          
          <div className="mb-4">
            <h5 className="text-sm font-medium text-neutral-700 mb-1">Açıklama</h5>
            <p className="text-neutral-900 whitespace-pre-line">{suggestion.description}</p>
          </div>
          
          <div className="mb-4">
            <h5 className="text-sm font-medium text-neutral-700 mb-1">Beklenen Faydalar</h5>
            <p className="text-neutral-900 whitespace-pre-line">{suggestion.benefits}</p>
          </div>
        </div>
        
        {isAdmin && (
          <div className="border-t border-neutral-200 pt-4">
            <h5 className="text-sm font-medium text-neutral-700 mb-3">Değerlendirme</h5>
            
            <div className="grid gap-4 mb-4">
              <div>
                <Label htmlFor="rating">Derecelendirme</Label>
                <StarRating />
              </div>
              
              <div>
                <Label htmlFor="status">Durum</Label>
                <Select 
                  value={status} 
                  onValueChange={setStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SUGGESTION_STATUSES.NEW}>Yeni</SelectItem>
                    <SelectItem value={SUGGESTION_STATUSES.REVIEW}>İnceleniyor</SelectItem>
                    <SelectItem value={SUGGESTION_STATUSES.APPROVED}>Onaylandı</SelectItem>
                    <SelectItem value={SUGGESTION_STATUSES.IMPLEMENTED}>Uygulandı</SelectItem>
                    <SelectItem value={SUGGESTION_STATUSES.REJECTED}>Reddedildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="feedback">Geri Bildirim</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Öneri hakkında geri bildiriminizi yazın"
                  className="resize-none"
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Ödül (opsiyonel)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(e.target.value)}
                    placeholder="Miktar"
                    className="w-40"
                  />
                  <Select 
                    value={rewardType} 
                    onValueChange={setRewardType}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Tür seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={REWARD_TYPES.MONEY}>TL</SelectItem>
                      <SelectItem value={REWARD_TYPES.POINTS}>Puan</SelectItem>
                      <SelectItem value={REWARD_TYPES.GIFT}>Hediye</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          {isAdmin && (
            <Button onClick={handleSave}>Kaydet</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
