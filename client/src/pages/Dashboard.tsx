// Dashboard.tsx
import { useQuery } from "@tanstack/react-query";
import TabNavigation from "@/components/TabNavigation";
import StatCard from "@/components/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Suggestion, SUGGESTION_STATUSES, User } from "@shared/schema";
import { format } from "date-fns";
import { useState } from "react";
import SuggestionDetailModal from "@/components/SuggestionDetailModal";

export default function Dashboard() {
  const { toast } = useToast();
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: userData } = useQuery<{ user: User | null }>({
    queryKey: ['/api/auth/user'],
  });

  const currentUser = userData?.user || null;

  const { data: statsData, isLoading: isStatsLoading } = useQuery<{
    total: number;
    byStatus: Record<string, number>;
  }>({
    queryKey: ['/api/stats/suggestions'],
  });

  const { data: suggestionsData, isLoading: isSuggestionsLoading } = useQuery<Suggestion[]>({
    queryKey: ['/api/suggestions'],
  });

  const { data: contributorsData, isLoading: isContributorsLoading } = useQuery<{
    user: User | null;
    count: number;
  }[]>({
    queryKey: ['/api/stats/top-contributors'],
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

  const recentSuggestions = suggestionsData
    ? [...suggestionsData]
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        .slice(0, 5)
    : [];

  return (
    <div className="mb-8">
      <TabNavigation activeTab="dashboard" user={currentUser} />

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Dashboard</h2>
        <p className="text-neutral-700">Kaizen iyileştirme önerileri sistemi genel bakış</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isStatsLoading ? (
          Array(4).fill(0).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="w-full">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-12" />
                </div>
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </div>
          ))
        ) : (
          <>
            <StatCard title="Toplam Öneri" value={statsData?.total || 0} icon="lightbulb" />
            <StatCard title="İnceleme Altında" value={statsData?.byStatus?.[SUGGESTION_STATUSES.REVIEW] || 0} icon="hourglass_top" iconColor="text-yellow-500" />
            <StatCard title="Onaylanan" value={statsData?.byStatus?.[SUGGESTION_STATUSES.APPROVED] || 0} icon="check_circle" iconColor="text-green-500" />
            <StatCard title="Uygulanan" value={statsData?.byStatus?.[SUGGESTION_STATUSES.IMPLEMENTED] || 0} icon="rocket_launch" iconColor="text-primary" />
          </>
        )}
      </div>

      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-neutral-200">
          <h3 className="text-lg font-bold text-neutral-900">Son Öneriler</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-neutral-100">
                  <th className="px-4 py-2 text-left text-sm font-medium text-neutral-900">Başlık</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-neutral-900">Kategori</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-neutral-900">Durum</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-neutral-900">Tarih</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-neutral-900"></th>
                </tr>
              </thead>
              <tbody>
                {isSuggestionsLoading ? (
                  Array(3).fill(0).map((_, index) => (
                    <tr key={index} className="border-b border-neutral-200">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-6 w-6 rounded-full" /></td>
                    </tr>
                  ))
                ) : recentSuggestions.length > 0 ? (
                  recentSuggestions.map((suggestion) => (
                    <tr key={suggestion.id} className="border-b border-neutral-200">
                      <td className="px-4 py-3 text-sm text-neutral-900">{suggestion.title}</td>
                      <td className="px-4 py-3 text-sm text-neutral-900">{suggestion.category}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusClass(suggestion.status)}`}>
                          {getStatusLabel(suggestion.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-900">{formatDate(suggestion.submittedAt)}</td>
                      <td className="px-4 py-3">
                        <button className="text-blue-500 hover:text-primary" onClick={() => handleViewSuggestion(suggestion)}>
                          <span className="material-icons">visibility</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-b border-neutral-200">
                    <td colSpan={5} className="px-4 py-3 text-center text-sm text-neutral-700">Henüz öneri bulunmamaktadır.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-neutral-200">
          <h3 className="text-lg font-bold text-neutral-900">En Aktif Katkı Sağlayanlar</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isContributorsLoading ? (
              Array(4).fill(0).map((_, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))
            ) : contributorsData && contributorsData.length > 0 ? (
              contributorsData.map((contributor, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <span className="material-icons text-primary text-xl">account_circle</span>
                  <div>
                    <p className="font-medium text-neutral-900">{contributor.user?.displayName || "Unknown"}</p>
                    <p className="text-sm text-neutral-700">{contributor.count} Öneri</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-sm text-neutral-700">
                Henüz katkı sağlayan kullanıcı bulunmamaktadır.
              </div>
            )}
          </div>
        </div>
      </div>

      <SuggestionDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        suggestion={selectedSuggestion}
        currentUser={currentUser}
      />
    </div>
  );
}
