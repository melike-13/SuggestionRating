import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  suggestionFormSchema, 
  categories, 
  categoryLabels,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SuggestionFormProps {
  isModal?: boolean;
  onClose?: () => void;
}

export function SuggestionForm({ isModal = false, onClose }: SuggestionFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(suggestionFormSchema),
    defaultValues: {
      title: "",
      category: undefined,
      description: "",
      benefits: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/suggestions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suggestions/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      
      toast({
        title: "Öneri gönderildi",
        description: "Öneriniz başarıyla kaydedildi.",
      });
      
      if (isModal && onClose) {
        onClose();
      } else {
        navigate("/suggestions");
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Hata oluştu",
        description: "Öneriniz gönderilemedi. Lütfen tekrar deneyin.",
      });
    },
  });

  async function onSubmit(values: any) {
    setIsSubmitting(true);
    try {
      await mutation.mutateAsync(values);
    } finally {
      setIsSubmitting(false);
    }
  }

  const content = (
    <div className={isModal ? "" : "p-4 sm:p-6 lg:p-8"}>
      {!isModal && (
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Yeni Öneri Ekle</h2>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Başlık</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Önerinizin başlığı" 
                    {...field} 
                  />
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
                <FormLabel>Kategori</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori Seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {categoryLabels[category]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Açıklama</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Önerinizi detaylı olarak açıklayın..." 
                    rows={4}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="benefits"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Beklenen Faydalar</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Bu önerinin getireceği faydaları yazın..." 
                    rows={3}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end space-x-4">
            {isModal && onClose && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                İptal
              </Button>
            )}
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
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 overflow-y-auto z-50" role="dialog">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
            <div className="absolute top-0 right-0 pt-4 pr-4">
              {onClose && (
                <button 
                  type="button" 
                  className="bg-white rounded-md text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" 
                  onClick={onClose}
                >
                  <span className="sr-only">Kapat</span>
                  <X className="h-6 w-6" />
                </button>
              )}
            </div>
            <div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-slate-900">
                  Yeni Öneri Ekle
                </h3>
                <div className="mt-6">
                  {content}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return content;
}
