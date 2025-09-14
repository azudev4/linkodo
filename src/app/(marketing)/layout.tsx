import type { Metadata } from "next";
import "../globals.css";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: {
    default: "Unveil SEO - Intelligent Content Linking",
    template: "%s | Unveil SEO"
  },
  description: "Transform your content with intelligent linking. Automatically discover and create meaningful connections between your content to boost SEO and improve user experience.",
  keywords: [
    "internal linking",
    "SEO optimization", 
    "content linking",
    "AI-powered linking",
    "content management",
    "link building",
    "content discovery"
  ],
  authors: [{ name: "Unveil SEO Team" }],
  creator: "Unveil SEO",
  publisher: "Unveil SEO",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://unveilseo.com"), // Update with your actual domain
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://unveilseo.com", // Update with your actual domain
    title: "Unveil SEO - Intelligent Content Linking",
    description: "Transform your content with intelligent linking. Boost SEO and improve user experience with AI-powered content connections.",
    siteName: "Unveil SEO",
    images: [
      {
        url: "/og-image.png", // You'll need to add this image
        width: 1200,
        height: 630,
        alt: "Unveil SEO - Intelligent Content Linking",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Unveil SEO - Intelligent Content Linking",
    description: "Transform your content with intelligent linking. Boost SEO and improve user experience with AI-powered content connections.",
    images: ["/og-image.png"], // You'll need to add this image
    creator: "@unveilseo", // Update with your actual Twitter handle
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes when you have them
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // yahoo: "your-yahoo-verification-code",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative bg-white text-gray-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Skip to main content for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Skip to main content
      </a>
      
      {/* Main content wrapper */}
      <div id="main-content" className="relative">
        <Navbar />
        {children}
        <Footer />
      </div>
      
      {/* Analytics scripts can go here */}
      {/* 
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'GA_MEASUREMENT_ID');
        `}
      </Script>
      */}
    </div>
  );
}