// src/lib/services/oncrawl/client.ts
interface OnCrawlProject {
  id: string;
  name: string;
  url: string;
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
  description: string | null;
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
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`OnCrawl API error: ${response.status} ${response.statusText}`);
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

  async getAvailableFields(crawlId: string): Promise<string[]> {
    const response = await this.request<{ fields: Array<{ name: string }> }>(`/data/crawl/${crawlId}/pages/fields`);
    return response.fields.map(field => field.name);
  }

  async getPages(crawlId: string, fields: string[] = [], limit: number = 1000): Promise<OnCrawlPage[]> {
    const defaultFields = [
      'url', 'title', 'h1', 'h2', 'h3', 'description', 
      'status_code', 'inrank', 'nb_inlinks', 'content', 'word_count'
    ];
    
    const requestFields = fields.length > 0 ? fields : defaultFields;
    
    const response = await this.request<{ urls: OnCrawlPage[] }>(`/data/crawl/${crawlId}/pages/fields`, {
      method: 'POST',
      body: JSON.stringify({
        fields: requestFields,
        limit
      }),
    });

    return response.urls || [];
  }

  async getAllPages(crawlId: string): Promise<OnCrawlPage[]> {
    // OnCrawl supports large exports - we can get all pages
    return this.getPages(crawlId, [], 50000); // Adjust limit as needed
  }
}

export { OnCrawlClient, type OnCrawlProject, type OnCrawlCrawl, type OnCrawlPage };