import type { Metadata } from "next";
import { AdminCrawlsShell } from "@/components/admin/crawls/AdminCrawlsShell";

export const metadata: Metadata = {
  title: "Crawl Management - Admin Dashboard",
  description: "Monitor and manage website crawling operations and data synchronization",
};

export default function AdminCrawlsPage() {
  return <AdminCrawlsShell />;
}