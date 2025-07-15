// src/lib/services/oncrawl/client.ts
import { decodeHtmlEntities } from '@/lib/utils/html-entities';
import { OnCrawlPage } from './types';

/**
 * Properly parses a CSV line respecting quoted fields
 */
function parseCSVLine(line: string, delimiter: string = ','): (string | null)[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result.map(value => {
    // Clean up quotes and whitespace, then decode HTML entities
    const cleaned = value.replace(/^"(.*)"$/, '$1').trim();
    const decoded = decodeHtmlEntities(cleaned);
    return decoded === '' ? null : decoded;
  });
}

interface OnCrawlProject {
  id: string;
  name: string;
  url: string;
  workspace_id: string;
  last_crawl_id?: string;
}

interface OnCrawlCrawl {
  id: string;
  project_id: string;
  name: string;
  status: string;
  state?: string;       // "live" for accessible crawls (newer API)
  link_status?: string; // "live" for accessible crawls (older API)
  created_at: string;
  url?: string;
}

interface CrawlData {
  crawl: OnCrawlCrawl;
  pages: OnCrawlPage[];
}

class OnCrawlClient {
  private apiToken: string;
  private baseUrl = 'https://app.oncrawl.com/api/v2';

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OnCrawl API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    // Handle export responses (CSV format)
    if (endpoint.includes('export=true')) {
      const rawData = await response.text();
      const lines = rawData.trim().split('\n').filter(line => line.trim());
      
      if (lines.length === 0) return [] as T;
      
      // OnCrawl API uses semicolon delimiter, not comma
      const headers = parseCSVLine(lines[0], ';');
      const jsonObjects = lines.slice(1).map(line => {
        const values = parseCSVLine(line, ';');
        const obj: Record<string, string> = {};
        headers.forEach((header, i) => {
          if (header !== null && values[i] !== null) {
            obj[header] = values[i] as string;
          }
        });
        return obj;
      });
      
      return jsonObjects as T;
    }

    return response.json();
  }

  async getProjects(): Promise<OnCrawlProject[]> {
    const response = await this.request<{ projects: OnCrawlProject[] }>('/projects');
    return response.projects;
  }

  private async getAllPages(crawlId: string): Promise<OnCrawlPage[]> {
    // Essential fields for internal linking - hardcoded to avoid extra API call
    const essentialFields = [
      'url',
      'title', 
      'h1',
      'meta_description',
      'status_code',
      'word_count',
      'depth',
      'inrank_decimal',
      'internal_outlinks',
      'nb_inlinks'
    ];
    
    // Fetch pages with minimal processing
    const pages = await this.request<OnCrawlPage[]>(`/data/crawl/${crawlId}/pages?export=true`, {
      method: 'POST',
      body: JSON.stringify({
        fields: essentialFields,
        oql: { field: ["depth", "has_value", ""] }
      }),
    });

    return pages;
  }

  /**
   * Get the latest accessible crawl and its pages for a project
   * Uses the correct OnCrawl API pattern with nested resources
   */
  async getLatestAccessibleCrawlData(projectId: string): Promise<CrawlData> {
    // Get project with embedded crawls using the correct API pattern
    const projectWithCrawls = await this.request<{
      project: OnCrawlProject;
      crawls: OnCrawlCrawl[];
    }>(`/projects/${projectId}?include_nested_resources=true&sort=created_at:desc`);
    
    const { project, crawls } = projectWithCrawls;
    
    if (!crawls || crawls.length === 0) {
      throw new Error(`No crawls found for project "${project.name}"`);
    }
    
    console.log(`Found ${crawls.length} total crawls for project "${project.name}"`);
    
    // Filter for completed and live (accessible) crawls
    // Check both state and link_status fields for compatibility
    const accessibleCrawls = crawls.filter(crawl => 
      crawl.status === 'done' && 
      (crawl.state === 'live' || crawl.link_status === 'live')
    );
    
    console.log(`Found ${accessibleCrawls.length} accessible crawls (status="done" and state/link_status="live")`);
    
    if (accessibleCrawls.length === 0) {
      // Debug info about what crawls are available
      const crawlStatuses = crawls.map(c => `${c.name}: status="${c.status}", state="${c.state}", link_status="${c.link_status}"`).join('; ');
      throw new Error(`No accessible crawls found for project "${project.name}". Available crawls: ${crawlStatuses}. Crawls must have status="done" and state="live" (or link_status="live"). Please go to OnCrawl and set a crawl to "live" status.`);
    }
    
    // Use the first (newest) accessible crawl since they're already sorted by created_at:desc
    const crawl = accessibleCrawls[0];
    
    console.log(`Using latest accessible crawl: ${crawl.id} (${crawl.name || 'Unnamed crawl'}) for project "${project.name}"`);
    
    const pages = await this.getAllPages(crawl.id);
    
    return { crawl, pages };
  }
}

export { OnCrawlClient, type OnCrawlProject, type OnCrawlCrawl, type CrawlData };