import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ArrowRightIcon, SearchIcon, BarChart3Icon, BrainCircuitIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { ContentConnections } from "../marketing/ContentConnections";

export const UNVEILSEO_CARDS = [
    {
        Icon: SearchIcon,
        name: "Find Link Opportunities",
        description: "Search through your indexed content to discover connection possibilities.",
        href: "#",
        cta: "Learn more",
        className: "col-span-3 lg:col-span-1 overflow-hidden",
        background: (
            <div className="absolute right-10 top-10 w-[70%] origin-top-right translate-x-0 border border-border rounded-lg transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:-translate-x-10 p-4 bg-background transform-gpu">
                <Input placeholder="Search your content..." className="mb-2" />
                <div className="mt-1 cursor-pointer space-y-1">
                    <div className="px-3 py-2 hover:bg-muted rounded-md text-sm">📄 How to Optimize SEO</div>
                    <div className="px-3 py-2 hover:bg-muted rounded-md text-sm">📝 Link Building Guide</div>
                    <div className="px-3 py-2 hover:bg-muted rounded-md text-sm">🚀 Content Strategy Tips</div>
                    <div className="px-3 py-2 hover:bg-muted rounded-md text-sm">📊 Analytics Best Practices</div>
                    <div className="px-3 py-2 hover:bg-muted rounded-md text-sm">🎯 Conversion Optimization</div>
                </div>
            </div>
        ),
    },
    {
        Icon: BrainCircuitIcon,
        name: "Connect Your Content",
        description: "Visualize and create intelligent connections between your pages and posts.",
        href: "#",
        cta: "Learn more",
        className: "col-span-3 lg:col-span-2 max-w-full overflow-hidden",
        background: (
            <ContentConnections className="absolute right-2 pl-28 md:pl-0 top-4 h-[300px] w-[600px] border-none transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_5%,#000_60%)] group-hover:scale-105" />
        ),
    },
    {
        Icon: UsersIcon,
        name: "Dedicated Customer Success Representative & Crawler",
        description: "Get personalized support with a dedicated representative handling crawling and link filtering for maximum relevancy.",
        href: "#",
        cta: "Learn more",
        className: "col-span-3 lg:col-span-2",
        background: (
            <div className="absolute top-4 right-2 flex gap-3 origin-top transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_0%,#000_100%)] group-hover:scale-105">
                {/* Main Chat Window */}
                <div className="w-72 h-44 rounded-lg bg-white border shadow-lg overflow-hidden">
                    {/* Chat Header */}
                    <div className="bg-gray-50 px-3 py-2 border-b flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
                            <UsersIcon className="w-3 h-3 text-white" />
                        </div>
                        <div>
                            <div className="text-xs font-medium">Mathias Decourt</div>
                            <div className="text-xs text-green-600">● Success Manager</div>
                        </div>
                    </div>
                    
                    {/* Chat Messages */}
                    <div className="p-2 space-y-1.5 text-xs">
                        <div className="flex gap-1 justify-end">
                            <div className="bg-green-500 text-white px-2 py-1 rounded-xl">
                                Hey Mathias, quick question about the crawl settings
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <div className="bg-blue-500 text-white px-2 py-1 rounded-xl">
                                Sure! What do you need help with?
                            </div>
                        </div>
                        <div className="flex gap-1 justify-end">
                            <div className="bg-green-500 text-white px-2 py-1 rounded-xl">
                                Can you exclude all 2012 forum pages?
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <div className="bg-blue-500 text-white px-2 py-1 rounded-xl">
                                Done! Re-running the analysis now
                            </div>
                        </div>
                    </div>
                </div>

                {/* Analytics Window */}
                <div className="w-56 h-44 rounded-lg bg-white border shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gray-50 px-3 py-2 border-b">
                        <div className="text-xs font-medium">Crawl Analytics</div>
                        <div className="text-xs text-green-600">● Live Data</div>
                    </div>
                    
                    {/* Stats */}
                    <div className="p-3 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Pages Found</span>
                            <span className="text-xs font-semibold">1,247</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Links Filtered</span>
                            <span className="text-xs font-semibold text-green-600">4,832</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Blog Posts</span>
                            <span className="text-xs font-semibold">847</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Link Opportunities</span>
                            <span className="text-xs font-semibold text-blue-600">2,341</span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-3">
                            <div className="text-xs text-gray-600 mb-1">Processing</div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div className="bg-blue-500 h-1.5 rounded-full animate-pulse" style={{width: '73%'}}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ),
    },
    {
        Icon: BarChart3Icon,
        name: "Track Performance",
        description: "Monitor your internal linking performance and SEO impact over time.",
        className: "col-span-3 lg:col-span-1",
        href: "#",
        cta: "Learn more",
        background: (
            <div className="absolute right-0 top-8 w-80 h-48 origin-top rounded-lg transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:scale-105 bg-white border shadow-lg p-4 overflow-hidden">
                <svg width="100%" height="100%" viewBox="0 0 320 160" className="absolute inset-0">
                    {/* Grid lines */}
                    <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.1"/>
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.4"/>
                        </linearGradient>
                    </defs>
                    
                    {/* Vertical grid lines */}
                    <g stroke="#e2e8f0" strokeWidth="1" opacity="0.3">
                        <line x1="40" y1="20" x2="40" y2="120"/>
                        <line x1="100" y1="20" x2="100" y2="120"/>
                        <line x1="160" y1="20" x2="160" y2="120"/>
                        <line x1="220" y1="20" x2="220" y2="120"/>
                        <line x1="280" y1="20" x2="280" y2="120"/>
                    </g>
                    
                    {/* Horizontal grid lines */}
                    <g stroke="#e2e8f0" strokeWidth="1" opacity="0.3">
                        <line x1="20" y1="40" x2="300" y2="40"/>
                        <line x1="20" y1="60" x2="300" y2="60"/>
                        <line x1="20" y1="80" x2="300" y2="80"/>
                        <line x1="20" y1="100" x2="300" y2="100"/>
                        <line x1="20" y1="120" x2="300" y2="120"/>
                    </g>
                    
                    {/* Chart line with curve */}
                    <path 
                        d="M 40 110 Q 70 100 100 85 Q 130 75 160 70 Q 190 65 220 60 Q 250 50 280 45" 
                        stroke="url(#chartGradient)" 
                        strokeWidth="4" 
                        fill="none"
                        strokeLinecap="round"
                    />
                    
                    {/* Data points */}
                    <circle cx="40" cy="110" r="4" fill="#3B82F6"/>
                    <circle cx="100" cy="85" r="4" fill="#3B82F6"/>
                    <circle cx="160" cy="70" r="4" fill="#3B82F6"/>
                    <circle cx="220" cy="60" r="4" fill="#3B82F6"/>
                    <circle cx="280" cy="45" r="4" fill="#3B82F6"/>
                    
                    {/* Animated highlight on last point */}
                    <circle cx="280" cy="45" r="8" fill="none" stroke="#3B82F6" strokeWidth="2" opacity="0.6">
                        <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite"/>
                    </circle>
                    
                    {/* Y-axis labels */}
                    <text x="15" y="125" fontSize="10" fill="#6b7280">0</text>
                    <text x="15" y="105" fontSize="10" fill="#6b7280">25</text>
                    <text x="15" y="85" fontSize="10" fill="#6b7280">50</text>
                    <text x="15" y="65" fontSize="10" fill="#6b7280">75</text>
                    <text x="8" y="45" fontSize="10" fill="#6b7280">100</text>
                    
                    {/* X-axis labels */}
                    <text x="35" y="140" fontSize="10" fill="#6b7280" textAnchor="middle">Jan</text>
                    <text x="95" y="140" fontSize="10" fill="#6b7280" textAnchor="middle">Feb</text>
                    <text x="155" y="140" fontSize="10" fill="#6b7280" textAnchor="middle">Mar</text>
                    <text x="215" y="140" fontSize="10" fill="#6b7280" textAnchor="middle">Apr</text>
                    <text x="275" y="140" fontSize="10" fill="#6b7280" textAnchor="middle">May</text>
                    
                    {/* Title */}
                    <text x="20" y="15" fontSize="12" fill="#374151" fontWeight="bold">Link Performance</text>
                </svg>
            </div>
        ),
    },
];

