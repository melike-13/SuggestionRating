import TabNavigation from "@/components/TabNavigation";
import { useQuery } from "@tanstack/react-query";
import { Suggestion, User, SUGGESTION_STATUSES, Reward } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
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

  const { data: userData } = useQuery<{ user: User | null }>({
    queryKey: ["/api/auth/user"],
  });
  const currentUser = userData?.user || null;

  useEffect(() => {
    if (currentUser && !currentUser.isAdmin) {
      setLocation("/");
    }
  }, [currentUser, setLocation]);

  const { data: suggestionsData, isLoading: isSuggestionsLoading } = useQuery<Suggestion[]>({
    queryKey: ["/api/suggestions"],
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Öneriler yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    }
  });

  const { data: allRewardsData, isLoading: isRewardsLoading } = useQuery<Record<number, Reward[]>>({
    queryKey: ["/api/rewards"],
    enabled: !!suggestionsData,
    queryFn: async () => {
      if (!suggestionsData) return {};

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

  const { data: usersData, isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
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

  const approvedSuggestions = suggestionsData
    ? suggestionsData.filter(s =>
        s.status === SUGGESTION_STATUSES.APPROVED || s.status === SUGGESTION_STATUSES.IMPLEMENTED
      )
    : [];

  return (
    <div>
      <TabNavigation activeTab="admin" user={currentUser} />
      {/* ... (rest remains unchanged) */}
      <SuggestionDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        suggestion={selectedSuggestion}
        currentUser={currentUser}
      />
    </div>
  );
}
