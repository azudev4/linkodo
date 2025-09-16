import type { Metadata } from "next";
import { AdminUsersShell } from "@/components/admin/users/AdminUsersShell";

export const metadata: Metadata = {
  title: "User Management - Admin Dashboard",
  description: "Manage platform users, permissions, and access levels",
};

export default function AdminUsersPage() {
  return <AdminUsersShell />;
}