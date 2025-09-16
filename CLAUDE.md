# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev      # Start development server on localhost:3000
npm run build    # Build production application
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture Overview

### Application Structure
This is **Unveil SEO** (formerly Cambium Linking) - an internal linking tool with AI-powered suggestions and custom web crawling capabilities. Built with Next.js 15, React 19, TypeScript, and Supabase.

### Route Architecture
The app uses Next.js route groups for organization:

- **`(marketing)/`** - Landing pages and public content
- **`(auth)/`** - Authentication pages (login, signup, password reset)
- **`(dashboard)/`** - Main application interface for authenticated users
- **`(admin)/`** - Administrative interface for platform management

### Authentication & Authorization
- **User Roles**: `user`, `early_access`, `admin`
- **Access Control**: Role-based access using `useProfileStore` with `hasRole()` and `hasAccess()` methods
- **Profile Management**: Centralized in `src/lib/stores/useProfileStore.ts` with caching and automatic refresh

### Supabase Client Usage
**Critical**: Use `createServiceRoleClient()` for ALL API routes by default, except for specific authentication flows:

- **`createServiceRoleClient()`** - Use everywhere (bypasses RLS, full database access)
  - All admin routes (`/api/admin/*`)
  - All system operations (`/api/stats`, `/api/reset-embeddings`, `/api/embeddings`)
  - Password reset and email operations
  - **Default choice for all new API routes**

- **`createClient()`** - ONLY for these specific auth routes:
  - `/api/auth/signup` - Needs proper email confirmation flow
  - `/api/auth/confirm` - Exchanges email confirmation codes for sessions
  - `/api/auth/login` - Sets session cookies for user browser (line 50 only)

**Rule**: Unless you're handling user authentication sessions or email confirmation, use `createServiceRoleClient()`.

### Component Architecture

#### Shell Pattern
Pages use a "Shell" pattern where each page imports a single shell component containing all page logic:
- `AdminOverviewShell` → `/admin/page.tsx`
- `AdminUsersShell` → `/admin/users/page.tsx`
- `AnalyzeShell` → `/dashboard/page.tsx`

This keeps pages clean and centralizes component logic.

#### Layout Structure
- **Marketing**: Hero, Features, Pricing, CTA components with framer-motion animations
- **Dashboard**: AppShell (Sidebar + Header + content area)
- **Admin**: AdminSidebar + AdminHeader + content area

### State Management
- **Zustand** with persistent storage for user profiles and app state
- **Custom store pattern** in `src/lib/stores/` with error handling and caching
- **Profile store** handles authentication state, role checking, and automatic refresh

### Database Schema
Key tables in Supabase:
- `profiles` - User profiles with roles, company info
- `crawl_sessions` - Website crawling operations
- Additional tables for embeddings and linking data

### AI & Crawling Features
- **OpenAI integration** for anchor text detection and linking suggestions
- **Firecrawl integration** (`@mendable/firecrawl-js`) for website crawling
- **Embeddings system** for semantic link matching

### Styling & UI
- **Tailwind CSS v4** with custom animations
- **Radix UI** components with custom styling
- **Framer Motion** for animations throughout marketing and dashboard
- **Lucide React** for consistent iconography

### Environment Variables Required
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

### API Route Patterns
- **Authentication**: `/api/auth/*` (signup, login, password reset)
- **Admin Management**: `/api/admin/*` (user management, system operations)
- **Core Features**: `/api/suggestions`, `/api/embeddings`, `/api/extract-anchors`
- **System**: `/api/stats`, `/api/diagnose-embeddings`

### Key Architectural Decisions
1. **Role-based access control** throughout the application
2. **Service role client** for admin operations to bypass RLS
3. **Shell pattern** for clean page organization
4. **Persisted Zustand stores** for state management
5. **Route groups** for logical application organization