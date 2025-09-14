import type { Metadata } from "next";
import "../globals.css";
import { AppShell } from "@/components/dashboard/layout/AppShell";

export const metadata: Metadata = {
  title: "Unveil SEO - Internal Link Tool",
  description: "Internal linking tool for SEO optimization with custom crawling and AI-powered suggestions",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppShell>
        {children}
      </AppShell>
    </div>
  );
} 