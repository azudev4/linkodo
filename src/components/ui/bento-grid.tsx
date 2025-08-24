import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ArrowRightIcon, LinkIcon, SearchIcon, BarChart3Icon, BrainCircuitIcon } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { ContentConnections } from "../marketing/ContentConnections";

export const LINKODO_CARDS = [
    {
        Icon: LinkIcon,
        name: "Smart Link Discovery",
        description: "AI automatically finds the best internal linking opportunities in your content.",
        href: "#",
        cta: "Learn more",
        className: "col-span-3 lg:col-span-1",
        background: (
            <Card className="absolute top-10 left-10 origin-top rounded-none rounded-tl-md transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_0%,#000_100%)] group-hover:scale-105 border border-border border-r-0">
                <CardHeader>
                    <CardTitle>
                        Analyze Your Content
                    </CardTitle>
                    <CardDescription>
                        Paste your content and get instant linking suggestions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="-mt-4">
                    <Label>
                        Content URL or Text
                    </Label>
                    <Input
                        type="text"
                        placeholder="https://yoursite.com/blog-post..."
                        className="w-full focus-visible:ring-0 focus-visible:ring-transparent"
                    />
                </CardContent>
            </Card>
        ),
    },
    {
        Icon: SearchIcon,
        name: "Find Link Opportunities",
        description: "Search through your indexed content to discover connection possibilities.",
        href: "#",
        cta: "Learn more",
        className: "col-span-3 lg:col-span-2",
        background: (
            <div className="absolute right-10 top-10 w-[70%] origin-to translate-x-0 border border-border rounded-lg transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:-translate-x-10 p-4 bg-background">
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
        Icon: BarChart3Icon,
        name: "Track Performance",
        description: "Monitor your internal linking performance and SEO impact over time.",
        className: "col-span-3 lg:col-span-1",
        href: "#",
        cta: "Learn more",
        background: (
            <div className="absolute right-0 top-10 origin-top rounded-md border border-border transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:scale-105 bg-background p-4">
                <div className="text-xs text-muted-foreground mb-3">Link Performance</div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs">Click Rate</span>
                        <span className="text-xs font-bold text-green-600">+24%</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs">Page Views</span>
                        <span className="text-xs font-bold text-blue-600">+156</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs">SEO Score</span>
                        <span className="text-xs font-bold text-purple-600">87/100</span>
                    </div>
                    <div className="w-full h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded opacity-20 mt-3"></div>
                </div>
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
    Icon: any;
    description: string;
    href: string;
    cta: string;
}) => (
    <div
        key={name}
        className={cn(
            "group relative col-span-3 flex flex-col justify-between border border-border/60 overflow-hidden rounded-xl",
            "bg-background [box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]",
            className,
        )}
    >
        <div>{background}</div>
        <div className="pointer-events-none z-10 flex flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-10">
            <Icon className="h-12 w-12 origin-left text-foreground transition-all duration-300 ease-in-out group-hover:scale-75" />
            <h3 className="text-xl font-semibold text-foreground">
                {name}
            </h3>
            <p className="max-w-lg text-muted-foreground">{description}</p>
        </div>

        <div
            className={cn(
                "absolute bottom-0 flex w-full translate-y-10 flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100",
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

export { BentoCard, BentoGrid };