// src/app/api/suggestions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMatchesForAnchor } from '@/lib/services/embeding/embedding-matcher';

export async function POST(request: NextRequest) {
  try {
    const { anchorText, maxSuggestions = 5 } = await request.json();
    
    if (!anchorText || typeof anchorText !== 'string') {
      return NextResponse.json(
        { error: 'anchorText is required and must be a string' },
        { status: 400 }
      );
    }
    
    // Validate anchor text length
    if (anchorText.trim().length === 0) {
      return NextResponse.json(
        { error: 'anchorText cannot be empty' },
        { status: 400 }
      );
    }
    
    if (anchorText.length > 200) {
      return NextResponse.json(
        { error: 'anchorText too long (max 200 characters)' },
        { status: 400 }
      );
    }
    
    console.log(`🔍 Finding suggestions for: "${anchorText}"`);
    
    const suggestions = await getMatchesForAnchor(
      anchorText, 
      Math.min(maxSuggestions, 10), // Cap at 10 suggestions
      0.7 // Minimum similarity threshold
    );
    
    console.log(`✅ Found ${suggestions.length} suggestions for "${anchorText}"`);
    
    return NextResponse.json({
      success: true,
      suggestions,
      query: anchorText,
      count: suggestions.length
    });
    
  } catch (error: any) {
    console.error('Suggestions API error:', error);
    
    // Handle specific OpenAI errors
    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a moment.' },
        { status: 429 }
      );
    }
    
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'OpenAI quota exceeded. Please check your API usage.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to find suggestions',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}