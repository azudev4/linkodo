import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { AppShell } from "@/components/dashboard/layout/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const inter = Inter({ subsets: ["latin"] });

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
      <ProtectedRoute requiredRoles={['early_access', 'admin']}>
        <AppShell>
          {children}
        </AppShell>
      </ProtectedRoute>
    </div>
  );
} 