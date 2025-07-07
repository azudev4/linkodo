// src/app/api/test-embeddings/route.ts
import { NextResponse } from 'next/server';
import { checkEmbeddingCompatibility } from '@/lib/services/embeding/embedding-matcher';

interface EmbeddingStatus {
  isReady: boolean;
  totalPages: number;
  pagesWithEmbeddings: number;
  pagesNeedingEmbeddings: number;
  completionPercentage: number;
  issues: string[];
  recommendations: string[];
}

export async function GET() {
  try {
    console.log('🧪 Testing embedding system compatibility...');
    
    const compatibility = await checkEmbeddingCompatibility();
    
    const status: EmbeddingStatus = {
      isReady: compatibility.pagesWithEmbeddings > 0,
      totalPages: compatibility.totalPages,
      pagesWithEmbeddings: compatibility.pagesWithEmbeddings,
      pagesNeedingEmbeddings: compatibility.totalPages - compatibility.pagesWithEmbeddings,
      completionPercentage: compatibility.totalPages > 0 
        ? Math.round((compatibility.pagesWithEmbeddings / compatibility.totalPages) * 100)
        : 0,
      issues: compatibility.compatibilityIssues,
      recommendations: []
    };

    // Add recommendations based on status
    if (status.pagesWithEmbeddings === 0) {
      status.recommendations.push('No embeddings found. Run the embedding generation process first.');
    } else if (status.completionPercentage < 100) {
      status.recommendations.push(`${status.pagesNeedingEmbeddings} pages still need embeddings. Consider running the embedding generation process.`);
    }
    
    if (status.issues.length > 0) {
      status.recommendations.push('Some embedding compatibility issues detected. Check the issues array for details.');
    }
    
    if (status.isReady) {
      status.recommendations.push('System is ready for link suggestions!');
    }

    console.log(`✅ Embedding test completed:
      📊 ${status.pagesWithEmbeddings}/${status.totalPages} pages with embeddings (${status.completionPercentage}%)
      🚦 Ready: ${status.isReady}
      ⚠️  Issues: ${status.issues.length}
    `);

    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Embedding test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Embedding test failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}