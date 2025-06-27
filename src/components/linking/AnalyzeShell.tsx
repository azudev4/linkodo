import { TextAnalyzer } from './interface/TextAnalyzer';
import { SuggestionsList } from './interface/SuggestionsList';

export function AnalyzeShell() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Analyze Content</h1>
        <p className="text-gray-600 mt-1">
          Paste your SEO content below to get internal link suggestions
        </p>
      </div>
      
      <div className="space-y-8">
        <TextAnalyzer />
        <SuggestionsList />
      </div>
    </div>
  );
}