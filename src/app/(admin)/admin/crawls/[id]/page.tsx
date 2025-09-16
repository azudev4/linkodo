import type { Metadata } from "next";
import { CrawlSessionDetailsShell } from "@/components/admin/crawls/details/CrawlSessionDetailsShell";

export const metadata: Metadata = {
  title: "Crawl Session Details - Admin Dashboard",
  description: "Review and filter crawled pages for quality control and client assignment",
};

interface CrawlSessionDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function CrawlSessionDetailsPage({ params }: CrawlSessionDetailsPageProps) {
  const { id } = await params;
  return <CrawlSessionDetailsShell sessionId={id} />;
}