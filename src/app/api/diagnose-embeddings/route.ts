// src/app/api/diagnose-embeddings/route.ts
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

interface PageDiagnostic {
  id: string;
  url: string;
  title: string | null;
  h1: string | null;
  meta_description: string | null;
  hasTitle: boolean;
  hasH1: boolean;
  hasMetaDescription: boolean;
  hasAnyContent: boolean;
  combinedLength: number;
}

export async function GET() {
  try {
    console.log('🔍 Diagnosing remaining pages without embeddings...');

    const supabase = createServiceRoleClient();

    // Get ALL pages without embeddings
    const { data: pages, error } = await supabase
      .from('pages')
      .select('id, url, title, h1, meta_description, embedding')
      .is('embedding', null);
    
    if (error) {
      throw new Error(`Failed to fetch pages: ${error.message}`);
    }
    
    if (!pages || pages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pages without embeddings found!',
        total: 0,
        unembeddable: 0,
        embeddable: 0,
        examples: []
      });
    }
    
    // Analyze each page
    const diagnostics: PageDiagnostic[] = pages.map(page => {
      const hasTitle = !!(page.title && page.title.trim());
      const hasH1 = !!(page.h1 && page.h1.trim());
      const hasMetaDescription = !!(page.meta_description && page.meta_description.trim());
      
      const combinedText = [page.title, page.h1, page.meta_description]
        .filter(Boolean)
        .join(' ')
        .trim();
      
      return {
        id: page.id,
        url: page.url,
        title: page.title,
        h1: page.h1,
        meta_description: page.meta_description,
        hasTitle,
        hasH1,
        hasMetaDescription,
        hasAnyContent: combinedText.length > 0,
        combinedLength: combinedText.length
      };
    });
    
    // Separate embeddable vs unembeddable
    const unembeddable = diagnostics.filter(d => !d.hasAnyContent);
    const embeddable = diagnostics.filter(d => d.hasAnyContent);
    
    // Statistics
    const stats = {
      total: diagnostics.length,
      unembeddable: unembeddable.length,
      embeddable: embeddable.length,
      
      // Content statistics
      onlyTitle: diagnostics.filter(d => d.hasTitle && !d.hasH1 && !d.hasMetaDescription).length,
      onlyH1: diagnostics.filter(d => !d.hasTitle && d.hasH1 && !d.hasMetaDescription).length,
      onlyMeta: diagnostics.filter(d => !d.hasTitle && !d.hasH1 && d.hasMetaDescription).length,
      multipleFields: diagnostics.filter(d => [d.hasTitle, d.hasH1, d.hasMetaDescription].filter(Boolean).length > 1).length,
      
      // Length statistics
      avgLength: embeddable.length > 0 ? Math.round(embeddable.reduce((sum, d) => sum + d.combinedLength, 0) / embeddable.length) : 0,
      minLength: embeddable.length > 0 ? Math.min(...embeddable.map(d => d.combinedLength)) : 0,
      maxLength: embeddable.length > 0 ? Math.max(...embeddable.map(d => d.combinedLength)) : 0,
    };
    
    // Examples of problematic pages
    const examples = {
      unembeddable: unembeddable.slice(0, 10).map(d => ({
        id: d.id,
        url: d.url.substring(0, 80) + (d.url.length > 80 ? '...' : ''),
        title: d.title,
        h1: d.h1,
        meta_description: d.meta_description
      })),
      
      // Very short content that might be problematic
      shortContent: embeddable
        .filter(d => d.combinedLength < 10)
        .slice(0, 5)
        .map(d => ({
          id: d.id,
          url: d.url.substring(0, 60) + '...',
          combinedLength: d.combinedLength,
          content: [d.title, d.h1, d.meta_description].filter(Boolean).join(' ').substring(0, 100)
        }))
    };
    
    console.log(`📊 Diagnosis complete:
      Total: ${stats.total}
      Unembeddable: ${stats.unembeddable} (${Math.round(stats.unembeddable/stats.total*100)}%)
      Embeddable: ${stats.embeddable} (${Math.round(stats.embeddable/stats.total*100)}%)
    `);
    
    return NextResponse.json({
      success: true,
      message: `Diagnosed ${stats.total} pages without embeddings`,
      stats,
      examples,
      recommendations: [
        stats.unembeddable > 0 ? `${stats.unembeddable} pages have no content and should be marked as unembeddable` : null,
        stats.embeddable > 0 ? `${stats.embeddable} pages can be processed` : null,
        examples.shortContent.length > 0 ? `${examples.shortContent.length} pages have very short content (<10 chars)` : null
      ].filter(Boolean)
    });
    
  } catch (error: unknown) {
    console.error('❌ Diagnosis failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to diagnose embedding issues',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}