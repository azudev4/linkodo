// src/app/api/suggestions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMatchesForAnchor } from '@/lib/services/embeding/embedding-matcher';

export async function POST(request: NextRequest) {
  try {
    const { anchorText, maxSuggestions = 5 } = await request.json();
    
    // Validate input
    if (!anchorText || typeof anchorText !== 'string') {
      return NextResponse.json(
        { error: 'Invalid anchor text - must be a non-empty string' },
        { status: 400 }
      );
    }

    if (anchorText.length > 200) {
      return NextResponse.json(
        { error: 'Anchor text too long - must be 200 characters or less' },
        { status: 400 }
      );
    }
    
    console.log(`🔍 Finding suggestions for: "${anchorText}"`);
    
    const suggestions = await getMatchesForAnchor(
      anchorText, 
      Math.min(maxSuggestions, 10) // Cap at 10 suggestions
    );
    
    return NextResponse.json({
      success: true,
      suggestions,
      meta: {
        query: anchorText,
        count: suggestions.length,
        maxRequested: maxSuggestions
      }
    });

  } catch (error: unknown) {
    console.error('❌ Error getting suggestions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}