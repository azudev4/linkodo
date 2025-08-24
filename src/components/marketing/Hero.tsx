"use client";

import React from "react";
import { ArrowRightIcon, LinkIcon, SparklesIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AnimationContainerProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    reverse?: boolean;
    simple?: boolean;
}

const AnimationContainer = ({ children, className, delay = 0.1, reverse, simple }: AnimationContainerProps) => {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true });

    return (
        <motion.div
            ref={ref}
            className={cn("w-full h-full", className)}
            initial={{ opacity: 0, y: reverse ? -30 : 30, scale: 0.95 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: reverse ? -30 : 30, scale: 0.95 }}
            transition={{ 
                delay: delay, 
                duration: simple ? 0.3 : 0.6, 
                type: simple ? "tween" : "spring", 
                stiffness: simple ? 100 : 80,
                damping: simple ? 10 : 12,
                ease: [0.25, 0.46, 0.45, 0.94]
            }}
        >
            {children}
        </motion.div>
    );
};

interface OrbitingCirclesProps {
    className?: string;
    children?: React.ReactNode;
    reverse?: boolean;
    duration?: number;
    radius?: number;
    speed?: number;
}

const OrbitingCircles = ({
    className,
    children,
    reverse,
    duration = 20,
    radius = 160,
    speed = 1,
}: OrbitingCirclesProps) => {
    const calculatedDuration = duration / speed;
    
    return (
        <>
            {/* Orbit path */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                version="1.1"
                className="pointer-events-none absolute -inset-96 w-[200%] h-[200%]"
                style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
            >
                <circle
                    className="stroke-blue-400/30 stroke-1"
                    strokeDasharray="4 4"
                    cx="50%"
                    cy="50%"
                    r={radius}
                    fill="none"
                />
            </svg>
            
            {/* Orbiting elements */}
            {React.Children.map(children, (child, index) => {
                const angle = (360 / React.Children.count(children)) * index;
                return (
                    <div
                        key={index}
                        style={
                            {
                                "--duration": calculatedDuration,
                                "--radius": radius,
                                "--angle": angle,
                            } as React.CSSProperties
                        }
                        className={cn(
                            "absolute flex size-8 animate-orbit items-center justify-center rounded-full",
                            { "[animation-direction:reverse]": reverse },
                            className,
                        )}
                    >
                        {child}
                    </div>
                );
            })}
        </>
    );
};

const Hero = () => {
    return (
        <div className="relative flex flex-col items-center justify-center w-full py-20 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute flex size-40 rounded-full bg-blue-500 blur-[10rem] opacity-30 top-0 left-1/4 -translate-x-1/2 -z-10"></div>
            <div className="absolute flex size-60 rounded-full bg-blue-600 blur-[15rem] opacity-20 top-1/4 right-1/4 translate-x-1/2 -z-10"></div>
            
            {/* Orbiting Circles - Desktop Only - COMPLETELY OUTSIDE main container */}
            <div className="hidden lg:flex absolute inset-0 top-[35%] mb-auto flex-col items-center justify-center w-full h-[200px] z-0 pointer-events-none overflow-visible">
                    <OrbitingCircles speed={0.5} radius={300}>
                        <LinkIcon className="size-4 text-blue-600/60" />
                        <LinkIcon className="size-4 text-blue-600/50" />
                        <div className="size-2 rounded-full bg-blue-500/80" />
                    </OrbitingCircles>
                    <OrbitingCircles speed={0.25} radius={400} reverse>
                        <LinkIcon className="size-4 text-blue-600/50" />
                        <LinkIcon className="size-4 text-blue-600/40" />
                        <div className="size-2 rounded-full bg-blue-400/50" />
                        <div className="size-2 rounded-full bg-blue-500/90" />
                    </OrbitingCircles>
                    <OrbitingCircles speed={0.1} radius={500}>
                        <LinkIcon className="size-4 text-blue-500/50" />
                        <LinkIcon className="size-4 text-blue-500/40" />
                        <div className="size-2 rounded-full bg-blue-300/50" />
                        <div className="size-2 rounded-full bg-blue-600/90" />
                        <div className="size-2 rounded-full bg-blue-400/90" />
                    </OrbitingCircles>
                </div>
                
            <div className="flex flex-col items-center justify-center gap-y-8">
                {/* Badge */}
                <AnimationContainer className="relative hidden lg:block z-20">
                    <motion.button 
                        className="group relative grid overflow-hidden rounded-full px-3 py-1.5 shadow-[0_1000px_0_0_hsl(217_24%_95%)_inset] transition-colors duration-200 mx-auto border border-blue-200/50"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span className="spark mask-gradient absolute inset-0 h-[100%] w-[100%] animate-pulse overflow-hidden rounded-full [mask:linear-gradient(white,_transparent_50%)]" />
                        <span className="backdrop absolute inset-[1px] rounded-full bg-white/90 transition-colors duration-200 group-hover:bg-blue-50/90" />
                        <span className="z-10 py-0.5 text-sm text-gray-700 flex items-center font-medium">
                            <span className="px-2 py-[2px] h-[20px] tracking-wide flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-[10px] font-semibold mr-2 text-white">
                                NEW
                            </span>
                            Boost your content with smart linking
                        </span>
                    </motion.button>
                </AnimationContainer>

                {/* Main Heading */}
                <AnimationContainer delay={0.15} className="text-center relative">
                    {/* White aura extending higher above heading - smaller for more path visibility */}
                    <div className="absolute inset-0 -top-32 bg-white opacity-35 blur-3xl scale-x-140 scale-y-160 z-1"></div>
                    <div className="absolute inset-0 -top-20 bg-white opacity-55 blur-2xl scale-x-115 scale-y-135 z-1"></div>
                    <div className="absolute inset-0 -top-10 bg-white opacity-75 blur-xl scale-x-105 scale-y-120 z-1"></div>
                    <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold !leading-tight max-w-5xl mx-auto relative z-10">
                        Transform your content with{" "}
                        <span className="bg-gradient-to-r from-blue-600 to-blue-800 text-transparent bg-clip-text">
                            intelligent linking
                        </span>
                    </h1>
                </AnimationContainer>

                {/* Subtitle */}
                <AnimationContainer delay={0.2} simple>
                    <div className="relative">
                        {/* Slightly smaller white opacity aura around subtitle */}
                        <div className="absolute inset-0 bg-white opacity-30 blur-3xl scale-150 z-1"></div>
                        <div className="absolute inset-0 bg-white opacity-50 blur-2xl scale-125 z-1"></div>
                        <div className="absolute inset-0 bg-white opacity-70 blur-xl scale-110 z-1"></div>
                        <p className="max-w-2xl mx-auto mt-4 text-lg lg:text-xl text-center text-gray-600 relative z-10">
                            Automatically discover and create meaningful connections between your content. 
                            Boost SEO, improve user experience, and strengthen your content ecosystem.
                        </p>
                    </div>
                </AnimationContainer>

                {/* CTA Buttons */}
                <AnimationContainer delay={0.25} className="relative z-20">
                    <div className="flex flex-col sm:flex-row items-center justify-center mt-8 gap-4 w-full">
                        <Link href="/dashboard">
                            <Button 
                                size="lg" 
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg group"
                            >
                                Start Linking Now
                                <ArrowRightIcon className="size-5 ml-2 group-hover:translate-x-1 transition-all duration-300" />
                            </Button>
                        </Link>
                        <Link href="/demo">
                            <Button 
                                variant="outline" 
                                size="lg" 
                                className="border-blue-200 hover:bg-blue-50 text-blue-700 px-8 py-3 text-lg group"
                            >
                                View Demo
                            </Button>
                        </Link>
                    </div>
                </AnimationContainer>

                {/* Dashboard Preview */}
                <AnimationContainer delay={0.3} className="relative mt-16 z-10">
                    <div className="relative rounded-xl lg:rounded-[32px] border border-blue-200/50 p-2 backdrop-blur-lg max-w-6xl mx-auto">
                        {/* Glow Effects */}
                        <div className="absolute top-1/4 left-1/2 -z-10 bg-gradient-to-r from-blue-400 to-blue-600 w-3/4 lg:w-4/5 -translate-x-1/2 h-1/3 -translate-y-1/2 inset-0 blur-[4rem] lg:blur-[8rem] animate-pulse"></div>
                        <div className="hidden lg:block absolute -top-1/8 left-1/2 -z-20 bg-blue-500 w-1/3 -translate-x-1/2 h-1/4 -translate-y-1/2 inset-0 blur-[8rem] animate-pulse"></div>

                        <div className="rounded-lg lg:rounded-[22px] border border-blue-100 bg-white shadow-2xl overflow-hidden">
                            {/* Placeholder for dashboard image - you'll need to add your actual dashboard image */}
                            <div className="w-full aspect-[16/9] bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
                                <div className="text-center space-y-4">
                                    <LinkIcon className="size-16 text-blue-600 mx-auto" />
                                    <p className="text-xl text-blue-700 font-semibold">Dashboard Preview Coming Soon</p>
                                    <p className="text-gray-600">Your intelligent linking workspace</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Bottom Fade */}
                    <div className="bg-gradient-to-t from-white to-transparent absolute bottom-0 inset-x-0 w-full h-1/3 pointer-events-none"></div>
                </AnimationContainer>
            </div>
        </div>
    );
};

export default Hero;