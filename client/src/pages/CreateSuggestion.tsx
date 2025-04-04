import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { KAIZEN_TYPES, IMPROVEMENT_TYPES, SUGGESTION_CATEGORIES, User, extendedInsertSuggestionSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import TabNavigation from "@/components/TabNavigation";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, PlusCircle, X, User as UserIcon, Sparkles, Zap, Calculator, Loader2 } from "lucide-react";
import KivilcimForm from "@/components/KivilcimForm";

// Genişletilmiş form şeması
const formSchema = extendedInsertSuggestionSchema.omit({ submittedBy: true }).extend({
  // Öneri sahibi bilgileri için ortak alanlar
  submitterName: z.string().optional(),
  submitterRole: z.string().optional(),
  submitterDepartment: z.string().optional(),
  
  // Kıvılcım formu için ek alanlar
  internalConsultant: z.string().optional(),
  isRevision: z.boolean().optional(),
  costCalculationDetails: z.object({
    current: z.array(z.object({
      description: z.string(),
      amount: z.number(),
      unitPrice: z.number(),
      totalPrice: z.number()
    })).optional(),
    proposed: z.array(z.object({
      description: z.string(),
      amount: z.number(),
      unitPrice: z.number(),
      totalPrice: z.number()
    })).optional(),
    benefits: z.array(z.object({
      description: z.string(),
      amount: z.number(),
      unitPrice: z.number(),
      totalPrice: z.number()
    })).optional()
  }).optional(),
  currentStateFiles: z.array(z.string()).optional(),
  improvementFiles: z.array(z.string()).optional()
});

export default function CreateSuggestion() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  
  // Kullanıcı bilgisini ve öneri türünü al
  const { data: userData } = useQuery<{ user: User | null }>({ 
    queryKey: ['/api/auth/user'],
  });
  
  const currentUser = userData?.user || null;
  // Öneri tipini localStorage'dan alıyoruz
  const selectedSuggestionType = localStorage.getItem("selectedSuggestionType") || "kaizen";
  
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
  
  // Departman listesi
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
      isRevision: false
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
      
      // Kıvılcım için başlangıç statüsünü özel olarak ayarlayabiliriz
      if (selectedSuggestionType === "kivilcim") {
        // API tarafında ayarlanacak, burada sadece bilgi olarak ekledik
        console.log("Kıvılcım önerisi oluşturuluyor, statü KIVILCIM_INITIAL_REVIEW olacak");
      }
      
      await apiRequest("POST", "/api/suggestions", suggestionData);
      
      // Öneri listesini hemen güncelle, kullanıcıya yeni önerileri göster
      await queryClient.invalidateQueries({ queryKey: ['/api/suggestions'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/stats/suggestions'] });
      
      toast({
        title: "Başarılı",
        description: selectedSuggestionType === "kaizen" 
          ? "Kaizen öneriniz başarıyla kaydedildi." 
          : "Kıvılcım öneriniz başarıyla kaydedildi.",
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
              </CardContent>
            </Card>
            
            {/* 2. Bölüm: Ekip Üyeleri ve Proje Lideri (Sadece Kaizen için) / Kıvılcım Formu (Kıvılcım için) */}
            {selectedSuggestionType === "kaizen" ? (
              <Card className="mb-4">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">2. Ekip Bilgileri</h3>
                  
                  {/* Öneri sahibi bilgileri - manuel giriş */}
                  <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <h4 className="font-medium text-sm mb-3">Öneri Sahibi</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="submitterName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Adı-Soyadı:</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Öneri sahibinin adı soyadı" 
                                {...field} 
                                className="h-8 text-sm" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="submitterRole"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Görevi:</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Öneri sahibinin görevi/pozisyonu" 
                                {...field} 
                                className="h-8 text-sm" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="submitterDepartment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Bölümü:</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Öneri sahibinin bölümü/departmanı" 
                                {...field} 
                                className="h-8 text-sm" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="teamMembers"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Ekip Üyeleri {form.watch("kaizenType") === KAIZEN_TYPES.KOBETSU ? "(Maksimum 4 kişi + 1 Proje Lideri)" : "(Maksimum 3 kişi)"}</FormLabel>
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
                              
                              {(form.watch("kaizenType") === KAIZEN_TYPES.KOBETSU ? teamMembers.length < 4 : teamMembers.length < 3) && (
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
                            <FormLabel>Proje Lideri</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Proje lideri seçin" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {usersData?.map(user => (
                                  <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.displayName || user.username || `Kullanıcı-${user.id}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Kobetsu Kaizen için proje lideri seçin
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <KivilcimForm 
                form={form} 
                currentUser={currentUser}
                currentStateFiles={currentStateFiles}
                setCurrentStateFiles={setCurrentStateFiles}
                improvementFiles={improvementFiles}
                setImprovementFiles={setImprovementFiles}
              />
            )}
            
            {/* 3. Bölüm: Öneri Detayları (Sadece Kaizen için) */}
            {selectedSuggestionType === "kaizen" && (
              <Card className="mb-4">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">3. Öneri Detayları</h3>
                  
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
                            rows={4}
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
                            <div key={index} className="flex items-center space-x-2 bg-white p-2 rounded text-left">
                              <span className="truncate flex-1 text-xs">{file}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
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
                  
                  <div className="mt-6">
                    <FormField
                      control={form.control}
                      name="benefits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Önerilen Çözüm ve Beklenen Faydalar *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Önerdiğiniz çözümü ve sağlayacağı faydaları açıklayın" 
                              className="resize-none" 
                              rows={4}
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Sunduğunuz çözümü ve sağlayacağı iyileştirmeleri detaylandırın.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="mt-4">
                    <FormLabel>İyileştirme Dosyaları (İsteğe bağlı)</FormLabel>
                    <div className="mt-2 p-4 border border-dashed rounded-md text-center bg-gray-50">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        Önerilen çözümle ilgili fotoğraf veya dokümanları yükleyin
                      </p>
                      <Button 
                        type="button" 
                        variant="secondary" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => {
                          // Normalde dosya yükleme işlemi burada yapılır
                          // Örnek olarak dosya URL'si ekliyoruz
                          const newFiles = [...improvementFiles, "example_solution_" + Date.now() + ".jpg"];
                          setImprovementFiles(newFiles);
                          form.setValue("improvementFiles", newFiles);
                        }}
                      >
                        Dosya Seç
                      </Button>
                      
                      {improvementFiles.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {improvementFiles.map((file, index) => (
                            <div key={index} className="flex items-center space-x-2 bg-white p-2 rounded text-left">
                              <span className="truncate flex-1 text-xs">{file}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
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
            )}
            
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