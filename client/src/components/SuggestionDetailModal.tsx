import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Suggestion, User, SUGGESTION_STATUSES, REWARD_TYPES } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";

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
  
  // Genel durum bilgileri
  const [status, setStatus] = useState(suggestion?.status || SUGGESTION_STATUSES.NEW);
  const [activeTab, setActiveTab] = useState("details");
  
  // Bölüm müdürü değerlendirmesi
  const [departmentFeedback, setDepartmentFeedback] = useState(suggestion?.departmentFeedback || "");
  
  // Yapılabilirlik değerlendirmesi
  const [feasibilityScore, setFeasibilityScore] = useState<number>(suggestion?.feasibilityScore || 0);
  const [feasibilityFeedback, setFeasibilityFeedback] = useState(suggestion?.feasibilityFeedback || "");
  
  // Çözüm önerisi
  const [solutionDescription, setSolutionDescription] = useState(suggestion?.solutionDescription || "");
  
  // Maliyet değerlendirmesi
  const [costScore, setCostScore] = useState<number>(suggestion?.costScore || 0);
  const [costDetails, setCostDetails] = useState(suggestion?.costDetails || "");
  
  // Genel müdür değerlendirmesi
  const [executiveFeedback, setExecutiveFeedback] = useState(suggestion?.executiveFeedback || "");
  
  // Uygulama ve takip
  const [implementationNotes, setImplementationNotes] = useState(suggestion?.implementationNotes || "");
  
  // Raporlama
  const [reportDetails, setReportDetails] = useState(suggestion?.reportDetails || "");
  
  // Değerlendirme
  const [evaluationScore, setEvaluationScore] = useState<number>(suggestion?.evaluationScore || 0);
  const [evaluationNotes, setEvaluationNotes] = useState(suggestion?.evaluationNotes || "");
  
  // Ödül
  const [rewardAmount, setRewardAmount] = useState<string>("");
  const [rewardType, setRewardType] = useState<string>(REWARD_TYPES.MONEY);
  
  // Reset form when suggestion changes
  useEffect(() => {
    if (suggestion) {
      setStatus(suggestion.status);
      
      // Bölüm müdürü değerlendirmesi
      setDepartmentFeedback(suggestion.departmentFeedback || "");
      
      // Yapılabilirlik değerlendirmesi
      setFeasibilityScore(suggestion.feasibilityScore || 0);
      setFeasibilityFeedback(suggestion.feasibilityFeedback || "");
      
      // Çözüm önerisi
      setSolutionDescription(suggestion.solutionDescription || "");
      
      // Maliyet değerlendirmesi
      setCostScore(suggestion.costScore || 0);
      setCostDetails(suggestion.costDetails || "");
      
      // Genel müdür değerlendirmesi
      setExecutiveFeedback(suggestion.executiveFeedback || "");
      
      // Uygulama ve takip
      setImplementationNotes(suggestion.implementationNotes || "");
      
      // Raporlama
      setReportDetails(suggestion.reportDetails || "");
      
      // Değerlendirme
      setEvaluationScore(suggestion.evaluationScore || 0);
      setEvaluationNotes(suggestion.evaluationNotes || "");
      
      // Ödül bilgilerini sıfırla
      setRewardAmount("");
    }
  }, [suggestion]);
  
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "-";
    return format(new Date(date), "dd.MM.yyyy");
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case SUGGESTION_STATUSES.NEW:
        return "Yeni";
      case SUGGESTION_STATUSES.DEPARTMENT_REVIEW:
        return "Bölüm Müd. İncelemesinde";
      case SUGGESTION_STATUSES.FEASIBILITY_ASSESSMENT:
        return "Yapılabilirlik Değerlendirmesinde";
      case SUGGESTION_STATUSES.FEASIBILITY_REJECTED:
        return "Yapılabilirlik Reddedildi";
      case SUGGESTION_STATUSES.SOLUTION_IDENTIFIED:
        return "Çözüm Önerisi Belirlendi";
      case SUGGESTION_STATUSES.COST_ASSESSMENT:
        return "Maliyet Değerlendirmesinde";
      case SUGGESTION_STATUSES.COST_REJECTED:
        return "Maliyet Puanı Düşük";
      case SUGGESTION_STATUSES.EXECUTIVE_REVIEW:
        return "Genel Müdür İncelemesinde";
      case SUGGESTION_STATUSES.APPROVED:
        return "Onaylandı";
      case SUGGESTION_STATUSES.REJECTED:
        return "Reddedildi";
      case SUGGESTION_STATUSES.IN_PROGRESS:
        return "Uygulamada";
      case SUGGESTION_STATUSES.COMPLETED:
        return "Tamamlandı";
      case SUGGESTION_STATUSES.REPORTED:
        return "Raporlandı";
      case SUGGESTION_STATUSES.EVALUATED:
        return "Değerlendirildi";
      case SUGGESTION_STATUSES.REWARDED:
        return "Ödüllendirildi";
      default:
        return status;
    }
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case SUGGESTION_STATUSES.NEW:
        return "bg-blue-500";
      case SUGGESTION_STATUSES.DEPARTMENT_REVIEW:
        return "bg-yellow-500";
      case SUGGESTION_STATUSES.FEASIBILITY_ASSESSMENT:
        return "bg-yellow-600";
      case SUGGESTION_STATUSES.FEASIBILITY_REJECTED:
        return "bg-red-500";
      case SUGGESTION_STATUSES.SOLUTION_IDENTIFIED:
        return "bg-cyan-500";
      case SUGGESTION_STATUSES.COST_ASSESSMENT:
        return "bg-yellow-600";
      case SUGGESTION_STATUSES.COST_REJECTED:
        return "bg-red-500";
      case SUGGESTION_STATUSES.EXECUTIVE_REVIEW:
        return "bg-purple-500";
      case SUGGESTION_STATUSES.APPROVED:
        return "bg-green-500";
      case SUGGESTION_STATUSES.REJECTED:
        return "bg-red-500";
      case SUGGESTION_STATUSES.IN_PROGRESS:
        return "bg-blue-600";
      case SUGGESTION_STATUSES.COMPLETED:
        return "bg-green-600";
      case SUGGESTION_STATUSES.REPORTED:
        return "bg-teal-600";
      case SUGGESTION_STATUSES.EVALUATED:
        return "bg-indigo-600";
      case SUGGESTION_STATUSES.REWARDED:
        return "bg-amber-600";
      default:
        return "bg-gray-500";
    }
  };
  
  // Duruma göre bir sonraki adımı belirle
  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case SUGGESTION_STATUSES.NEW:
        return SUGGESTION_STATUSES.DEPARTMENT_REVIEW;
      case SUGGESTION_STATUSES.DEPARTMENT_REVIEW:
        return SUGGESTION_STATUSES.FEASIBILITY_ASSESSMENT;
      case SUGGESTION_STATUSES.FEASIBILITY_ASSESSMENT:
        // Eğer yapılabilirlik puanı 2.5'dan büyükse, çözüm önerisine geç
        return feasibilityScore >= 2.5 
          ? SUGGESTION_STATUSES.SOLUTION_IDENTIFIED 
          : SUGGESTION_STATUSES.FEASIBILITY_REJECTED;
      case SUGGESTION_STATUSES.SOLUTION_IDENTIFIED:
        return SUGGESTION_STATUSES.COST_ASSESSMENT;
      case SUGGESTION_STATUSES.COST_ASSESSMENT:
        // Maliyet puanı 3'ten büyükse genel müdüre gönder
        return costScore >= 3
          ? SUGGESTION_STATUSES.EXECUTIVE_REVIEW
          : SUGGESTION_STATUSES.COST_REJECTED;
      case SUGGESTION_STATUSES.EXECUTIVE_REVIEW:
        // Burada yönetici kabul veya red seçeneklerinden birini seçmeli
        return SUGGESTION_STATUSES.APPROVED; // varsayılan olarak onaylandı
      case SUGGESTION_STATUSES.APPROVED:
        return SUGGESTION_STATUSES.IN_PROGRESS;
      case SUGGESTION_STATUSES.IN_PROGRESS:
        return SUGGESTION_STATUSES.COMPLETED;
      case SUGGESTION_STATUSES.COMPLETED:
        return SUGGESTION_STATUSES.REPORTED;
      case SUGGESTION_STATUSES.REPORTED:
        return SUGGESTION_STATUSES.EVALUATED;
      case SUGGESTION_STATUSES.EVALUATED:
        return SUGGESTION_STATUSES.REWARDED;
      default:
        return currentStatus;
    }
  };
  
  const handleSave = async () => {
    if (!suggestion) return;
    
    try {
      // Bir sonraki durumu otomatik belirle (yönetici statüsünü değiştirmediyse)
      const nextStatus = status === suggestion.status 
        ? getNextStatus(suggestion.status) 
        : status;
        
      // Göndereceğimiz alanları hazırla
      const updateData: any = {
        status: nextStatus,
      };
      
      // Mevcut duruma göre gereken özel alanları ekle
      switch (suggestion.status) {
        case SUGGESTION_STATUSES.NEW:
        case SUGGESTION_STATUSES.DEPARTMENT_REVIEW:
          updateData.departmentFeedback = departmentFeedback;
          updateData.departmentManagerId = currentUser?.id;
          updateData.departmentReviewAt = new Date();
          break;
          
        case SUGGESTION_STATUSES.FEASIBILITY_ASSESSMENT:
          updateData.feasibilityScore = feasibilityScore;
          updateData.feasibilityFeedback = feasibilityFeedback;
          updateData.feasibilityReviewedBy = currentUser?.id;
          updateData.feasibilityReviewedAt = new Date();
          break;
          
        case SUGGESTION_STATUSES.SOLUTION_IDENTIFIED:
          updateData.solutionDescription = solutionDescription;
          updateData.solutionProposedBy = currentUser?.id;
          updateData.solutionProposedAt = new Date();
          break;
          
        case SUGGESTION_STATUSES.COST_ASSESSMENT:
          updateData.costScore = costScore;
          updateData.costDetails = costDetails;
          updateData.costReviewedBy = currentUser?.id;
          updateData.costReviewedAt = new Date();
          break;
          
        case SUGGESTION_STATUSES.EXECUTIVE_REVIEW:
          updateData.executiveFeedback = executiveFeedback;
          updateData.executiveReviewedBy = currentUser?.id;
          updateData.executiveReviewedAt = new Date();
          break;
          
        case SUGGESTION_STATUSES.IN_PROGRESS:
          updateData.implementationNotes = implementationNotes;
          updateData.implementationStartedAt = new Date();
          break;
          
        case SUGGESTION_STATUSES.COMPLETED:
          updateData.implementationCompletedAt = new Date();
          break;
          
        case SUGGESTION_STATUSES.REPORTED:
          updateData.reportDetails = reportDetails;
          updateData.reportedBy = currentUser?.id;
          updateData.reportedAt = new Date();
          break;
          
        case SUGGESTION_STATUSES.EVALUATED:
          updateData.evaluationScore = evaluationScore;
          updateData.evaluationNotes = evaluationNotes;
          updateData.evaluatedBy = currentUser?.id;
          updateData.evaluatedAt = new Date();
          break;
      }
      
      // Öneriyi güncelle
      await apiRequest("PATCH", `/api/suggestions/${suggestion.id}`, updateData);
      
      // Eğer ödül durumundaysa ve miktar girilmişse, ödülü kaydet
      if (nextStatus === SUGGESTION_STATUSES.REWARDED && rewardAmount && parseFloat(rewardAmount) > 0) {
        await apiRequest("POST", "/api/rewards", {
          suggestionId: suggestion.id,
          amount: parseFloat(rewardAmount),
          type: rewardType,
          assignedBy: currentUser?.id
        });
      }
      
      // Verileri yenile
      queryClient.invalidateQueries({ queryKey: ['/api/suggestions'] });
      queryClient.invalidateQueries({ queryKey: [`/api/suggestions/${suggestion.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/suggestions'] });
      
      toast({
        title: "Başarılı",
        description: "Kaizen önerisi başarıyla güncellendi.",
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
  
  // Input puanlar için yıldız gösterimi
  const StarRating = ({ value, onChange, max = 5, readOnly = false }: 
    { value: number, onChange?: (value: number) => void, max?: number, readOnly?: boolean }) => {
    return (
      <div className="flex items-center">
        {Array.from({ length: max }).map((_, index) => (
          <span
            key={index}
            className={`cursor-pointer material-icons ${
              value >= index + 1 ? "text-yellow-500" : "text-neutral-300"
            } ${readOnly ? "cursor-default" : ""}`}
            onClick={() => !readOnly && onChange && onChange(index + 1)}
          >
            star
          </span>
        ))}
        <span className="ml-2 text-sm text-neutral-600">{value} / {max}</span>
      </div>
    );
  };
  
  if (!suggestion) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kaizen Öneri Detayı</DialogTitle>
          <span className={`self-end px-3 py-1 rounded-full text-sm text-white ${getStatusClass(suggestion.status)}`}>
            {getStatusLabel(suggestion.status)}
          </span>
        </DialogHeader>
        
        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="details">Öneri Detayları</TabsTrigger>
            <TabsTrigger value="workflow">İş Akışı</TabsTrigger>
            <TabsTrigger value="history">Tarihçe</TabsTrigger>
          </TabsList>
          
          {/* Temel Öneri Detayları */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-lg font-bold text-neutral-900 mb-1">{suggestion.title}</h4>
                <p className="text-sm text-neutral-600">
                  {formatDate(suggestion.submittedAt)} tarihinde gönderildi
                </p>
                
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-neutral-700 mb-1">Kategori</h5>
                  <p className="text-neutral-900">{suggestion.category}</p>
                </div>
                
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-neutral-700 mb-1">Açıklama</h5>
                  <p className="text-neutral-900 whitespace-pre-line">{suggestion.description}</p>
                </div>
              </div>
              
              <div>
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-neutral-700 mb-1">Beklenen Faydalar</h5>
                  <p className="text-neutral-900 whitespace-pre-line">{suggestion.benefits}</p>
                </div>
                
                {suggestion.solutionDescription && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-neutral-700 mb-1">Çözüm Önerisi</h5>
                    <p className="text-neutral-900 whitespace-pre-line">{suggestion.solutionDescription}</p>
                  </div>
                )}
                
                {suggestion.implementationNotes && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-neutral-700 mb-1">Uygulama Notları</h5>
                    <p className="text-neutral-900 whitespace-pre-line">{suggestion.implementationNotes}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Puanlar ve değerlendirmeler */}
            <div className="grid grid-cols-2 gap-4 mt-4 border-t border-gray-200 pt-4">
              {suggestion.feasibilityScore && suggestion.feasibilityScore > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-neutral-700 mb-1">Yapılabilirlik Puanı</h5>
                  <StarRating value={suggestion.feasibilityScore || 0} readOnly />
                  {suggestion.feasibilityFeedback && (
                    <p className="text-sm text-neutral-600 mt-1">{suggestion.feasibilityFeedback}</p>
                  )}
                </div>
              )}
              
              {suggestion.costScore && suggestion.costScore > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-neutral-700 mb-1">Maliyet Puanı</h5>
                  <StarRating value={suggestion.costScore || 0} readOnly max={5} />
                  {suggestion.costDetails && (
                    <p className="text-sm text-neutral-600 mt-1">{suggestion.costDetails}</p>
                  )}
                </div>
              )}
              
              {suggestion.evaluationScore && suggestion.evaluationScore > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-neutral-700 mb-1">Değerlendirme Puanı</h5>
                  <StarRating value={suggestion.evaluationScore || 0} readOnly max={5} />
                  {suggestion.evaluationNotes && (
                    <p className="text-sm text-neutral-600 mt-1">{suggestion.evaluationNotes}</p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* İş Akışı Aşaması - Yöneticiler duruma göre buradan değerlendirme yapabilir */}
          <TabsContent value="workflow" className="space-y-4">
            {isAdmin && (
              <>
                <div className="border p-4 rounded-lg shadow-sm">
                  <h3 className="font-medium text-lg mb-3">Mevcut Aşama: {getStatusLabel(suggestion.status)}</h3>
                  
                  {/* Mevcut aşamaya göre gereken giriş alanları */}
                  {suggestion.status === SUGGESTION_STATUSES.NEW || 
                    suggestion.status === SUGGESTION_STATUSES.DEPARTMENT_REVIEW ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Bölüm Müdürü Değerlendirmesi</Label>
                        <Textarea
                          value={departmentFeedback}
                          onChange={(e) => setDepartmentFeedback(e.target.value)}
                          placeholder="Öneriyi değerlendirin..."
                          className="resize-none"
                          rows={3}
                        />
                      </div>
                    </div>
                  ) : null}
                  
                  {suggestion.status === SUGGESTION_STATUSES.FEASIBILITY_ASSESSMENT && (
                    <div className="space-y-4">
                      <div>
                        <Label>Yapılabilirlik Puanı (En az 2.5 olmalı)</Label>
                        <StarRating 
                          value={feasibilityScore} 
                          onChange={setFeasibilityScore} 
                          max={5} 
                        />
                      </div>
                      <div>
                        <Label>Yapılabilirlik Değerlendirmesi</Label>
                        <Textarea
                          value={feasibilityFeedback}
                          onChange={(e) => setFeasibilityFeedback(e.target.value)}
                          placeholder="Yapılabilirlik değerlendirmesi..."
                          className="resize-none"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                  
                  {suggestion.status === SUGGESTION_STATUSES.SOLUTION_IDENTIFIED && (
                    <div className="space-y-4">
                      <div>
                        <Label>Çözüm Önerisi</Label>
                        <Textarea
                          value={solutionDescription}
                          onChange={(e) => setSolutionDescription(e.target.value)}
                          placeholder="Çözüm önerisini detaylandırın..."
                          className="resize-none"
                          rows={4}
                        />
                      </div>
                    </div>
                  )}
                  
                  {suggestion.status === SUGGESTION_STATUSES.COST_ASSESSMENT && (
                    <div className="space-y-4">
                      <div>
                        <Label>Maliyet Puanı (En az 3 olmalı)</Label>
                        <StarRating 
                          value={costScore} 
                          onChange={setCostScore}
                          max={5} 
                        />
                      </div>
                      <div>
                        <Label>Maliyet Detayları</Label>
                        <Textarea
                          value={costDetails}
                          onChange={(e) => setCostDetails(e.target.value)}
                          placeholder="Maliyet detaylarını yazın..."
                          className="resize-none"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                  
                  {suggestion.status === SUGGESTION_STATUSES.EXECUTIVE_REVIEW && (
                    <div className="space-y-4">
                      <div>
                        <Label>Genel Müdür Geri Bildirimi</Label>
                        <Textarea
                          value={executiveFeedback}
                          onChange={(e) => setExecutiveFeedback(e.target.value)}
                          placeholder="Onay veya ret geri bildirimi..."
                          className="resize-none"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>İşlem</Label>
                        <Select 
                          value={status} 
                          onValueChange={setStatus}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="İşlem seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={SUGGESTION_STATUSES.APPROVED}>Onayla</SelectItem>
                            <SelectItem value={SUGGESTION_STATUSES.REJECTED}>Reddet</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  
                  {suggestion.status === SUGGESTION_STATUSES.IN_PROGRESS && (
                    <div className="space-y-4">
                      <div>
                        <Label>Uygulama Notları</Label>
                        <Textarea
                          value={implementationNotes}
                          onChange={(e) => setImplementationNotes(e.target.value)}
                          placeholder="Uygulama sürecini açıklayın..."
                          className="resize-none"
                          rows={4}
                        />
                      </div>
                    </div>
                  )}
                  
                  {suggestion.status === SUGGESTION_STATUSES.REPORTED && (
                    <div className="space-y-4">
                      <div>
                        <Label>Rapor Detayları</Label>
                        <Textarea
                          value={reportDetails}
                          onChange={(e) => setReportDetails(e.target.value)}
                          placeholder="Uygulama sonucunu raporlayın..."
                          className="resize-none"
                          rows={4}
                        />
                      </div>
                    </div>
                  )}
                  
                  {suggestion.status === SUGGESTION_STATUSES.EVALUATED && (
                    <div className="space-y-4">
                      <div>
                        <Label>Değerlendirme Puanı</Label>
                        <StarRating 
                          value={evaluationScore} 
                          onChange={setEvaluationScore}
                          max={5} 
                        />
                      </div>
                      <div>
                        <Label>Değerlendirme Notları</Label>
                        <Textarea
                          value={evaluationNotes}
                          onChange={(e) => setEvaluationNotes(e.target.value)}
                          placeholder="Değerlendirme notlarını yazın..."
                          className="resize-none"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                  
                  {suggestion.status === SUGGESTION_STATUSES.REWARDED && (
                    <div className="space-y-4">
                      <div>
                        <Label>Ödül</Label>
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
                  )}
                </div>
              </>
            )}
          </TabsContent>
          
          {/* Öneri Tarihçesi - Tüm durum değişiklikleri, kim tarafından yapıldığı, tarihi vb */}
          <TabsContent value="history" className="space-y-4">
            <div className="border rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-lg mb-3">İşlem Geçmişi</h3>
              <div className="space-y-4">
                {/* Gönderim */}
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 text-white p-2 rounded-full">
                    <span className="material-icons text-sm">edit</span>
                  </div>
                  <div>
                    <p className="font-medium">Öneri Oluşturuldu</p>
                    <p className="text-sm text-neutral-600">{formatDate(suggestion.submittedAt)}</p>
                  </div>
                </div>
                
                {/* Bölüm müdürü */}
                {suggestion.departmentReviewAt && (
                  <div className="flex items-start gap-3">
                    <div className="bg-yellow-500 text-white p-2 rounded-full">
                      <span className="material-icons text-sm">person</span>
                    </div>
                    <div>
                      <p className="font-medium">Bölüm Müdürü İncelemesi</p>
                      <p className="text-sm text-neutral-600">{formatDate(suggestion.departmentReviewAt)}</p>
                      {suggestion.departmentFeedback && (
                        <p className="text-sm mt-1 border-l-2 border-neutral-300 pl-2">{suggestion.departmentFeedback}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Yapılabilirlik */}
                {suggestion.feasibilityReviewedAt && (
                  <div className="flex items-start gap-3">
                    <div className="bg-yellow-600 text-white p-2 rounded-full">
                      <span className="material-icons text-sm">engineering</span>
                    </div>
                    <div>
                      <p className="font-medium">Yapılabilirlik Değerlendirmesi</p>
                      <p className="text-sm text-neutral-600">{formatDate(suggestion.feasibilityReviewedAt)}</p>
                      <p className="text-sm">Puan: {suggestion.feasibilityScore}/5</p>
                      {suggestion.feasibilityFeedback && (
                        <p className="text-sm mt-1 border-l-2 border-neutral-300 pl-2">{suggestion.feasibilityFeedback}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Çözüm önerisi */}
                {suggestion.solutionProposedAt && (
                  <div className="flex items-start gap-3">
                    <div className="bg-cyan-500 text-white p-2 rounded-full">
                      <span className="material-icons text-sm">lightbulb</span>
                    </div>
                    <div>
                      <p className="font-medium">Çözüm Önerisi</p>
                      <p className="text-sm text-neutral-600">{suggestion.solutionProposedAt ? formatDate(suggestion.solutionProposedAt) : "Tarih bilgisi yok"}</p>
                      {suggestion.solutionDescription && (
                        <p className="text-sm mt-1 border-l-2 border-neutral-300 pl-2">{suggestion.solutionDescription}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Maliyet */}
                {suggestion.costReviewedAt && (
                  <div className="flex items-start gap-3">
                    <div className="bg-yellow-600 text-white p-2 rounded-full">
                      <span className="material-icons text-sm">attach_money</span>
                    </div>
                    <div>
                      <p className="font-medium">Maliyet Değerlendirmesi</p>
                      <p className="text-sm text-neutral-600">{suggestion.costReviewedAt ? formatDate(suggestion.costReviewedAt) : "Tarih bilgisi yok"}</p>
                      <p className="text-sm">Puan: {suggestion.costScore}/5</p>
                      {suggestion.costDetails && (
                        <p className="text-sm mt-1 border-l-2 border-neutral-300 pl-2">{suggestion.costDetails}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Genel Müdür */}
                {suggestion.executiveReviewedAt && (
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-500 text-white p-2 rounded-full">
                      <span className="material-icons text-sm">approval</span>
                    </div>
                    <div>
                      <p className="font-medium">Genel Müdür İncelemesi</p>
                      <p className="text-sm text-neutral-600">{suggestion.executiveReviewedAt ? formatDate(suggestion.executiveReviewedAt) : "Tarih bilgisi yok"}</p>
                      {suggestion.executiveFeedback && (
                        <p className="text-sm mt-1 border-l-2 border-neutral-300 pl-2">{suggestion.executiveFeedback}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Uygulama başlangıcı */}
                {suggestion.implementationStartedAt && (
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600 text-white p-2 rounded-full">
                      <span className="material-icons text-sm">build</span>
                    </div>
                    <div>
                      <p className="font-medium">Uygulama Başladı</p>
                      <p className="text-sm text-neutral-600">{formatDate(suggestion.implementationStartedAt)}</p>
                      {suggestion.implementationNotes && (
                        <p className="text-sm mt-1 border-l-2 border-neutral-300 pl-2">{suggestion.implementationNotes}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Uygulama tamamlandı */}
                {suggestion.implementationCompletedAt && (
                  <div className="flex items-start gap-3">
                    <div className="bg-green-600 text-white p-2 rounded-full">
                      <span className="material-icons text-sm">check_circle</span>
                    </div>
                    <div>
                      <p className="font-medium">Uygulama Tamamlandı</p>
                      <p className="text-sm text-neutral-600">{formatDate(suggestion.implementationCompletedAt)}</p>
                    </div>
                  </div>
                )}
                
                {/* Rapor */}
                {suggestion.reportedAt && (
                  <div className="flex items-start gap-3">
                    <div className="bg-teal-600 text-white p-2 rounded-full">
                      <span className="material-icons text-sm">description</span>
                    </div>
                    <div>
                      <p className="font-medium">Raporlandı</p>
                      <p className="text-sm text-neutral-600">{formatDate(suggestion.reportedAt)}</p>
                      {suggestion.reportDetails && (
                        <p className="text-sm mt-1 border-l-2 border-neutral-300 pl-2">{suggestion.reportDetails}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Değerlendirme */}
                {suggestion.evaluatedAt && (
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-600 text-white p-2 rounded-full">
                      <span className="material-icons text-sm">grade</span>
                    </div>
                    <div>
                      <p className="font-medium">Değerlendirildi</p>
                      <p className="text-sm text-neutral-600">{formatDate(suggestion.evaluatedAt)}</p>
                      <p className="text-sm">Puan: {suggestion.evaluationScore}/5</p>
                      {suggestion.evaluationNotes && (
                        <p className="text-sm mt-1 border-l-2 border-neutral-300 pl-2">{suggestion.evaluationNotes}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
          {isAdmin && activeTab === "workflow" && (
            <Button onClick={handleSave}>Kaydet ve İlerlet</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
