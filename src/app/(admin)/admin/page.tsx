import type { Metadata } from "next";
import { AdminOverviewShell } from "@/components/admin/overview/AdminOverviewShell";

export const metadata: Metadata = {
  title: "Admin Overview - Unveil SEO",
  description: "Administrative overview dashboard with system statistics and metrics",
};

export default function AdminOverviewPage() {
  return <AdminOverviewShell />;
}