import React from "react";
import { Marquee } from "@/components/ui/marquee";
import { cn } from "@/lib/utils";

type Testimonial = {
    name: string;
    role: string;
    company: string;
    content: string;
    time: string;
    date: string;
    avatar: string;
};

const TESTIMONIALS: Testimonial[] = [
    {
        name: "Sarah Chen",
        role: "Content Manager",
        company: "TechCorp",
        content: "Our internal linking has never been smarter. The AI suggestions are incredibly accurate and have boosted our SEO rankings by 40%.",
        time: "2:30 PM",
        date: "Dec 15, 2024",
        avatar: "SC"
    },
    {
        name: "Marcus Johnson",
        role: "SEO Specialist",
        company: "Growth Labs",
        content: "This tool transformed how we connect our content. What used to take hours now takes minutes, and the results are phenomenal.",
        time: "11:45 AM",
        date: "Dec 12, 2024",
        avatar: "MJ"
    },
    {
        name: "Elena Rodriguez",
        role: "Digital Marketing Lead",
        company: "InnovateCo",
        content: "The intelligent linking suggestions have improved our user engagement metrics significantly. Our bounce rate dropped by 25%.",
        time: "4:15 PM",
        date: "Dec 10, 2024",
        avatar: "ER"
    },
    {
        name: "David Park",
        role: "Content Strategist",
        company: "MediaFlow",
        content: "Game-changing for content teams. The contextual understanding is remarkable - it finds connections we never would have thought of.",
        time: "9:20 AM",
        date: "Dec 8, 2024",
        avatar: "DP"
    },
    {
        name: "Lisa Thompson",
        role: "Blog Manager",
        company: "WriteWell",
        content: "Our content ecosystem is now beautifully interconnected. Readers are discovering more of our articles than ever before.",
        time: "3:50 PM",
        date: "Dec 5, 2024",
        avatar: "LT"
    },
    {
        name: "Ahmed Hassan",
        role: "Technical Writer",
        company: "DevDocs",
        content: "Perfect for technical documentation. It understands complex relationships between topics and creates meaningful pathways.",
        time: "1:10 PM",
        date: "Dec 3, 2024",
        avatar: "AH"
    },
];

const Testimonials = () => {
    return (
        <div className="flex flex-col items-center justify-center relative w-full py-16 lg:py-24">
            <div className="w-full">
                <div className="relative flex flex-col items-center justify-center overflow-hidden">
                    {/* Single row */}
                    <Marquee pauseOnHover className="[--duration:80s] gap-6">
                        {TESTIMONIALS.map((item) => (
                            <TestimonialCard key={item.name} item={item} />
                        ))}
                    </Marquee>
                    
                    {/* Fade effects - earlier fade */}
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-background"></div>
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-background"></div>
                </div>
            </div>
            
            {/* Background blur effects */}
            <div className="absolute hidden lg:block top-1/4 left-1/4 w-32 h-16 rounded-full bg-blue-500/20 -z-10 blur-[6rem]"></div>
            <div className="absolute hidden lg:block top-1/4 right-1/4 w-32 h-16 rounded-full bg-blue-600/20 -z-10 blur-[6rem]"></div>
        </div>
    );
};

const TestimonialCard = ({ item }: { item: Testimonial }) => (
    <div className="flex flex-col bg-white border border-blue-100 rounded-lg lg:rounded-xl p-6 w-[400px] shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-x-3 w-full mb-4">
            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                {item.avatar}
            </div>
            <div className="flex flex-col">
                <h4 className="font-semibold text-gray-900">
                    {item.name}
                </h4>
                <div className="text-muted-foreground text-sm">
                    {item.role}{" "}
                    <span className="text-blue-600 ml-1 font-medium">
                        @{item.company}
                    </span>
                </div>
            </div>
        </div>
        <div className="text-gray-700 text-sm leading-relaxed mb-4">
            &quot;{item.content}&quot;
        </div>
        <div className="text-xs text-muted-foreground flex gap-2">
            <span>{item.time}</span>
            <span>·</span>
            <span>{item.date}</span>
        </div>
    </div>
);

export default Testimonials;