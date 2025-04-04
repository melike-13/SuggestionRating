import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FEASIBILITY_WEIGHTS, FEASIBILITY_THRESHOLDS, type Suggestion } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FeasibilityScoreItem {
  id: keyof typeof FEASIBILITY_WEIGHTS;
  name: string;
  description: string;
  weight: number;
  score: number;
}

interface FeasibilityAssessmentFormProps {
  suggestion: Suggestion;
  onClose: () => void;
}

export default function FeasibilityAssessmentForm({ suggestion, onClose }: FeasibilityAssessmentFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  
  // Puanlama kriterleri
  const [scoreItems, setScoreItems] = useState<FeasibilityScoreItem[]>([
    {
      id: "INNOVATION",
      name: "Yenilik/Yaratıcılık",
      description: "Önerinin yenilikçilik ve yaratıcılık seviyesi",
      weight: FEASIBILITY_WEIGHTS.INNOVATION,
      score: 3 // Varsayılan değer
    },
    {
      id: "SAFETY",
      name: "İSG Etkisi",
      description: "İş Sağlığı ve Güvenliği üzerindeki olumlu etkisi",
      weight: FEASIBILITY_WEIGHTS.SAFETY,
      score: 3
    },
    {
      id: "ENVIRONMENT",
      name: "Çevre Etkisi",
      description: "Çevre ve sürdürülebilirlik üzerindeki olumlu etkisi",
      weight: FEASIBILITY_WEIGHTS.ENVIRONMENT,
      score: 3
    },
    {
      id: "EMPLOYEE_SATISFACTION",
      name: "Çalışan Memnuniyeti",
      description: "Çalışan motivasyonu ve memnuniyetine katkısı",
      weight: FEASIBILITY_WEIGHTS.EMPLOYEE_SATISFACTION,
      score: 3
    },
    {
      id: "TECHNOLOGICAL_COMPATIBILITY",
      name: "Teknolojik Uyum",
      description: "Mevcut teknolojik altyapı ile uyumluluğu",
      weight: FEASIBILITY_WEIGHTS.TECHNOLOGICAL_COMPATIBILITY,
      score: 3
    },
    {
      id: "IMPLEMENTATION_EASE",
      name: "Uygulanabilme Kolaylığı",
      description: "Önerinin hayata geçirilme kolaylığı",
      weight: FEASIBILITY_WEIGHTS.IMPLEMENTATION_EASE,
      score: 3
    },
    {
      id: "COST_BENEFIT",
      name: "Maliyet",
      description: "Maliyet/fayda oranı ve yatırım getirisi",
      weight: FEASIBILITY_WEIGHTS.COST_BENEFIT,
      score: 3
    }
  ]);
  
  // Ağırlıklı ortalama puanı hesapla
  const calculateWeightedScore = (): number => {
    const totalWeight = Object.values(FEASIBILITY_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
    const weightedSum = scoreItems.reduce((sum, item) => {
      return sum + (item.score * item.weight);
    }, 0);
    
    return parseFloat((weightedSum / totalWeight).toFixed(2));
  };
  
  const [overallScore, setOverallScore] = useState<number>(calculateWeightedScore());
  
  useEffect(() => {
    setOverallScore(calculateWeightedScore());
  }, [scoreItems]);
  
  // Bir kriterin puanını güncelleme
  const handleScoreChange = (index: number, newValue: number[]) => {
    const newScoreItems = [...scoreItems];
    newScoreItems[index].score = newValue[0];
    setScoreItems(newScoreItems);
  };
  
  // Değerlendirmeyi kaydetme
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Genel puanlama sonucuna göre durum belirle
      let newStatus = "";
      
      if (overallScore < FEASIBILITY_THRESHOLDS.MINIMUM_OVERALL_SCORE) {
        // Yapılabilirlik puanı düşük, ret
        newStatus = "feasibility_rejected";
      } else if (
        scoreItems.find(item => item.id === "COST_BENEFIT")?.score 
        && scoreItems.find(item => item.id === "COST_BENEFIT")!.score <= FEASIBILITY_THRESHOLDS.NEEDS_EXECUTIVE_APPROVAL_COST_SCORE
      ) {
        // Maliyet puanı 1 veya 2 ise genel müdür onayına gider
        newStatus = "executive_review";
      } else {
        // Devam eder
        newStatus = "solution_identified";
      }
      
      // Değerlendirme sonuçlarını kaydet
      const response = await apiRequest("PATCH", `/api/suggestions/${suggestion.id}/feasibility`, {
        feasibilityScore: Number(overallScore),
        feasibilityFeedback: feedback,
        status: newStatus,
        innovationScore: Number(scoreItems.find(item => item.id === "INNOVATION")?.score || 0),
        safetyScore: Number(scoreItems.find(item => item.id === "SAFETY")?.score || 0),
        environmentScore: Number(scoreItems.find(item => item.id === "ENVIRONMENT")?.score || 0),
        employeeSatisfactionScore: Number(scoreItems.find(item => item.id === "EMPLOYEE_SATISFACTION")?.score || 0),
        technologicalCompatibilityScore: Number(scoreItems.find(item => item.id === "TECHNOLOGICAL_COMPATIBILITY")?.score || 0),
        implementationEaseScore: Number(scoreItems.find(item => item.id === "IMPLEMENTATION_EASE")?.score || 0),
        costBenefitScore: Number(scoreItems.find(item => item.id === "COST_BENEFIT")?.score || 0),
      });
      
      if (response.ok) {
        toast({
          title: "Değerlendirme kaydedildi",
          description: "Yapılabilirlik değerlendirmesi başarıyla tamamlandı.",
        });
        
        // Önerileri ve istatistikleri yeniden yükle
        queryClient.invalidateQueries({ queryKey: ["/api/suggestions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats/suggestions"] });
        queryClient.invalidateQueries({ queryKey: [`/api/suggestions/${suggestion.id}`] });
        
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Bir hata oluştu");
      }
    } catch (error) {
      console.error("Değerlendirme kaydedilirken hata oluştu:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : "Değerlendirme kaydedilirken bir hata oluştu.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Sonuçlara göre alert türünü belirle
  const getAlertVariant = () => {
    if (overallScore < FEASIBILITY_THRESHOLDS.MINIMUM_OVERALL_SCORE) {
      return "destructive";
    }
    
    const costScore = scoreItems.find(item => item.id === "COST_BENEFIT")?.score;
    if (costScore && costScore <= FEASIBILITY_THRESHOLDS.NEEDS_EXECUTIVE_APPROVAL_COST_SCORE) {
      return "default"; // "warning" tipi desteklenmediği için default kullanıyoruz
    }
    
    return "default";
  };
  
  // Sonuçlara göre alert içeriğini belirle
  const getAlertContent = () => {
    if (overallScore < FEASIBILITY_THRESHOLDS.MINIMUM_OVERALL_SCORE) {
      return {
        icon: <AlertCircle className="h-5 w-5" />,
        title: "Yapılabilirlik Olumsuz",
        description: `Genel puan (${overallScore}) minimum eşik değerin (${FEASIBILITY_THRESHOLDS.MINIMUM_OVERALL_SCORE}) altında. Bu öneri reddedilecek.`
      };
    }
    
    const costScore = scoreItems.find(item => item.id === "COST_BENEFIT")?.score;
    if (costScore && costScore <= FEASIBILITY_THRESHOLDS.NEEDS_EXECUTIVE_APPROVAL_COST_SCORE) {
      return {
        icon: <Info className="h-5 w-5" />,
        title: "Genel Müdür Onayı Gerekiyor",
        description: `Maliyet puanı (${costScore}) düşük. Bu önerinin devam etmesi için Genel Müdür onayı gerekecek.`
      };
    }
    
    return {
      icon: <CheckCircle className="h-5 w-5" />,
      title: "Yapılabilirlik Olumlu",
      description: `Genel puan (${overallScore}) yeterli. Bu öneri değerlendirme sürecine devam edecek.`
    };
  };
  
  const alertContent = getAlertContent();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Yapılabilirlik Değerlendirmesi</CardTitle>
        <CardDescription>
          Kaizen önerisinin uygulanabilirliğini aşağıdaki kriterlere göre değerlendirin.
          Her kriter için 1-5 arası puan verin (1: Çok Düşük, 5: Çok Yüksek).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {scoreItems.map((item, index) => (
          <div key={item.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">
                {item.name} <span className="text-muted-foreground text-sm">(%{item.weight})</span>
              </Label>
              <span className="font-bold text-lg">{item.score}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">1</span>
              <Slider 
                value={[item.score]} 
                min={1} 
                max={5} 
                step={1}
                onValueChange={(value) => handleScoreChange(index, value)}
              />
              <span className="text-sm">5</span>
            </div>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
        ))}
        
        <div className="mt-6 pt-6 border-t">
          <Label htmlFor="feedback" className="text-base font-medium">Değerlendirme Notları</Label>
          <Textarea
            id="feedback"
            placeholder="Değerlendirme ile ilgili notlarınızı buraya yazabilirsiniz..."
            className="mt-2"
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>
        
        <div className="mt-6">
          <Alert variant={getAlertVariant()}>
            <div className="flex items-center gap-2">
              {alertContent.icon}
              <AlertTitle>{alertContent.title}</AlertTitle>
            </div>
            <AlertDescription className="mt-2">
              {alertContent.description}
            </AlertDescription>
          </Alert>
        </div>
        
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Genel Değerlendirme Puanı:</span>
            <span className="font-bold text-xl">{overallScore}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Bu puan, her kriterin ağırlığına göre hesaplanmış genel değerlendirme sonucudur.
            Minimum geçer puan: {FEASIBILITY_THRESHOLDS.MINIMUM_OVERALL_SCORE}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          İptal
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Kaydediliyor..." : "Değerlendirmeyi Kaydet"}
        </Button>
      </CardFooter>
    </Card>
  );
}