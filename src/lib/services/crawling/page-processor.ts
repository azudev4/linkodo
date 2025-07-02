import { supabase } from '@/lib/db/client';

export interface ProcessedPage {
  url: string;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  h2Tags: string[];
  h3Tags: string[];
  primaryKeywords: string[];
  wordCount: number;
  contentSnippet: string | null;
}

/**
 * Clean Firecrawl markdown content by removing navigation and header junk
 */
function cleanFirecrawlContent(markdown: string): string {
  const firstHeading = markdown.indexOf('\n# ');
  if (firstHeading > 0) {
    return markdown.substring(firstHeading);
  }
  return markdown;
}

/**
 * Extract headings from cleaned markdown content
 */
function extractHeadings(markdown: string) {
  const h1Match = markdown.match(/^# (.+)$/m);
  const h2Matches = markdown.match(/^## (.+)$/gm) || [];
  const h3Matches = markdown.match(/^### (.+)$/gm) || [];

  return {
    h1: h1Match?.[1] || null,
    h2Tags: h2Matches.map(h => h.replace('## ', '')),
    h3Tags: h3Matches.map(h => h.replace('### ', ''))
  };
}

/**
 * Extract primary keywords using frequency analysis
 */
function extractPrimaryKeywords(markdown: string): string[] {
  const cleanText = markdown
    .replace(/#{1,6}\s/g, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/[^\w\sàâäéèêëïîôùûüÿç]/gi, ' ')
    .toLowerCase();

  const words = cleanText
    .split(/\s+/)
    .filter(word => word.length > 3);

  const stopWords = new Set([
    'dans', 'avec', 'pour', 'plus', 'tout', 'tous', 'toute', 'toutes',
    'cette', 'cette', 'ces', 'son', 'ses', 'leur', 'leurs', 'notre',
    'nos', 'votre', 'vos', 'mon', 'mes', 'ton', 'tes', 'que', 'qui',
    'quoi', 'dont', 'où', 'quand', 'comment', 'pourquoi', 'parce',
    'car', 'donc', 'mais', 'ou', 'et', 'ni', 'or', 'puis', 'alors',
    'ainsi', 'aussi', 'encore', 'déjà', 'jamais', 'toujours', 'souvent',
    'parfois', 'très', 'trop', 'assez', 'bien', 'mal', 'mieux', 'moins',
    'beaucoup', 'peu', 'tant', 'autant', 'comme', 'si', 'sinon',
    'peut', 'peuvent', 'doit', 'doivent', 'avoir', 'être', 'faire',
    'dire', 'aller', 'voir', 'savoir', 'vouloir', 'venir', 'falloir'
  ]);

  const filteredWords = words.filter(word => !stopWords.has(word));

  const wordFreq = filteredWords.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 15)
    .map(([word]) => word);
}

/**
 * Extract content snippet between H1 and first H2
 */
function extractContentSnippet(markdown: string, h1: string | null): string | null {
  // Strategy 1: Extract between H1 and first H2 (most common blog structure)
  if (h1) {
    const h1Pattern = new RegExp(`^# ${h1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm');
    const h1Match = markdown.match(h1Pattern);
    
    if (h1Match) {
      const afterH1 = markdown.substring(h1Match.index! + h1Match[0].length);
      const h2Match = afterH1.match(/^## .+$/m);
      
      const contentSection = h2Match 
        ? afterH1.substring(0, h2Match.index!) 
        : afterH1.substring(0, 500); // Fallback limit
      
      return cleanAndTruncateContent(contentSection);
    }
  }
  
  // Fallback: First substantial paragraph
  const paragraphs = markdown.split('\n\n');
  for (const paragraph of paragraphs) {
    const cleaned = paragraph.replace(/^#+\s/, '').trim();
    if (cleaned.length > 50 && !cleaned.startsWith('#')) {
      return cleanAndTruncateContent(cleaned);
    }
  }
  
  return null;
}

function cleanAndTruncateContent(content: string): string {
  const cleaned = content
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert links to text
    .replace(/[*_`]/g, '') // Remove formatting
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();
  
  // Truncate to ~200 chars at word boundary
  if (cleaned.length <= 200) return cleaned;
  
  const truncated = cleaned.substring(0, 200);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 150 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

/**
 * Process a single page from Firecrawl data (no AI dependencies)
 */
export async function processPage(firecrawlData: any): Promise<ProcessedPage> {
  const { markdown, metadata } = firecrawlData;
  
  const cleanedMarkdown = cleanFirecrawlContent(markdown);
  const headings = extractHeadings(cleanedMarkdown);
  
  const primaryKeywords = extractPrimaryKeywords(cleanedMarkdown);
  const contentSnippet = extractContentSnippet(cleanedMarkdown, headings.h1);
  
  const wordCount = cleanedMarkdown.split(/\s+/).filter(word => word.length > 0).length;

  return {
    url: metadata.sourceURL || metadata.url,
    title: metadata.title || null,
    metaDescription: metadata.description || null,
    h1: headings.h1,
    h2Tags: headings.h2Tags,
    h3Tags: headings.h3Tags,
    primaryKeywords,
    wordCount,
    contentSnippet
  };
}

/**
 * Store processed page in database (no embedding initially)
 */
export async function storePage(page: ProcessedPage): Promise<void> {
  const { error } = await supabase
    .from('pages')
    .upsert({
      url: page.url,
      title: page.title,
      meta_description: page.metaDescription,
      h1: page.h1,
      h2_tags: page.h2Tags,
      h3_tags: page.h3Tags,
      primary_keywords: page.primaryKeywords,
      semantic_keywords: null, // Not using semantic keywords anymore
      word_count: page.wordCount,
      content_snippet: page.contentSnippet,
      embedding: null, // Will be generated later in batch
      last_crawled: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'url'
    });

  if (error) {
    throw new Error(`Failed to store page: ${error.message}`);
  }
} 