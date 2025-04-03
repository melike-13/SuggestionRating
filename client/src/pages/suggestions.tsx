import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SuggestionList } from "@/components/suggestions/SuggestionList";
import { SuggestionForm } from "@/components/suggestions/SuggestionForm";

export default function Suggestions() {
  const [showNewSuggestionModal, setShowNewSuggestionModal] = useState(false);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Tüm Öneriler</h2>
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

      {/* All suggestions */}
      <SuggestionList
        queryKey="/api/suggestions"
        title="Öneriler"
        emptyMessage="Henüz kaydedilmiş öneri bulunmuyor. Yeni bir öneri ekleyin!"
      />

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
