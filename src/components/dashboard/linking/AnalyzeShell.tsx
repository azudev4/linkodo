// src/components/linking/AnalyzeShell.tsx
import { TextAnalyzer } from './interface/TextAnalyzer';

export function AnalyzeShell() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Interactive Link Analysis
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed">
          Paste your SEO content and discover internal linking opportunities by selecting text and finding relevant pages from your database
        </p>
      </div>
      
      <TextAnalyzer />
    </div>
  );
}