const BentoGrid = ({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) => {
    return (
        <div
            className={cn(
                "grid w-full auto-rows-[22rem] grid-cols-3 gap-4",
                className,
            )}
        >
            {children}
        </div>
    );
};

const BentoCard = ({
    name,
    className,
    background,
    Icon,
    description,
    href,
    cta,
}: {
    name: string;
    className: string;
    background: ReactNode;
    Icon: React.ComponentType<{ className?: string }>;
    description: string;
    href: string;
    cta: string;
}) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
    <div
        key={name}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
            "group relative col-span-3 flex flex-col justify-between border border-border/60 hover:border-blue-300 overflow-hidden rounded-xl transform-gpu isolate transition-all duration-300",
            "bg-background [box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] hover:shadow-[0_0_0_1px_rgba(59,130,246,0.3),0_8px_32px_rgba(59,130,246,0.12)]",
            className,
        )}
    >
        <div>{background}</div>
        <motion.div 
            className="pointer-events-none z-10 flex flex-col gap-1 p-6"
            animate={{ y: isHovered ? -40 : 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
        >
            <Icon className="h-10 w-10 origin-left text-slate-600 transition-all duration-300 ease-in-out group-hover:scale-75" />
            <h3 className="text-lg font-medium text-slate-600">
                {name}
            </h3>
            <p className="max-w-lg text-muted-foreground">{description}</p>
        </motion.div>

        <div
            className={cn(
                "absolute bottom-0 flex w-full translate-y-10 flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 will-change-transform",
            )}
        >
            <Link href={href} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 cursor-pointer">
                {cta}
                <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
        </div>
        <div className="pointer-events-none absolute inset-0 transition-all duration-300 group-hover:bg-black/[.01] group-hover:dark:bg-neutral-800/5" />
    </div>
    );
};

export { BentoCard, BentoGrid };