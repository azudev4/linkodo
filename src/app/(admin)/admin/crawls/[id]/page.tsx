import type { Metadata } from "next";
import { CrawlSessionDetailsShell } from "@/components/admin/crawls/CrawlSessionDetailsShell";

export const metadata: Metadata = {
  title: "Crawl Session Details - Admin Dashboard",
  description: "Review and filter crawled pages for quality control and client assignment",
};

interface CrawlSessionDetailsPageProps {
  params: { id: string };
}

export default function CrawlSessionDetailsPage({ params }: CrawlSessionDetailsPageProps) {
  return <CrawlSessionDetailsShell sessionId={params.id} />;
}