import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Tag, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/utils/formatDate";
import { Suggestion } from "@shared/schema";
import { categoryLabels } from "@shared/schema";

interface SuggestionListProps {
  queryKey: string;
  limit?: number;
  title?: string;
  showViewAll?: boolean;
  emptyMessage?: string;
}

export function SuggestionList({
  queryKey,
  limit = 0,
  title = "Öneriler",
  showViewAll = false,
  emptyMessage = "Henüz öneri bulunmuyor."
}: SuggestionListProps) {
  const { data: suggestions, isLoading } = useQuery<Suggestion[]>({
    queryKey: [queryKey],
  });

  const displaySuggestions = limit > 0 && suggestions 
    ? suggestions.slice(0, limit) 
    : suggestions;

  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium leading-6 text-slate-900 mb-4">{title}</h3>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {isLoading ? (
          <LoadingSkeleton />
        ) : !displaySuggestions || displaySuggestions.length === 0 ? (
          <div className="p-6 text-center text-slate-500">{emptyMessage}</div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {displaySuggestions.map((suggestion) => (
              <SuggestionListItem key={suggestion.id} suggestion={suggestion} />
            ))}
          </ul>
        )}
      </div>
      
      {showViewAll && suggestions && suggestions.length > 0 && (
        <div className="mt-4 text-right">
          <Link href="/suggestions">
            <a className="text-sm font-medium text-primary hover:text-primary/80">
              Tüm önerileri görüntüle <span aria-hidden="true">→</span>
            </a>
          </Link>
        </div>
      )}
    </div>
  );
}

function SuggestionListItem({ suggestion }: { suggestion: Suggestion }) {
  return (
    <li>
      <Link href={`/suggestions/${suggestion.id}`}>
        <a className="block hover:bg-slate-50">
          <div className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-primary truncate">
                {suggestion.title}
              </div>
              <div className="ml-2 flex-shrink-0 flex">
                <StatusBadge status={suggestion.status as any} />
              </div>
            </div>
            <div className="mt-2 sm:flex sm:justify-between">
              <div className="sm:flex">
                <div className="flex items-center text-sm text-slate-500">
                  <Tag className="flex-shrink-0 mr-1.5 h-5 w-5 text-slate-400" />
                  <span>{categoryLabels[suggestion.category]}</span>
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm text-slate-500 sm:mt-0">
                <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-slate-400" />
                <span>
                  <time dateTime={suggestion.submittedAt?.toString()}>
                    {formatDate(suggestion.submittedAt)}
                  </time>
                </span>
              </div>
            </div>
          </div>
        </a>
      </Link>
    </li>
  );
}

function LoadingSkeleton() {
  return (
    <ul className="divide-y divide-slate-200">
      {[...Array(3)].map((_, index) => (
        <li key={index} className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-5 w-24 ml-2" />
          </div>
          <div className="mt-2 sm:flex sm:justify-between">
            <Skeleton className="h-5 w-32 mt-2" />
            <Skeleton className="h-5 w-40 mt-2" />
          </div>
        </li>
      ))}
    </ul>
  );
}
