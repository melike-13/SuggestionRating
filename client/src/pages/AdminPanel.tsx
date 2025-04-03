import TabNavigation from "@/components/TabNavigation";
import { useQuery } from "@tanstack/react-query";
import { Suggestion, User, SUGGESTION_STATUSES, Reward } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import SuggestionDetailModal from "@/components/SuggestionDetailModal";
import { useLocation } from "wouter";

export default function AdminPanel() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Get current user
  const { data: userData } = useQuery<{ user: User | null }>({ 
    queryKey: ['/api/auth/user'],
  });
  
  const currentUser = userData?.user || null;
  
  // Redirect non-admin users
  if (currentUser && !currentUser.isAdmin) {
    setLocation("/");
    return null;
  }
  
  // Fetch suggestions
  const { data: suggestionsData, isLoading: isSuggestionsLoading } = useQuery<Suggestion[]>({
    queryKey: ['/api/suggestions'],
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Öneriler yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    }
  });
  
  // Fetch rewards
  const { data: allRewardsData, isLoading: isRewardsLoading } = useQuery<Record<number, Reward[]>>({
    queryKey: ['/api/rewards'],
    enabled: !!suggestionsData,
    queryFn: async () => {
      if (!suggestionsData) return {};
      
      // Get rewards for each approved or implemented suggestion
      const approvedSuggestions = suggestionsData.filter(s => 
        s.status === SUGGESTION_STATUSES.APPROVED || s.status === SUGGESTION_STATUSES.IMPLEMENTED
      );
      
      const rewardsMap: Record<number, Reward[]> = {};
      
      await Promise.all(
        approvedSuggestions.map(async (suggestion) => {
          try {
            const response = await fetch(`/api/rewards/suggestion/${suggestion.id}`, {
              credentials: "include"
            });
            
            if (response.ok) {
              const rewards = await response.json();
              rewardsMap[suggestion.id] = rewards;
            }
          } catch (error) {
            console.error("Error fetching rewards:", error);
          }
        })
      );
      
      return rewardsMap;
    }
  });
  
  // Fetch users
  const { data: usersData, isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Kullanıcılar yüklenirken bir hata oluştu",
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
  
  const getUserName = (userId: number) => {
    if (!usersData) return "Unknown";
    const user = usersData.find(u => u.id === userId);
    return user ? user.displayName : "Unknown";
  };
  
  const handleViewSuggestion = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setModalOpen(true);
  };
  
  const handleEvaluateSuggestion = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setModalOpen(true);
  };
  
  // Filter suggestions that need review (new or under review)
  const pendingSuggestions = suggestionsData
    ? suggestionsData
        .filter(s => s.status === SUGGESTION_STATUSES.NEW || s.status === SUGGESTION_STATUSES.REVIEW)
        .filter(s => {
          const matchesSearch = searchQuery === "" || 
            s.title.toLowerCase().includes(searchQuery.toLowerCase());
          
          const matchesStatus = statusFilter === "all" || s.status === statusFilter;
          
          return matchesSearch && matchesStatus;
        })
    : [];
  
  // Filter approved or implemented suggestions for rewards
  const approvedSuggestions = suggestionsData
    ? suggestionsData.filter(s => 
        s.status === SUGGESTION_STATUSES.APPROVED || s.status === SUGGESTION_STATUSES.IMPLEMENTED
      )
    : [];
  
  return (
    <div>
      <TabNavigation activeTab="admin" user={currentUser} />
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Yönetim Paneli</h2>
        <p className="text-neutral-700">Önerileri değerlendirin ve ödüllendirin</p>
      </div>
      
      {/* Pending Suggestions Table */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-neutral-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="text-lg font-bold text-neutral-900">Değerlendirme Bekleyen Öneriler</h3>
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
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-neutral-100">
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-900">Başlık</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-900">Gönderen</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-900">Kategori</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-900">Durum</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-900">Tarih</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-900">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {isSuggestionsLoading || isUsersLoading ? (
                // Skeleton loading state
                Array(3).fill(0).map((_, index) => (
                  <tr key={index} className="border-b border-neutral-200">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-12" /></td>
                  </tr>
                ))
              ) : pendingSuggestions.length > 0 ? (
                pendingSuggestions.map((suggestion) => (
                  <tr key={suggestion.id} className="border-b border-neutral-200">
                    <td className="px-4 py-3 text-sm text-neutral-900">{suggestion.title}</td>
                    <td className="px-4 py-3 text-sm text-neutral-900">{getUserName(suggestion.submittedBy)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-900">{suggestion.category}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusClass(suggestion.status)}`}>
                        {getStatusLabel(suggestion.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-900">{formatDate(suggestion.submittedAt)}</td>
                    <td className="px-4 py-3 flex space-x-2">
                      <button 
                        className="text-blue-500 hover:text-primary"
                        onClick={() => handleViewSuggestion(suggestion)}
                      >
                        <span className="material-icons">visibility</span>
                      </button>
                      <button 
                        className="text-yellow-500 hover:text-primary"
                        onClick={() => handleEvaluateSuggestion(suggestion)}
                      >
                        <span className="material-icons">rate_review</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-neutral-200">
                  <td colSpan={6} className="px-4 py-3 text-center text-sm text-neutral-700">
                    Değerlendirme bekleyen öneri bulunmamaktadır.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Reward Management */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-neutral-200">
          <h3 className="text-lg font-bold text-neutral-900">Ödül Yönetimi</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-neutral-100">
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-900">Öneri</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-900">Gönderen</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-900">Durum</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-900">Değerlendirme</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-900">Ödül</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-neutral-900">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {isSuggestionsLoading || isUsersLoading || isRewardsLoading ? (
                // Skeleton loading state
                Array(3).fill(0).map((_, index) => (
                  <tr key={index} className="border-b border-neutral-200">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-6 rounded-full" /></td>
                  </tr>
                ))
              ) : approvedSuggestions.length > 0 ? (
                approvedSuggestions.map((suggestion) => {
                  const rewards = allRewardsData?.[suggestion.id] || [];
                  const hasReward = rewards.length > 0;
                  const reward = hasReward ? rewards[0] : null;
                  
                  // Render stars based on rating
                  const renderStars = () => {
                    const rating = suggestion.rating || 0;
                    return (
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={`material-icons ${i < rating ? "text-yellow-500" : "text-neutral-300"}`}
                          >
                            star
                          </span>
                        ))}
                      </div>
                    );
                  };
                  
                  return (
                    <tr key={suggestion.id} className="border-b border-neutral-200">
                      <td className="px-4 py-3 text-sm text-neutral-900">{suggestion.title}</td>
                      <td className="px-4 py-3 text-sm text-neutral-900">{getUserName(suggestion.submittedBy)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusClass(suggestion.status)}`}>
                          {getStatusLabel(suggestion.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-900">
                        {renderStars()}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-900">
                        {hasReward ? `${reward?.amount} ${reward?.type === 'money' ? 'TL' : reward?.type === 'points' ? 'Puan' : 'Hediye'}` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <button 
                          className="text-green-500 hover:text-primary"
                          onClick={() => handleEvaluateSuggestion(suggestion)}
                          disabled={hasReward}
                          title={hasReward ? "Ödül zaten verilmiş" : "Ödül ver"}
                        >
                          <span className={`material-icons ${hasReward ? 'text-neutral-400' : ''}`}>
                            card_giftcard
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr className="border-b border-neutral-200">
                  <td colSpan={6} className="px-4 py-3 text-center text-sm text-neutral-700">
                    Ödüllendirilecek öneri bulunmamaktadır.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
