// src/app/api/embeddings/route.ts (or fix your existing embeding/route.ts typo)
import { NextResponse } from 'next/server';
import { generateEmbeddingsOptimized } from '@/lib/services/embeding/embeddings';

export async function POST() {
  try {
    console.log('Starting optimized embedding generation...');
    
    const result = await generateEmbeddingsOptimized();
    
    return NextResponse.json({
      success: true,
      ...result,
      message: `Generated embeddings for ${result.processed} pages`
    });
    
  } catch (error) {
    console.error('Embedding generation error:', error);
    return NextResponse.json(
      { error: 'Embedding generation failed' },
      { status: 500 }
    );
  }
}