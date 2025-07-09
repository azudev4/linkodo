// src/app/api/extract-anchors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }
    
    if (text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text cannot be empty' },
        { status: 400 }
      );
    }
    
    if (text.length > 10000) {
      return NextResponse.json(
        { error: 'Text too long (max 10,000 characters)' },
        { status: 400 }
      );
    }
    
    console.log(`🤖 Extracting anchors from ${text.length} character text...`);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an expert SEO content analyzer. Your goal is to extract ALL high-quality anchor text candidates from the provided text for internal linking purposes.

PRIORITY TARGETS (focus on these):
- Specific techniques, methods, processes
- Products, tools, equipment, materials
- Problems and solutions
- Step-by-step procedures
- Technical concepts and terminology
- Location-specific terms when relevant
- Seasonal/timing-related activities

QUALITY GUIDELINES:
- Length: 1-5 words optimal (avoid very long phrases)
- Specificity: Prefer specific terms over generic ones
- Linkability: Choose terms likely to have their own dedicated pages
- Search intent: Terms people would actually search for help with

AVOID:
- Generic words
- Personal pronouns and common articles  
- Overly broad category terms unless no specifics exist
- Repetitive variations of the same concept

OUTPUT:
- Maximum 100 candidates
- JSON array format only: ["term1", "term2", ...]

Example candidates: ["wall mounting", "drill bits", "soil preparation", "safety equipment", "paint primer", "pest control", "insulation types", "wood staining", "pipe fitting", "pruning techniques"]`
        },
        {
          role: 'user',
          content: `Extract ALL potential relevant anchor candidates from this text and strictly follow the guidelines:\n\n${text}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });
    
    const content = response.choices[0].message.content?.trim();
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }
    
    console.log(`🤖 Raw GPT response: ${content.substring(0, 200)}...`);
    
    // Parse JSON response
    let candidates: string[];
    try {
      candidates = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse GPT response as JSON:', content);
      throw new Error('Invalid JSON response from GPT');
    }
    
    // Validate and clean candidates
    if (!Array.isArray(candidates)) {
      throw new Error('GPT response is not an array');
    }
    
    const cleanedCandidates = candidates
      .filter(candidate => 
        typeof candidate === 'string' && 
        candidate.trim().length > 2 &&
        candidate.trim().length < 50 // Reduced to match 1-5 words guideline
      )
      .map(candidate => candidate.trim())
      .slice(0, 50); // Hard limit
    
    console.log(`✅ Extracted ${cleanedCandidates.length} anchor candidates`);
    
    return NextResponse.json({
      success: true,
      candidates: cleanedCandidates,
      count: cleanedCandidates.length,
      inputLength: text.length
    });
    
  } catch (error: any) {
    console.error('Anchor extraction error:', error);
    
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
        error: 'Failed to extract anchors',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}