// src/lib/services/oncrawl/client.ts

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
    // Clean up quotes and whitespace
    const cleaned = value.replace(/^"(.*)"$/, '$1').trim();
    return cleaned === '' ? null : cleaned;
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
  created_at: string;
  url: string;
  state?: string;
}

// Updated interface to match OnCrawl API field names (semicolon-delimited)
interface OnCrawlPage {
  // Core content
  url: string;
  title: string | null;
  h1: string | null;
  meta_description: string | null;
  
  // Technical
  status_code: string | null;
  word_count: string | null;
  
  // SEO & Linking metrics
  depth: string | null;                 // Page depth (clicks from start)
  inrank: string | null;                // Internal PageRank (0-10)
  nb_outlinks: string | null;           // Number of internal links from this page
  nb_inlinks: string | null;            // Number of incoming internal links
}

class OnCrawlClient {
  private baseUrl = 'https://app.oncrawl.com/api/v2';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
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
      
      console.log('🔍 DEBUG: Raw CSV first line (headers):', lines[0]);
      if (lines.length > 1) {
        console.log('🔍 DEBUG: Raw CSV second line (data):', lines[1]);
      }
      
      // OnCrawl API uses semicolon delimiter, not comma
      const headers = parseCSVLine(lines[0], ';');
      const jsonObjects = lines.slice(1).map(line => {
        const values = parseCSVLine(line, ';');
        const obj: any = {};
        headers.forEach((header, i) => {
          if (header !== null) {
            obj[header] = values[i];
          }
        });
        return obj;
      });
      
      console.log('🔍 DEBUG: Parsed headers:', headers);
      if (jsonObjects.length > 0) {
        console.log('🔍 DEBUG: First parsed object:', JSON.stringify(jsonObjects[0], null, 2));
      }
      
      return jsonObjects as T;
    }

    return response.json();
  }

  async getProjects(): Promise<OnCrawlProject[]> {
    const response = await this.request<{ projects: OnCrawlProject[] }>('/projects');
    return response.projects;
  }

  async getCrawls(projectId: string): Promise<OnCrawlCrawl[]> {
    const response = await this.request<{ crawls: OnCrawlCrawl[] }>(`/projects/${projectId}/crawls`);
    return response.crawls;
  }

  async isCrawlAccessible(crawlId: string): Promise<boolean> {
    try {
      await this.request<{ fields: Array<{ name: string }> }>(`/data/crawl/${crawlId}/pages/fields`);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('must be live')) {
        return false;
      }
      throw error;
    }
  }

  async getAllPages(crawlId: string): Promise<OnCrawlPage[]> {
    const isAccessible = await this.isCrawlAccessible(crawlId);
    if (!isAccessible) {
      throw new Error(`Crawl ${crawlId} is not accessible. The crawl must be in a 'live' state to access its data.`);
    }

    // Get available fields
    const fieldsResponse = await this.request<{ fields: Array<{ name: string }> }>(`/data/crawl/${crawlId}/pages/fields`);
    const availableFields = fieldsResponse.fields.map(field => field.name);
    
    console.log('🔍 DEBUG: Available fields from OnCrawl:', availableFields);
    
    // Essential fields for internal linking
    const fieldMapping: { [key: string]: string } = {
      // Core content (for embeddings)
      'url': 'url',
      'title': 'title', 
      'h1': 'h1',
      'meta_description': 'meta_description',
      
      // Technical info
      'status_code': 'status_code',
      'word_count': 'word_count',
      'language': 'language',
      
      // SEO & Internal linking metrics
      'depth': 'depth',                           // How deep in site structure
      'inrank': 'inrank',                         // Internal PageRank authority
      'nb_outlinks': 'nb_outlinks',               // Links this page sends
      'nb_inlinks': 'nb_inlinks'                  // Links this page receives
    };
    
    const desiredFields = Object.keys(fieldMapping).filter(field => 
      availableFields.includes(field)
    );
    
    console.log('🔍 DEBUG: Desired fields we are requesting:', desiredFields);
    
    const pages = await this.request<OnCrawlPage[]>(`/data/crawl/${crawlId}/pages?export=true`, {
      method: 'POST',
      body: JSON.stringify({
        fields: desiredFields,
        oql: { field: ["depth", "has_value", ""] }
      }),
    });

    console.log('🔍 DEBUG: Number of pages returned:', pages.length);
    if (pages.length > 0) {
      console.log('🔍 DEBUG: First page object:', JSON.stringify(pages[0], null, 2));
    }

    return pages;
  }
}

export { OnCrawlClient, type OnCrawlProject, type OnCrawlCrawl, type OnCrawlPage };