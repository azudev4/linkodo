import { 
  SearchIcon, 
  BarChart3Icon, 
  BrainCircuitIcon, 
  UsersIcon, 
  NetworkIcon 
} from "lucide-react";

export const FEATURES = [
  {
    title: "AI-Powered Link Discovery",
    description: "Automatically identify the most relevant internal linking opportunities across your content with advanced AI analysis.",
    icon: BrainCircuitIcon,
    image: "/images/ai-discovery.svg",
  },
  {
    title: "Content Analytics",
    description: "Track link performance, click-through rates, and SEO impact with comprehensive analytics dashboards.",
    icon: BarChart3Icon,
    image: "/images/analytics.svg",
  },
  {
    title: "Link Network Visualization",
    description: "Visualize your content relationships and identify gaps in your internal linking structure.",
    icon: NetworkIcon,
    image: "/images/network.svg",
  },
  {
    title: "Smart Content Crawling",
    description: "Efficiently crawl and index your content to build a comprehensive understanding of your site structure.",
    icon: SearchIcon,
    image: "/images/crawling.svg",
  },
  {
    title: "Dedicated Success Manager",
    description: "Get personalized support with a dedicated customer success representative handling crawling and link filtering for maximum relevancy.",
    icon: UsersIcon,
    image: "/images/support.svg",
  }
];