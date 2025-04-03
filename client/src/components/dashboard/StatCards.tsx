import { useQuery } from "@tanstack/react-query";
import { Plus, Clock, CheckCircle, PlayCircle, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function StatCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/statistics"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="ml-5 w-0 flex-1">
                  <Skeleton className="h-5 w-24 mb-2" />
                  <Skeleton className="h-7 w-16" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Toplam Öneri",
      value: stats?.totalSuggestions || 0,
      icon: <Plus className="h-6 w-6 text-indigo-600" />,
      bgColor: "bg-indigo-100",
    },
    {
      title: "İnceleme Bekleyen",
      value: stats?.pendingReview || 0,
      icon: <Clock className="h-6 w-6 text-yellow-600" />,
      bgColor: "bg-yellow-100",
    },
    {
      title: "Onaylanan",
      value: stats?.approved || 0,
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      bgColor: "bg-green-100",
    },
    {
      title: "Dağıtılan Ödül",
      value: (stats?.totalRewards || 0).toLocaleString('tr-TR') + '₺',
      icon: <DollarSign className="h-6 w-6 text-rose-600" />,
      bgColor: "bg-rose-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {cards.map((card, index) => (
        <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-md p-3 ${card.bgColor}`}>
                {card.icon}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">{card.title}</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-slate-900">{card.value}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
