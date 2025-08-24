import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/dashboard/layout/AppShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Linkodo - Internal Link Tool",
  description: "Internal linking tool for SEO optimization with custom crawling and AI-powered suggestions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}