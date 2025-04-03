import { useState } from "react";
import { Link } from "wouter";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCards } from "@/components/dashboard/StatCards";
import { SuggestionList } from "@/components/suggestions/SuggestionList";
import { ContributorList } from "@/components/contributors/ContributorList";
import { SuggestionForm } from "@/components/suggestions/SuggestionForm";

export default function Dashboard() {
  const [showNewSuggestionModal, setShowNewSuggestionModal] = useState(false);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Anasayfa</h2>
        <div className="mt-4 md:mt-0">
          <Button 
            onClick={() => setShowNewSuggestionModal(true)} 
            className="inline-flex items-center"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Yeni Öneri Ekle
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <StatCards />

      {/* Recent suggestions */}
      <SuggestionList
        queryKey="/api/suggestions/recent"
        limit={5}
        title="Son Öneriler"
        showViewAll={true}
      />

      {/* Top Contributors */}
      <ContributorList limit={3} />

      {/* New Suggestion Modal */}
      {showNewSuggestionModal && (
        <SuggestionForm 
          isModal={true} 
          onClose={() => setShowNewSuggestionModal(false)} 
        />
      )}
    </div>
  );
}
