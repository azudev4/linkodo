"use client";

import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { 
  FileTextIcon, 
  NewspaperIcon, 
  BookOpenIcon, 
  SearchIcon,
  LinkIcon,
  BarChart3Icon
} from "lucide-react";
import React, { forwardRef, useRef } from "react";

const Circle = forwardRef<HTMLDivElement, { 
  className?: string; 
  children?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}>(
    function Circle({ className, children, size = "md" }, ref) {
        const sizeClasses = {
          sm: "h-12 w-12",
          md: "h-14 w-14", 
          lg: "h-18 w-18"
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "z-10 flex items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
                    sizeClasses[size],
                    className,
                )}
            >
                {children}
            </div>
        );
    }
);

export function ContentConnections({
    className,
}: {
    className?: string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const blogPostRef = useRef<HTMLDivElement>(null); // Single blog post (left)
    const aiRef = useRef<HTMLDivElement>(null); // Linkodo AI (center)
    const page1Ref = useRef<HTMLDivElement>(null); // Homepage
    const page2Ref = useRef<HTMLDivElement>(null); // Documentation  
    const page3Ref = useRef<HTMLDivElement>(null); // Product pages
    const page4Ref = useRef<HTMLDivElement>(null); // Other blog posts

    return (
        <div
            className={cn(
                "relative flex w-full max-w-[500px] items-center justify-center overflow-hidden rounded-lg border bg-background p-10 md:shadow-xl",
                className,
            )}
            ref={containerRef}
        >
            <div className="flex h-full w-full flex-row items-stretch justify-between gap-10">
                {/* Left side - Single source content */}
                <div className="flex flex-col justify-center">
                    <Circle ref={blogPostRef} size="md" className="border-green-200 bg-green-50">
                        <FileTextIcon className="h-5 w-5 text-green-600" />
                    </Circle>
                    <div className="text-xs text-center mt-2 text-muted-foreground">Blog Post</div>
                </div>

                {/* Center - Linkodo AI */}
                <div className="flex flex-col justify-center">
                    <Circle ref={aiRef} size="lg" className="border-blue-200 bg-blue-50">
                        <LinkIcon className="h-6 w-6 text-blue-600" />
                    </Circle>
                    <div className="text-xs text-center mt-2 text-muted-foreground">AI Links</div>
                </div>

                {/* Right side - Multiple connected pages */}
                <div className="flex flex-col justify-center gap-2">
                    <Circle ref={page1Ref} size="sm">
                        <NewspaperIcon className="h-4 w-4 text-purple-600" />
                    </Circle>
                    <Circle ref={page2Ref} size="sm">
                        <BookOpenIcon className="h-4 w-4 text-orange-600" />
                    </Circle>
                    <Circle ref={page3Ref} size="sm">
                        <SearchIcon className="h-4 w-4 text-pink-600" />
                    </Circle>
                    <Circle ref={page4Ref} size="sm">
                        <BarChart3Icon className="h-4 w-4 text-indigo-600" />
                    </Circle>
                </div>
            </div>

            {/* AnimatedBeams - Blog Post to Linkodo AI */}
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={blogPostRef}
                toRef={aiRef}
                duration={3}
                gradientStartColor="#10b981"
                gradientStopColor="#059669"
            />

            {/* AnimatedBeams - Linkodo AI to Multiple Pages */}
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={aiRef}
                toRef={page1Ref}
                duration={3}
                delay={0.5}
                gradientStartColor="#3b82f6"
                gradientStopColor="#8b5cf6"
            />
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={aiRef}
                toRef={page2Ref}
                duration={3}
                delay={0.8}
                gradientStartColor="#3b82f6"
                gradientStopColor="#f59e0b"
            />
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={aiRef}
                toRef={page3Ref}
                duration={3}
                delay={1.1}
                gradientStartColor="#3b82f6"
                gradientStopColor="#ec4899"
            />
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={aiRef}
                toRef={page4Ref}
                duration={3}
                delay={1.4}
                gradientStartColor="#3b82f6"
                gradientStopColor="#6366f1"
            />
        </div>
    );
}