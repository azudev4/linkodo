/**
 * Decode HTML entities in text fields from OnCrawl
 * DEPRECATED: This file is no longer used with OnCrawl but contains useful 
 * HTML entity decoding utilities that might be useful for our custom crawler implementation
 */
export function decodeHtmlEntities(text: string | null): string | null {
  if (!text) return text;
  
  return text
    .replace(/&#39;/g, "'")      // Single quote
    .replace(/&quot;/g, '"')     // Double quote  
    .replace(/&amp;/g, '&')      // Ampersand
    .replace(/&lt;/g, '<')       // Less than
    .replace(/&gt;/g, '>')       // Greater than
    .replace(/&nbsp;/g, ' ')     // Non-breaking space
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec)) // Numeric entities
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16))); // Hex entities
} 