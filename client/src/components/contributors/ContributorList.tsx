import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "@shared/schema";
import { Star } from "lucide-react";

interface ContributorListProps {
  limit?: number;
  title?: string;
}

export function ContributorList({
  limit = 5,
  title = "En Çok Katkı Sağlayanlar",
}: ContributorListProps) {
  const { data: contributors, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users/top-contributors"],
  });

  const { data: suggestions } = useQuery({
    queryKey: ["/api/suggestions"],
  });

  const getContributorSuggestionCount = (userId: number) => {
    if (!suggestions) return 0;
    return suggestions.filter((s: any) => s.userId === userId).length;
  };

  return (
    <div>
      <h3 className="text-lg font-medium leading-6 text-slate-900 mb-4">{title}</h3>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {isLoading ? (
          <LoadingSkeleton />
        ) : !contributors || contributors.length === 0 ? (
          <div className="p-6 text-center text-slate-500">Henüz katkı sağlayan bulunmuyor.</div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {contributors.slice(0, limit).map((contributor) => (
              <li key={contributor.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 bg-primary rounded-full flex items-center justify-center text-white text-xl font-semibold">
                    {contributor.fullName.charAt(0)}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-900">{contributor.fullName}</p>
                      <div className="ml-2 flex items-center text-sm text-slate-500">
                        <Star className="h-5 w-5 mr-1 text-yellow-500" />
                        <span>{contributor.points} puan</span>
                      </div>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <p className="text-sm text-slate-500">{contributor.department}</p>
                      <p className="text-sm text-slate-500">
                        {getContributorSuggestionCount(contributor.id)} öneri
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <ul className="divide-y divide-slate-200">
      {[...Array(3)].map((_, index) => (
        <li key={index} className="px-4 py-4 sm:px-6">
          <div className="flex items-center">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-24 ml-2" />
              </div>
              <div className="mt-1 flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
