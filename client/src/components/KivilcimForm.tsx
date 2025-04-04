import React, { useState } from "react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import type { MouseEvent } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Upload, Calculator, PlusCircle, X } from "lucide-react";
import { User } from "@shared/schema";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

interface KivilcimFormProps {
  form: UseFormReturn<any>;
  currentUser: User | null;
  currentStateFiles: string[];
  setCurrentStateFiles: React.Dispatch<React.SetStateAction<string[]>>;
  improvementFiles: string[];
  setImprovementFiles: React.Dispatch<React.SetStateAction<string[]>>;
}

interface CostItem {
  description: string;
  amount: number;
  unitPrice: number;
  totalPrice: number;
}

const KivilcimForm: React.FC<KivilcimFormProps> = ({
  form,
  currentUser,
  currentStateFiles,
  setCurrentStateFiles,
  improvementFiles,
  setImprovementFiles
}) => {
  // Revizyon modunu kontrol et
  const [isRevision, setIsRevision] = useState(false);

  // Maliyet hesaplaması için state'ler
  const [currentCosts, setCurrentCosts] = useState<CostItem[]>([{ description: "", amount: 0, unitPrice: 0, totalPrice: 0 }]);
  const [proposedCosts, setProposedCosts] = useState<CostItem[]>([{ description: "", amount: 0, unitPrice: 0, totalPrice: 0 }]);
  const [additionalBenefits, setAdditionalBenefits] = useState<CostItem[]>([{ description: "", amount: 0, unitPrice: 0, totalPrice: 0 }]);
  
  // Öneri sahipleri için state (Maksimum 4 kişi)
  const [suggestionOwners, setSuggestionOwners] = useState<{name: string; role: string; department: string}[]>([]);

  // Toplam maliyet hesaplama
  const calculateTotalCost = (items: CostItem[]) => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const updateCostItem = (
    index: number, 
    field: keyof CostItem, 
    value: string | number, 
    costType: "current" | "proposed" | "benefits"
  ) => {
    const updateState = (items: CostItem[]) => {
      const newItems = [...items];
      
      const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
      
      if (field === "amount" || field === "unitPrice") {
        newItems[index] = {
          ...newItems[index],
          [field]: numValue,
          totalPrice: field === "amount" 
            ? numValue * newItems[index].unitPrice 
            : newItems[index].amount * numValue
        };
      } else {
        newItems[index] = {
          ...newItems[index],
          [field]: value
        };
      }
      
      return newItems;
    };
    
    switch (costType) {
      case "current":
        setCurrentCosts(updateState(currentCosts));
        break;
      case "proposed":
        setProposedCosts(updateState(proposedCosts));
        break;
      case "benefits":
        setAdditionalBenefits(updateState(additionalBenefits));
        break;
    }
    
    // Form değerine kaydet
    const costCalculationDetails = {
      current: costType === "current" ? updateState(currentCosts) : currentCosts,
      proposed: costType === "proposed" ? updateState(proposedCosts) : proposedCosts,
      benefits: costType === "benefits" ? updateState(additionalBenefits) : additionalBenefits
    };
    
    form.setValue("costCalculationDetails", costCalculationDetails);
  };

  const addCostItem = (costType: "current" | "proposed" | "benefits") => {
    const newItem = { description: "", amount: 0, unitPrice: 0, totalPrice: 0 };
    
    switch (costType) {
      case "current":
        setCurrentCosts([...currentCosts, newItem]);
        break;
      case "proposed":
        setProposedCosts([...proposedCosts, newItem]);
        break;
      case "benefits":
        setAdditionalBenefits([...additionalBenefits, newItem]);
        break;
    }
  };

  const removeCostItem = (index: number, costType: "current" | "proposed" | "benefits") => {
    switch (costType) {
      case "current":
        setCurrentCosts(currentCosts.filter((_, i: number) => i !== index));
        break;
      case "proposed":
        setProposedCosts(proposedCosts.filter((_, i: number) => i !== index));
        break;
      case "benefits":
        setAdditionalBenefits(additionalBenefits.filter((_, i: number) => i !== index));
        break;
    }
  };

  const totalCurrentCosts = calculateTotalCost(currentCosts);
  const totalProposedCosts = calculateTotalCost(proposedCosts);
  const totalBenefits = calculateTotalCost(additionalBenefits);
  const benefitCostRatio = totalProposedCosts > 0 ? totalBenefits / totalProposedCosts : 0;

  // Revizyon durumunu form state'ine ekle
  React.useEffect(() => {
    // isRevision değeri değiştiğinde, formdaki isRevision değerini güncelle
    form.setValue("isRevision", isRevision);
    
    // Eğer revizyon modu aktifse, maliyet hesaplama kısmını temizle
    if (isRevision) {
      setCurrentCosts([{ description: "", amount: 0, unitPrice: 0, totalPrice: 0 }]);
      setProposedCosts([{ description: "", amount: 0, unitPrice: 0, totalPrice: 0 }]);
      setAdditionalBenefits([{ description: "", amount: 0, unitPrice: 0, totalPrice: 0 }]);
      
      form.setValue("costCalculationDetails", {
        current: [],
        proposed: [],
        benefits: []
      });
    }
  }, [isRevision, form]);

  return (
    <>
      {/* Öneri Revizyon Seçeneği - Formun en üstünde */}
      <Card className="mb-4 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Öneri Revizyon Seçeneği</h3>
          </div>
          
          <div className="p-4 rounded-md mb-4">
            <p className="text-sm text-blue-700">
              Eğer önerinizin revize edilmesi gerekiyorsa, aşağıdaki kutucuğu işaretleyerek revizyon sürecini başlatabilirsiniz. 
              Revizyon durumunda sadece öneri temel bilgileri ve öneri sahibi kısmını doldurmanız yeterli olacaktır.
            </p>
          </div>
          
          <FormField
            control={form.control}
            name="isRevision"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-white p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Öneriyi Revize Et
                  </FormLabel>
                  <FormDescription>
                    Sadece temel bilgileri doldurmanız gerekecek
                  </FormDescription>
                </div>
                <FormControl>
                  <input
                    type="checkbox"
                    checked={isRevision}
                    onChange={(e) => setIsRevision(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
      
      {/* 1. Öneri Sahibi ve Ekip Bilgileri */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">1. Öneri Sahibi ve İç Danışman Bilgileri</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-sm mb-3">Öneri Sahipleri (Maksimum 4 kişi)</h4>
              
              <div className="bg-gray-50 p-3 rounded-md space-y-2">
                {/* Ana öneri sahibi bilgileri */}
                <div className="mb-2">
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
                </div>
                
                <div className="mb-2">
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
                </div>
                
                <div className="mb-2">
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
                
                {/* Ek öneri sahipleri */}
                {suggestionOwners.map((owner, index) => (
                  <div key={index} className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium">{index + 2}. Öneri Sahibi</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          const newOwners = [...suggestionOwners];
                          newOwners.splice(index, 1);
                          setSuggestionOwners(newOwners);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <div className="mb-2">
                        <Input 
                          placeholder="Öneri sahibinin adı soyadı" 
                          value={owner.name}
                          onChange={(e) => {
                            const newOwners = [...suggestionOwners];
                            newOwners[index].name = e.target.value;
                            setSuggestionOwners(newOwners);
                          }}
                          className="h-8 text-sm" 
                        />
                      </div>
                      
                      <div className="mb-2 grid grid-cols-2 gap-2">
                        <Input 
                          placeholder="Görevi" 
                          value={owner.role}
                          onChange={(e) => {
                            const newOwners = [...suggestionOwners];
                            newOwners[index].role = e.target.value;
                            setSuggestionOwners(newOwners);
                          }}
                          className="h-8 text-sm" 
                        />
                        
                        <Input 
                          placeholder="Bölümü" 
                          value={owner.department}
                          onChange={(e) => {
                            const newOwners = [...suggestionOwners];
                            newOwners[index].department = e.target.value;
                            setSuggestionOwners(newOwners);
                          }}
                          className="h-8 text-sm" 
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Öneri Sahibi Ekle Butonu */}
                {suggestionOwners.length < 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full text-xs"
                    onClick={() => {
                      setSuggestionOwners([
                        ...suggestionOwners,
                        { name: "", role: "", department: "" }
                      ]);
                    }}
                  >
                    <PlusCircle className="h-3 w-3 mr-1" />
                    Öneri Sahibi Ekle
                  </Button>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-3">İç Danışman (İsteğe Bağlı)</h4>
              
              <FormField
                control={form.control}
                name="internalConsultant"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="İç danışman sicil numarası" {...field} />
                    </FormControl>
                    <FormDescription>
                      Eğer varsa, danışmanlık aldığınız kişinin sicil numarasını girin
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 2. Öneri Detayları */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">2. Öneri Detayları</h3>
          
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
                      rows={5}
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
      
      {/* 3. Maliyet Hesapları */}
      {!isRevision && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">3. Maliyet Hesapları</h3>
              <Calculator className="h-5 w-5 text-gray-500" />
            </div>
            
            <div className="space-y-6">
              {/* Mevcut Durumda İşletim Maliyeti */}
              <div>
                <h4 className="font-medium mb-2">Mevcut Durumda İşletim Maliyeti (Mevcut Kayıplar)</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Cins ve/veya Açıklama</TableHead>
                      <TableHead>Miktar</TableHead>
                      <TableHead>Birim Tutar (₺)</TableHead>
                      <TableHead>Tutar (₺)</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentCosts.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input 
                            value={item.description} 
                            onChange={(e) => updateCostItem(index, "description", e.target.value, "current")}
                            placeholder="Açıklama"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            value={item.amount} 
                            onChange={(e) => updateCostItem(index, "amount", e.target.value, "current")}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            value={item.unitPrice} 
                            onChange={(e) => updateCostItem(index, "unitPrice", e.target.value, "current")}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>{item.totalPrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCostItem(index, "current")}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">Toplam:</TableCell>
                      <TableCell className="font-medium">{totalCurrentCosts.toFixed(2)} ₺</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addCostItem("current")}
                  className="mt-2"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Maliyet Kalemi Ekle
                </Button>
              </div>
              
              {/* Önerilen Durumda Yatırım ve İşletim Maliyeti */}
              <div>
                <h4 className="font-medium mb-2">Önerilen Durumda Yatırım ve İşletim Maliyeti</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Cins ve/veya Açıklama</TableHead>
                      <TableHead>Miktar</TableHead>
                      <TableHead>Birim Tutar (₺)</TableHead>
                      <TableHead>Tutar (₺)</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proposedCosts.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input 
                            value={item.description} 
                            onChange={(e) => updateCostItem(index, "description", e.target.value, "proposed")}
                            placeholder="Açıklama"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            value={item.amount} 
                            onChange={(e) => updateCostItem(index, "amount", e.target.value, "proposed")}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            value={item.unitPrice} 
                            onChange={(e) => updateCostItem(index, "unitPrice", e.target.value, "proposed")}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>{item.totalPrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCostItem(index, "proposed")}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">Toplam:</TableCell>
                      <TableCell className="font-medium">{totalProposedCosts.toFixed(2)} ₺</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addCostItem("proposed")}
                  className="mt-2"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Maliyet Kalemi Ekle
                </Button>
              </div>
              
              {/* Önerinin Sağladığı Ek Faydalar */}
              <div>
                <h4 className="font-medium mb-2">Önerinin Sağladığı Ek Faydalar</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Cins ve/veya Açıklama</TableHead>
                      <TableHead>Miktar</TableHead>
                      <TableHead>Birim Tutar (₺)</TableHead>
                      <TableHead>Tutar (₺)</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {additionalBenefits.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input 
                            value={item.description} 
                            onChange={(e) => updateCostItem(index, "description", e.target.value, "benefits")}
                            placeholder="Fayda açıklaması"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            value={item.amount} 
                            onChange={(e) => updateCostItem(index, "amount", e.target.value, "benefits")}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            value={item.unitPrice} 
                            onChange={(e) => updateCostItem(index, "unitPrice", e.target.value, "benefits")}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>{item.totalPrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCostItem(index, "benefits")}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">Toplam:</TableCell>
                      <TableCell className="font-medium">{totalBenefits.toFixed(2)} ₺</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addCostItem("benefits")}
                  className="mt-2"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Fayda Kalemi Ekle
                </Button>
              </div>
              
              {/* Fayda/Maliyet Oranı */}
              <div className="mt-6 bg-gray-50 p-4 rounded-md">
                <h4 className="font-medium mb-3">Fayda/Maliyet Analizi</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Mevcut Durum Maliyeti (Yıllık):</span>
                    <span className="font-medium">{totalCurrentCosts.toFixed(2)} ₺</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Önerilen Durum Maliyeti:</span>
                    <span className="font-medium">{totalProposedCosts.toFixed(2)} ₺</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Ek Faydalar (Yıllık):</span>
                    <span className="font-medium">{totalBenefits.toFixed(2)} ₺</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center">
                    <span>Net Fayda (Yıllık):</span>
                    <span className="font-medium">{(totalCurrentCosts + totalBenefits - totalProposedCosts).toFixed(2)} ₺</span>
                  </div>
                  <div className="flex justify-between items-center font-bold">
                    <span>F/M ORANI:</span>
                    <span>
                      {totalProposedCosts > 0 ? 
                        ((totalCurrentCosts + totalBenefits) / totalProposedCosts).toFixed(2) : 
                        "∞"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default KivilcimForm;