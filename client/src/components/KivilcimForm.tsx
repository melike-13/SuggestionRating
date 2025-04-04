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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  // Maliyet hesaplaması için state'ler
  const [materialsCost, setMaterialsCost] = useState<CostItem[]>([{ description: "", amount: 0, unitPrice: 0, totalPrice: 0 }]);
  const [laborCost, setLaborCost] = useState<CostItem[]>([{ description: "", amount: 0, unitPrice: 0, totalPrice: 0 }]);
  const [otherCost, setOtherCost] = useState<CostItem[]>([{ description: "", amount: 0, unitPrice: 0, totalPrice: 0 }]);
  
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
    costType: "materials" | "labor" | "other"
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
      case "materials":
        setMaterialsCost(updateState(materialsCost));
        break;
      case "labor":
        setLaborCost(updateState(laborCost));
        break;
      case "other":
        setOtherCost(updateState(otherCost));
        break;
    }
    
    // Form değerine kaydet
    const costCalculationDetails = {
      materials: costType === "materials" ? updateState(materialsCost) : materialsCost,
      labor: costType === "labor" ? updateState(laborCost) : laborCost,
      other: costType === "other" ? updateState(otherCost) : otherCost
    };
    
    form.setValue("costCalculationDetails", costCalculationDetails);
  };

  const addCostItem = (costType: "materials" | "labor" | "other") => {
    const newItem = { description: "", amount: 0, unitPrice: 0, totalPrice: 0 };
    
    switch (costType) {
      case "materials":
        setMaterialsCost([...materialsCost, newItem]);
        break;
      case "labor":
        setLaborCost([...laborCost, newItem]);
        break;
      case "other":
        setOtherCost([...otherCost, newItem]);
        break;
    }
  };

  const removeCostItem = (index: number, costType: "materials" | "labor" | "other") => {
    switch (costType) {
      case "materials":
        setMaterialsCost(materialsCost.filter((_, i) => i !== index));
        break;
      case "labor":
        setLaborCost(laborCost.filter((_, i) => i !== index));
        break;
      case "other":
        setOtherCost(otherCost.filter((_, i) => i !== index));
        break;
    }
  };

  const totalMaterialsCost = calculateTotalCost(materialsCost);
  const totalLaborCost = calculateTotalCost(laborCost);
  const totalOtherCost = calculateTotalCost(otherCost);
  const grandTotal = totalMaterialsCost + totalLaborCost + totalOtherCost;

  return (
    <>
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
          
          <div className="mt-6">
            <FormField
              control={form.control}
              name="companyContribution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Şirkete Katkısı</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Önerinizin şirkete sağlayacağı katkıları açıklayın" 
                      className="resize-none" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Önerinizin şirkete nasıl bir katkı sağlayacağını belirtin
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* 3. Maliyet Hesapları */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">3. Maliyet Hesapları</h3>
            <Calculator className="h-5 w-5 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            {/* Malzeme Maliyetleri */}
            <div>
              <h4 className="font-medium mb-2">Malzeme Maliyetleri</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Açıklama</TableHead>
                    <TableHead>Miktar</TableHead>
                    <TableHead>Birim Fiyat (₺)</TableHead>
                    <TableHead>Toplam (₺)</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialsCost.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input 
                          value={item.description} 
                          onChange={(e) => updateCostItem(index, "description", e.target.value, "materials")}
                          placeholder="Malzeme adı"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={item.amount} 
                          onChange={(e) => updateCostItem(index, "amount", e.target.value, "materials")}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={item.unitPrice} 
                          onChange={(e) => updateCostItem(index, "unitPrice", e.target.value, "materials")}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>{item.totalPrice.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCostItem(index, "materials")}
                          disabled={materialsCost.length === 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-medium">
                      Toplam Malzeme Maliyeti:
                    </TableCell>
                    <TableCell className="font-medium">{totalMaterialsCost.toFixed(2)} ₺</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addCostItem("materials")}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            {/* İşçilik Maliyetleri */}
            <div>
              <h4 className="font-medium mb-2">İşçilik Maliyetleri</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Açıklama</TableHead>
                    <TableHead>Miktar</TableHead>
                    <TableHead>Birim Fiyat (₺)</TableHead>
                    <TableHead>Toplam (₺)</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {laborCost.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input 
                          value={item.description} 
                          onChange={(e) => updateCostItem(index, "description", e.target.value, "labor")}
                          placeholder="İşçilik tipi"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={item.amount} 
                          onChange={(e) => updateCostItem(index, "amount", e.target.value, "labor")}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={item.unitPrice} 
                          onChange={(e) => updateCostItem(index, "unitPrice", e.target.value, "labor")}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>{item.totalPrice.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCostItem(index, "labor")}
                          disabled={laborCost.length === 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-medium">
                      Toplam İşçilik Maliyeti:
                    </TableCell>
                    <TableCell className="font-medium">{totalLaborCost.toFixed(2)} ₺</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addCostItem("labor")}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            {/* Diğer Maliyetler */}
            <div>
              <h4 className="font-medium mb-2">Diğer Maliyetler</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Açıklama</TableHead>
                    <TableHead>Miktar</TableHead>
                    <TableHead>Birim Fiyat (₺)</TableHead>
                    <TableHead>Toplam (₺)</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {otherCost.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input 
                          value={item.description} 
                          onChange={(e) => updateCostItem(index, "description", e.target.value, "other")}
                          placeholder="Maliyet adı"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={item.amount} 
                          onChange={(e) => updateCostItem(index, "amount", e.target.value, "other")}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={item.unitPrice} 
                          onChange={(e) => updateCostItem(index, "unitPrice", e.target.value, "other")}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>{item.totalPrice.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCostItem(index, "other")}
                          disabled={otherCost.length === 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-medium">
                      Toplam Diğer Maliyetler:
                    </TableCell>
                    <TableCell className="font-medium">{totalOtherCost.toFixed(2)} ₺</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addCostItem("other")}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            {/* Toplam Maliyet Özeti */}
            <div className="mt-6 bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-3">Toplam Maliyet Özeti</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Toplam Malzeme Maliyeti:</span>
                  <span>{totalMaterialsCost.toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between">
                  <span>Toplam İşçilik Maliyeti:</span>
                  <span>{totalLaborCost.toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between">
                  <span>Toplam Diğer Maliyetler:</span>
                  <span>{totalOtherCost.toFixed(2)} ₺</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>GENEL TOPLAM:</span>
                  <span>{grandTotal.toFixed(2)} ₺</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 4. Ön Kontrol Listesi */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">4. Ön Kontrol Listesi</h3>
          
          <FormField
            control={form.control}
            name="preChecklistItems"
            render={() => (
              <FormItem>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="checklist-1"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="checklist-1" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Önerimin uygulanabilir olduğunu kontrol ettim
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="checklist-2"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="checklist-2" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Öneri formunu eksiksiz doldurdum
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="checklist-3"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="checklist-3" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Önerimle ilgili gerekli fotoğraf ve dokümanları ekledim
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="checklist-4"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="checklist-4" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Maliyet hesaplarını doğru bir şekilde yaptım
                    </label>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </>
  );
};

export default KivilcimForm;