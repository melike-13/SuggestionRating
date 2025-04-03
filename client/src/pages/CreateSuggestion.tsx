import TabNavigation from "@/components/TabNavigation";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { extendedInsertSuggestionSchema, SUGGESTION_CATEGORIES, User } from "@shared/schema";
import { z } from "zod";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

// Transform the schema for form usage
const formSchema = extendedInsertSuggestionSchema.omit({ submittedBy: true });

export default function CreateSuggestion() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  
  // Get current user
  const { data: userData } = useQuery<{ user: User | null }>({ 
    queryKey: ['/api/auth/user'],
  });
  
  const currentUser = userData?.user || null;
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: undefined,
      benefits: "",
    },
  });
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", "/api/suggestions", values);
      
      queryClient.invalidateQueries({ queryKey: ['/api/suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/suggestions'] });
      
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
        <h2 className="text-2xl font-bold text-neutral-900">Yeni Öneri Oluştur</h2>
        <p className="text-neutral-700">Kaizen iyileştirme önerinizi paylaşın</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Kategori seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={SUGGESTION_CATEGORIES.PRODUCTION}>Üretim Verimliliği</SelectItem>
                        <SelectItem value={SUGGESTION_CATEGORIES.QUALITY}>Kalite İyileştirme</SelectItem>
                        <SelectItem value={SUGGESTION_CATEGORIES.SAFETY}>İş Güvenliği</SelectItem>
                        <SelectItem value={SUGGESTION_CATEGORIES.ENVIRONMENT}>Çevre ve Sürdürülebilirlik</SelectItem>
                        <SelectItem value={SUGGESTION_CATEGORIES.COST}>Maliyet Azaltma</SelectItem>
                        <SelectItem value={SUGGESTION_CATEGORIES.WORKPLACE}>İş Yeri Düzeni</SelectItem>
                        <SelectItem value={SUGGESTION_CATEGORIES.OTHER}>Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Önerinizi detaylı olarak açıklayın" 
                      className="resize-none" 
                      rows={5}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Problemin ne olduğunu, çözüm önerinizi ve nasıl uygulanabileceğini açıklayın.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="benefits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beklenen Faydalar *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Bu önerinin uygulanmasıyla elde edilecek faydaları açıklayın" 
                      className="resize-none" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Maliyet tasarrufu, verimlilik artışı, kalite iyileştirmesi gibi ölçülebilir faydaları belirtin.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
