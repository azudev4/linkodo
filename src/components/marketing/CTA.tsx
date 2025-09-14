"use client";

import React from "react";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AnimationContainerProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}

const AnimationContainer = ({ children, className, delay = 0.1 }: AnimationContainerProps) => {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true });

    return (
        <motion.div
            ref={ref}
            className={cn("w-full h-full", className)}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
            transition={{
                delay: delay,
                duration: 0.6,
                type: "spring",
                stiffness: 80,
                damping: 12,
                ease: [0.25, 0.46, 0.45, 0.94]
            }}
        >
            {children}
        </motion.div>
    );
};

const CTA = () => {
    return (
        <section className="relative py-20 pb-40 overflow-hidden">

            <div className="relative max-w-4xl mx-auto px-4 text-center">
                <AnimationContainer>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                        Ready to{" "}
                        <span className="bg-gradient-to-r from-blue-600 to-blue-800 text-transparent bg-clip-text">
                            unveil your potential?
                        </span>
                    </h2>
                </AnimationContainer>

                <AnimationContainer delay={0.15}>
                    <p className="text-lg lg:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        Get a personal walkthrough from one of our founders and see if UnveilSEO is the perfect fit for your website.
                    </p>
                </AnimationContainer>

                <AnimationContainer delay={0.2}>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/dashboard">
                            <Button
                                size="lg"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg group"
                            >
                                Request Early Access
                                <ArrowRightIcon className="size-5 ml-2 group-hover:translate-x-1 transition-all duration-300" />
                            </Button>
                        </Link>
                        <Link href="/demo">
                            <Button
                                variant="outline"
                                size="lg"
                                className="border-blue-200 hover:bg-blue-50 text-blue-700 px-8 py-3 text-lg"
                            >
                                Watch Demo
                            </Button>
                        </Link>
                    </div>
                </AnimationContainer>

                <AnimationContainer delay={0.25}>
                    <p className="text-sm text-gray-500 mt-6">
                        No credit card required • Free forever plan available
                    </p>
                </AnimationContainer>
            </div>
        </section>
    );
};

export default CTA;