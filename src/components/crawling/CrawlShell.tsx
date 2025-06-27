import { CrawlManager } from './interface/CrawlManager';

export function CrawlShell() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Site Crawling</h1>
        <p className="text-gray-600 mt-1">
          Index your website pages for internal link suggestions
        </p>
      </div>
      
      <CrawlManager />
    </div>
  );
}