// src/app/api/embeddings/route.ts
import { NextResponse } from 'next/server';
import { batchGenerateEmbeddings } from '@/lib/services/embeding/embeddings';

export async function POST() {
  try {
    console.log('Starting batch embedding generation...');
    
    const result = await batchGenerateEmbeddings();
    
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