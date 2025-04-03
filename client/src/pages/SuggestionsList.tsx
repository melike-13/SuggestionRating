import TabNavigation from "@/components/TabNavigation";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Suggestion, SUGGESTION_STATUSES, User } from "@shared/schema";
import { format } from "date-fns";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import SuggestionDetailModal from "@/components/SuggestionDetailModal";

export default function SuggestionsList() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Get current user
  const { data: userData } = useQuery<{ user: User | null }>({ 
    queryKey: ['/api/auth/user'],
  });
  
  const currentUser = userData?.user || null;
  
  // Fetch suggestions
  const { data: suggestionsData, isLoading } = useQuery<Suggestion[]>({
    queryKey: ['/api/suggestions'],
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Öneriler yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    }
  });
  
  const formatDate = (date: Date | string) => {
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
  
  const handleViewSuggestion = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setModalOpen(true);
  };
  
  // Filter and paginate suggestions
  const filteredSuggestions = suggestionsData
    ? suggestionsData.filter((suggestion) => {
        const matchesSearch = searchQuery === "" || 
          suggestion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          suggestion.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || suggestion.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
    : [];
  
  const totalPages = Math.ceil(filteredSuggestions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSuggestions = filteredSuggestions.slice(startIndex, startIndex + itemsPerPage);
  
  return (
    <div>
      <TabNavigation activeTab="suggestions" user={currentUser} />
      
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Öneriler</h2>
          <p className="text-neutral-700">Tüm Kaizen iyileştirme önerileri</p>
        </div>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
          <div className="relative">
            <Input
              type="text"
              placeholder="Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 w-full"
            />
            <span className="material-icons absolute left-3 top-2 text-neutral-500">search</span>
          </div>
          <Select 
            value={statusFilter} 
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Tüm Durumlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value={SUGGESTION_STATUSES.NEW}>Yeni</SelectItem>
              <SelectItem value={SUGGESTION_STATUSES.REVIEW}>İnceleniyor</SelectItem>
              <SelectItem value={SUGGESTION_STATUSES.APPROVED}>Onaylandı</SelectItem>
              <SelectItem value={SUGGESTION_STATUSES.IMPLEMENTED}>Uygulandı</SelectItem>
              <SelectItem value={SUGGESTION_STATUSES.REJECTED}>Reddedildi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-neutral-100">
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-900">Başlık</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-900">Açıklama</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-900">Kategori</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-900">Durum</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-900">Tarih</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-900">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Skeleton loading state
                Array(5).fill(0).map((_, index) => (
                  <tr key={index} className="border-b border-neutral-200">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-60" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-6 rounded-full" /></td>
                  </tr>
                ))
              ) : paginatedSuggestions.length > 0 ? (
                paginatedSuggestions.map((suggestion) => (
                  <tr key={suggestion.id} className="border-b border-neutral-200">
                    <td className="px-4 py-3 text-sm text-neutral-900">{suggestion.title}</td>
                    <td className="px-4 py-3 text-sm text-neutral-900">
                      {suggestion.description.length > 50 
                        ? `${suggestion.description.substring(0, 50)}...` 
                        : suggestion.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-900">{suggestion.category}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusClass(suggestion.status)}`}>
                        {getStatusLabel(suggestion.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-900">{formatDate(suggestion.submittedAt)}</td>
                    <td className="px-4 py-3">
                      <button 
                        className="text-blue-500 hover:text-primary"
                        onClick={() => handleViewSuggestion(suggestion)}
                      >
                        <span className="material-icons">visibility</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-neutral-200">
                  <td colSpan={6} className="px-4 py-3 text-center text-sm text-neutral-700">
                    {searchQuery || statusFilter !== "all" 
                      ? "Arama kriterlerine uygun öneri bulunamadı." 
                      : "Henüz öneri bulunmamaktadır."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredSuggestions.length > 0 && (
          <div className="p-4 flex justify-between">
            <div>
              <p className="text-sm text-neutral-700">
                Toplam {filteredSuggestions.length} öneri
              </p>
            </div>
            <div className="flex space-x-2">
              <button 
                className={`px-3 py-1 border border-neutral-200 rounded-md ${currentPage === 1 ? 'text-neutral-400 cursor-not-allowed' : 'hover:bg-neutral-100'}`}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <span className="material-icons text-sm">chevron_left</span>
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Simple logic for page numbers display
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 3 + i;
                  if (pageNum > totalPages) {
                    pageNum = totalPages - (4 - i);
                  }
                }
                
                return pageNum <= totalPages ? (
                  <button
                    key={i}
                    className={`px-3 py-1 rounded-md ${currentPage === pageNum ? 'bg-primary text-white' : 'border border-neutral-200 hover:bg-neutral-100'}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ) : null;
              })}
              
              <button 
                className={`px-3 py-1 border border-neutral-200 rounded-md ${currentPage === totalPages ? 'text-neutral-400 cursor-not-allowed' : 'hover:bg-neutral-100'}`}
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <span className="material-icons text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Detail Modal */}
      <SuggestionDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        suggestion={selectedSuggestion}
        currentUser={currentUser}
      />
    </div>
  );
}
