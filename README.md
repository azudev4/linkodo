# Cambium Linking

Internal linking tool for Cambium Media powered by OnCrawl data and AI-driven suggestions.

## What it does

- Analyzes content and suggests internal links from your OnCrawl data
- Uses AI to identify anchor text opportunities 
- Provides relevance scoring for suggested links
- Exports content with validated links in markdown or HTML

## Getting started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ONCRAWL_API_TOKEN=your_oncrawl_token
OPENAI_API_KEY=your_openai_key
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Usage

1. **Analyze**: Paste your content and click "Analyze with AI" to find linking opportunities
2. **Review**: Browse suggested links with relevance scores
3. **Validate**: Select links to add to your content
4. **Export**: Copy the final content as markdown or HTML

## Features

- AI-powered anchor text detection
- OnCrawl data integration for link suggestions
- Real-time content editing with link validation
- Batch processing of multiple anchor opportunities
- Export options for various content management systems

## Tech stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Supabase
- OnCrawl API
- OpenAI API