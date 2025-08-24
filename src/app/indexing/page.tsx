// src/app/indexing/page.tsx
import { IndexingManager } from "@/components/dashboard/indexing/IndexingManager";

export default function IndexingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Data Indexing</h1>
        <p className="text-gray-600 mt-1">
          Manage your website data indexing, custom crawl setup, and AI embeddings
        </p>
      </div>
      
      <IndexingManager />
    </div>
  );
}