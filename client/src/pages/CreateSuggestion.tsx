import TabNavigation from "@/components/TabNavigation";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { 
  extendedInsertSuggestionSchema, 
  SUGGESTION_CATEGORIES, 
  KAIZEN_TYPES,
  IMPROVEMENT_TYPES,
  User 
} from "@shared/schema";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Upload, PlusCircle, X, User as UserIcon, Sparkles, Zap } from "lucide-react";

// Transform the schema for form usage
const formSchema = extendedInsertSuggestionSchema.omit({ submittedBy: true });

export default function CreateSuggestion() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  
  // Get current user and suggestion type
  const { data: userData } = useQuery<{ user: User | null }>({ 
    queryKey: ['/api/auth/user'],
  });
  
  const currentUser = userData?.user || null;
  // Öneri tipini localStorage'dan alıyoruz
  const selectedSuggestionType = localStorage.getItem("selectedSuggestionType");
  
  // Yüklenen dosyalar için state
  const [currentStateFiles, setCurrentStateFiles] = useState<string[]>([]);
  const [improvementFiles, setImprovementFiles] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<{id: number, name: string}[]>([]);
  const [showLeaderField, setShowLeaderField] = useState(false);
  
  // Kullanıcı listesi 
  const { data: usersData } = useQuery<User[]>({ 
    queryKey: ['/api/users'],
    enabled: !!currentUser?.isAdmin, // Sadece admin kullanıcılar kullanıcı listesini çekebilir
  });
  
  // Departman listesi (gerçek listede güncellenebilir)
  const departments = [
    "Üretim",
    "Kalite",
    "İnsan Kaynakları",
    "Bakım",
    "Satın Alma",
    "Lojistik",
    "Satış",
    "Ar-Ge",
    "Yönetim",
    "Muhasebe",
    "Diğer"
  ];
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: SUGGESTION_CATEGORIES.QUALITY,
      benefits: "",
      kaizenType: selectedSuggestionType === "kaizen" ? KAIZEN_TYPES.BEFORE_AFTER : undefined,
      improvementType: IMPROVEMENT_TYPES.QUALITY,
      targetDepartment: departments[0],
      teamMembers: [],
      currentStateFiles: [],
      improvementFiles: [],
      companyContribution: ""
    },
  });
  
  // Kaizen türü değiştiğinde, lider alanı göster/gizle
  useEffect(() => {
    const kaizenType = form.watch("kaizenType");
    setShowLeaderField(kaizenType === KAIZEN_TYPES.KOBETSU);
  }, [form.watch("kaizenType")]);
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Öneri tipini form değerlerine ekliyoruz
      const suggestionData = {
        ...values,
        suggestionType: selectedSuggestionType // "kaizen" veya "kivilcim"
      };
      
      await apiRequest("POST", "/api/suggestions", suggestionData);
      
      // Öneri listesini hemen güncelle, kullanıcıya yeni önerileri göster
      await queryClient.invalidateQueries({ queryKey: ['/api/suggestions'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/stats/suggestions'] });
      
      toast({
        title: "Başarılı",
        description: "Öneriniz başarıyla kaydedildi.",
      });
      
      // Reset form
      form.reset();
      
      // Redirect to suggestions list
      setLocation("/suggestions");
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Öneri kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div>
      <TabNavigation activeTab="create" user={currentUser} />
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">
          {selectedSuggestionType === "kaizen" ? "Yeni Kaizen Önerisi Oluştur" : "Yeni Kıvılcım Önerisi Oluştur"}
        </h2>
        <p className="text-neutral-700">
          {selectedSuggestionType === "kaizen" 
            ? "Kaizen iyileştirme önerinizi paylaşın" 
            : "Kıvılcım hızlı çözüm önerinizi paylaşın"}
        </p>
        <div className="mt-2 flex items-center">
          {selectedSuggestionType === "kaizen" ? (
            <Sparkles className="h-5 w-5 mr-2 text-blue-600" />
          ) : (
            <Zap className="h-5 w-5 mr-2 text-amber-500" />
          )}
          <span className="text-sm text-gray-500">
            {selectedSuggestionType === "kaizen" 
              ? "Kaizen: Kapsamlı iyileştirme projeleri için sürekli gelişim önerileri" 
              : "Kıvılcım: Daha basit, hızlı uygulanabilir öneriler"}
          </span>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 1. Bölüm: Temel Bilgiler */}
            <Card className="mb-4">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">1. Temel Bilgiler</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Başlık *</FormLabel>
                        <FormControl>
                          <Input placeholder="Önerinizin başlığı" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="targetDepartment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Uygulanacak Departman *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Departman seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map(dept => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {selectedSuggestionType === "kaizen" && (
                    <FormField
                      control={form.control}
                      name="kaizenType"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Kaizen Türü *</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value || ""}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value={KAIZEN_TYPES.BEFORE_AFTER} />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Önce-Sonra Kaizen
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value={KAIZEN_TYPES.KOBETSU} />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Kobetsu Kaizen
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="improvementType"
                    render={({ field }) => (
                      <FormItem className={selectedSuggestionType === "kaizen" ? "" : "md:col-span-2"}>
                        <FormLabel>İyileştirme Türü *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="İyileştirme türü seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={IMPROVEMENT_TYPES.ISG}>İSG</SelectItem>
                            <SelectItem value={IMPROVEMENT_TYPES.ENVIRONMENT}>Çevre</SelectItem>
                            <SelectItem value={IMPROVEMENT_TYPES.QUALITY}>Kalite</SelectItem>
                            <SelectItem value={IMPROVEMENT_TYPES.PRODUCTION}>Üretim</SelectItem>
                            <SelectItem value={IMPROVEMENT_TYPES.COST}>Maliyet</SelectItem>
                            <SelectItem value={IMPROVEMENT_TYPES.COMPETENCE}>Yetkinlik</SelectItem>
                            <SelectItem value={IMPROVEMENT_TYPES.SUSTAINABILITY}>Sürdürülebilirlik</SelectItem>
                            <SelectItem value={IMPROVEMENT_TYPES.FIVE_S}>5S</SelectItem>
                            <SelectItem value={IMPROVEMENT_TYPES.EFFICIENCY}>Verimlilik</SelectItem>
                            <SelectItem value={IMPROVEMENT_TYPES.OTHER}>Diğer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Kategori alanı kaldırıldı */}
              </CardContent>
            </Card>
            
            {/* 2. Bölüm: Ekip Üyeleri ve Proje Lideri */}
            {selectedSuggestionType === "kaizen" && (
              <Card className="mb-4">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">2. Ekip Bilgileri</h3>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="teamMembers"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Ekip Üyeleri (Maksimum 4 kişi)</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              {teamMembers.map((member, index) => (
                                <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
                                  <UserIcon className="h-4 w-4 text-gray-500" />
                                  <span>{member.name}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 ml-auto"
                                    onClick={() => {
                                      const newMembers = [...teamMembers];
                                      newMembers.splice(index, 1);
                                      setTeamMembers(newMembers);
                                      field.onChange(newMembers);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              
                              {teamMembers.length < 4 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="mt-2"
                                  onClick={() => {
                                    // Normalde bir modal açılıp kullanıcı seçimi yapılabilir
                                    // Örnek olarak şu an sabit değer ekliyoruz
                                    if (currentUser) {
                                      const newMember = {
                                        id: currentUser.id,
                                        name: currentUser.username || `Kullanıcı-${currentUser.id}`
                                      };
                                      const newMembers = [...teamMembers, newMember];
                                      setTeamMembers(newMembers);
                                      field.onChange(newMembers);
                                    }
                                  }}
                                >
                                  <PlusCircle className="h-4 w-4 mr-2" />
                                  Ekip Üyesi Ekle
                                </Button>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {showLeaderField && (
                      <FormField
                        control={form.control}
                        name="projectLeader"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Proje Lideri (Kobetsu Kaizen için zorunlu)</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(parseInt(value))} 
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Proje lideri seçin" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {teamMembers.map((member) => (
                                  <SelectItem key={member.id} value={member.id.toString()}>
                                    {member.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Proje lideri, ekip üyeleri arasından seçilmelidir.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Öneri Detayları */}
            <Card className="mb-4">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">
                  {selectedSuggestionType === "kaizen" ? "3. Kaizen Detayları" : "2. Kıvılcım Detayları"}
                </h3>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mevcut Durumun Tanımlanması *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Mevcut durumu detaylı olarak açıklayın" 
                          className="resize-none" 
                          rows={5}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Problemin ne olduğunu, etkilerini ve neden çözülmesi gerektiğini açıklayın.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="mt-4">
                  <FormLabel>Mevcut Durum Dosyaları (İsteğe bağlı)</FormLabel>
                  <div className="mt-2 p-4 border border-dashed rounded-md text-center bg-gray-50">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      Mevcut durumu gösteren fotoğraf veya dokümanları yükleyin
                    </p>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => {
                        // Normalde dosya yükleme işlemi burada yapılır
                        // Örnek olarak dosya URL'si ekliyoruz
                        const newFiles = [...currentStateFiles, "example_file_" + Date.now() + ".jpg"];
                        setCurrentStateFiles(newFiles);
                        form.setValue("currentStateFiles", newFiles);
                      }}
                    >
                      Dosya Seç
                    </Button>
                    
                    {currentStateFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {currentStateFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-white p-2 rounded text-sm">
                            <span className="truncate">{file}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newFiles = [...currentStateFiles];
                                newFiles.splice(index, 1);
                                setCurrentStateFiles(newFiles);
                                form.setValue("currentStateFiles", newFiles);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="benefits"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>İyileştirme Önerisi *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Önerdiğiniz iyileştirmeyi açıklayın" 
                          className="resize-none" 
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Önerdiğiniz çözümü, uygulama adımlarını ve beklenen sonuçları açıklayın.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="mt-4">
                  <FormLabel>İyileştirme Önerisi Dosyaları (İsteğe bağlı)</FormLabel>
                  <div className="mt-2 p-4 border border-dashed rounded-md text-center bg-gray-50">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      İyileştirme önerinizle ilgili çizim, şema veya dokümanları yükleyin
                    </p>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => {
                        // Normalde dosya yükleme işlemi burada yapılır
                        // Örnek olarak dosya URL'si ekliyoruz
                        const newFiles = [...improvementFiles, "example_improvement_" + Date.now() + ".jpg"];
                        setImprovementFiles(newFiles);
                        form.setValue("improvementFiles", newFiles);
                      }}
                    >
                      Dosya Seç
                    </Button>
                    
                    {improvementFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {improvementFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-white p-2 rounded text-sm">
                            <span className="truncate">{file}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newFiles = [...improvementFiles];
                                newFiles.splice(index, 1);
                                setImprovementFiles(newFiles);
                                form.setValue("improvementFiles", newFiles);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Şirkete Katkısı */}
            <Card className="mb-4">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">
                  {selectedSuggestionType === "kaizen" ? "4. Şirkete Katkısı" : "3. Şirkete Katkısı"}
                </h3>
                
                <FormField
                  control={form.control}
                  name="companyContribution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şirkete Katkısı *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Bu önerinin şirkete sağlayacağı katkıları açıklayın" 
                          className="resize-none" 
                          rows={3}
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          disabled={field.disabled}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormDescription>
                        Maliyet tasarrufu, verimlilik artışı, kalite iyileştirmesi gibi ölçülebilir katkıları belirtin.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => form.reset()}
                disabled={isSubmitting}
              >
                Temizle
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Gönderiliyor..." : "Gönder"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
