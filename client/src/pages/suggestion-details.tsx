import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ChevronLeft, Tag, Calendar, User, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/utils/formatDate";
import { categoryLabels, Suggestion, User as UserType } from "@shared/schema";

export default function SuggestionDetails() {
  const { id } = useParams();
  const suggestionId = parseInt(id);
  
  const { data: suggestion, isLoading } = useQuery<Suggestion>({
    queryKey: [`/api/suggestions/${suggestionId}`],
    enabled: !isNaN(suggestionId),
  });
  
  const { data: allUsers } = useQuery<UserType[]>({
    queryKey: ["/api/users/top-contributors", 100],
  });
  
  const submitter = suggestion && allUsers
    ? allUsers.find(user => user.id === suggestion.userId)
    : null;
  
  const reviewer = suggestion?.reviewedBy && allUsers
    ? allUsers.find(user => user.id === suggestion.reviewedBy)
    : null;
  
  if (isNaN(suggestionId)) {
    return <div className="p-8 text-center">Geçersiz öneri ID'si</div>;
  }
  
  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/suggestions">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Geri Dön
            </Link>
          </Button>
        </div>
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/4 mb-8" />
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-6 w-1/2 mb-2" />
          <Skeleton className="h-6 w-1/3 mb-8" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }
  
  if (!suggestion) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/suggestions">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Geri Dön
            </Link>
          </Button>
        </div>
        <div className="max-w-3xl mx-auto text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Öneri bulunamadı</h3>
          <p className="mt-2 text-sm text-gray-500">
            Aradığınız öneri sistemde bulunamadı.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/suggestions">Tüm Önerilere Dön</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/suggestions">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Önerilere Dön
          </Link>
        </Button>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">{suggestion.title}</h1>
          <StatusBadge status={suggestion.status as any} className="px-3 py-1 text-sm" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="flex items-center text-sm text-slate-500">
            <Tag className="flex-shrink-0 mr-2 h-5 w-5 text-slate-400" />
            <span>Kategori: {categoryLabels[suggestion.category]}</span>
          </div>
          
          <div className="flex items-center text-sm text-slate-500">
            <Calendar className="flex-shrink-0 mr-2 h-5 w-5 text-slate-400" />
            <span>Tarih: {formatDate(suggestion.submittedAt)}</span>
          </div>
          
          <div className="flex items-center text-sm text-slate-500">
            <User className="flex-shrink-0 mr-2 h-5 w-5 text-slate-400" />
            <span>Öneren: {submitter?.fullName || 'Bilinmiyor'}</span>
          </div>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Öneri Detayları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-2">Açıklama</h3>
              <p className="text-slate-900 whitespace-pre-line">{suggestion.description}</p>
            </div>
            
            {suggestion.benefits && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Beklenen Faydalar</h3>
                <p className="text-slate-900 whitespace-pre-line">{suggestion.benefits}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {suggestion.reviewNotes && (
          <Card>
            <CardHeader>
              <CardTitle>Değerlendirme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-sm text-slate-500 mb-2">
                <Clock className="flex-shrink-0 mr-2 h-5 w-5 text-slate-400" />
                <span>Değerlendirme Tarihi: {formatDate(suggestion.reviewedAt)}</span>
              </div>
              
              {reviewer && (
                <div className="flex items-center text-sm text-slate-500 mb-4">
                  <User className="flex-shrink-0 mr-2 h-5 w-5 text-slate-400" />
                  <span>Değerlendiren: {reviewer.fullName}</span>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Değerlendirme Notları</h3>
                <p className="text-slate-900 whitespace-pre-line">{suggestion.reviewNotes}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
