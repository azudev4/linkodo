// src/lib/services/oncrawl/client.ts
interface OnCrawlProject {
  id: string;
  name: string;
  url: string;
  workspace_id: string;
}

interface OnCrawlCrawl {
  id: string;
  project_id: string;
  name: string;
  status: string;
  created_at: string;
  url: string;
}

interface OnCrawlPage {
  url: string;
  title: string | null;
  h1: string | null;
  h2: string[] | null;
  h3: string[] | null;
  meta_description: string | null;
  status_code: number;
  inrank: number | null;
  nb_inlinks: number | null;
  content: string | null;
  word_count: number | null;
  last_crawled: string;
}

class OnCrawlClient {
  private baseUrl = 'https://app.oncrawl.com/api/v2';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const requestOptions = {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    };

    console.log('OnCrawl API request:', {
      url: `${this.baseUrl}${endpoint}`,
      method: options?.method || 'GET',
      headers: requestOptions.headers,
      body: options?.body ? JSON.parse(options.body as string) : undefined
    });

    const response = await fetch(`${this.baseUrl}${endpoint}`, requestOptions);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OnCrawl API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody
      });
      throw new Error(`OnCrawl API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    // Handle export responses differently (they return raw data)
    if (endpoint.includes('export=true')) {
      const rawData = await response.text();
      console.log('OnCrawl export response (first 500 chars):', rawData.substring(0, 500));
      console.log('OnCrawl export response length:', rawData.length);
      
      // OnCrawl export always returns CSV data (semicolon-delimited)
      const lines = rawData.trim().split('\n').filter(line => line.trim());
      console.log('Number of lines in response:', lines.length);
      
      if (lines.length === 0) {
        return [] as T;
      }
      
      // Parse CSV header
      const headerLine = lines[0];
      const headers = headerLine.split(';').map(h => h.replace(/"/g, '').trim());
      console.log('CSV headers:', headers);
      
      // Parse CSV data lines
      const jsonObjects = lines.slice(1).map((line, index) => {
        try {
          const values = line.split(';').map(v => {
            // Remove quotes and handle empty values
            const cleaned = v.replace(/"/g, '').trim();
            return cleaned === '' ? null : cleaned;
          });
          
          // Create object from headers and values
          const obj: any = {};
          headers.forEach((header, i) => {
            obj[header] = values[i];
          });
          
          return obj;
        } catch (parseError) {
          console.error(`Failed to parse CSV line ${index + 1}:`, line.substring(0, 100));
          throw parseError;
        }
      });
      
      console.log('Parsed', jsonObjects.length, 'objects from CSV');
      return jsonObjects as T;
    }

    return response.json();
  }

  async getProjects(): Promise<OnCrawlProject[]> {
    const response = await this.request<{ projects: OnCrawlProject[] }>('/projects');
    console.log('OnCrawl projects response:', JSON.stringify(response, null, 2));
    return response.projects;
  }

  async getAvailableFields(crawlId: string): Promise<string[]> {
    const response = await this.request<{ fields: Array<{ name: string }> }>(`/data/crawl/${crawlId}/pages/fields`);
    return response.fields.map(field => field.name);
  }

  async getPages(crawlId: string, fields: string[] = [], limit: number = 1000, offset: number = 0): Promise<OnCrawlPage[]> {
    const defaultFields = [
      'url', 'title', 'h1', 'h2', 'h3', 'meta_description',
      'status_code', 'inrank', 'nb_inlinks', 'content', 'word_count'
    ];
    
    const requestFields = fields.length > 0 ? fields : defaultFields;
    
    const response = await this.request<{ urls: OnCrawlPage[] }>(`/data/crawl/${crawlId}/pages`, {
      method: 'POST',
      body: JSON.stringify({
        fields: requestFields,
        limit: Math.min(limit, 1000), // Ensure we don't exceed API limit
        offset
      }),
    });

    return response.urls || [];
  }

  async getAllPages(crawlId: string): Promise<OnCrawlPage[]> {
    // Use OnCrawl's Export API to bypass the 10k limit
    console.log('Using OnCrawl Export API to fetch all pages (no 10k limit)');
    
    // Get available fields first
    const availableFields = await this.getAvailableFields(crawlId);
    const desiredFields = [
      'url', 'title', 'h1', 'h2', 'h3', 
      'status_code', 'inrank', 'nb_inlinks', 'content', 'word_count'
    ];
    
    // Use only fields that are actually available
    const validFields = desiredFields.filter(field => availableFields.includes(field));
    
    // OnCrawl export returns JSONL (JSON Lines) format
    const jsonlData = await this.request<OnCrawlPage[]>(`/data/crawl/${crawlId}/pages?export=true`, {
      method: 'POST',
      body: JSON.stringify({
        fields: validFields,
        oql: { field: ["depth", "has_value", ""] }
      }),
    });

    console.log(`Successfully exported ${jsonlData.length} pages from OnCrawl (no limit)`);
    return jsonlData;
  }

  async exportAllPagesAsCSV(crawlId: string): Promise<string> {
    // Alternative method to get CSV export URL
    const availableFields = await this.getAvailableFields(crawlId);
    const desiredFields = [
      'url', 'title', 'h1', 'h2', 'h3', 
      'status_code', 'inrank', 'nb_inlinks', 'content', 'word_count'
    ];
    
    const validFields = desiredFields.filter(field => availableFields.includes(field));
    
    // This returns a CSV string directly
    const csvData = await this.request<string>(`/data/crawl/${crawlId}/pages?export=true&file_type=csv`, {
      method: 'POST',
      body: JSON.stringify({
        fields: validFields,
        oql: {
          field: ["fetched", "equals", true]
        }
      }),
    });

    return csvData;
  }
}

export { OnCrawlClient, type OnCrawlProject, type OnCrawlCrawl, type OnCrawlPage };