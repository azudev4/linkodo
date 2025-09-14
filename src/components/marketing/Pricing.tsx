"use client";

import React from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";

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

const Pricing = () => {
    return (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <AnimationContainer className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6">
                        Early Access Program
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                        Try{" "}
                        <span className="text-transparent bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text">
                            UnveilSEO
                        </span>
                        {" "}for free
                    </h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        We&apos;re in early access mode - try UnveilSEO risk-free to see if it&apos;s the right fit for your website.
                        Request access and start discovering your internal linking opportunities today.
                    </p>
                </AnimationContainer>

                {/* Pricing Card */}
                <div className="flex justify-center">
                    <AnimationContainer delay={0.15} className="max-w-lg w-full">
                        <div className="relative bg-white rounded-2xl p-10 shadow-[0_0_40px_rgb(0,0,0,0.08)] hover:shadow-[0_0_80px_rgb(0,0,0,0.12)] transition-all duration-500 border-2 border-blue-100 hover:border-blue-200">
                            {/* Blue corner accents */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-blue-500 rounded-tl-2xl"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-blue-500 rounded-tr-2xl"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-blue-500 rounded-bl-2xl"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-blue-500 rounded-br-2xl"></div>

                            <div className="text-center mb-8">
                                <div className="mb-4">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                        Early Access
                                    </span>
                                </div>

                                <h3 className="text-3xl font-bold text-gray-900 mb-3">Try UnveilSEO</h3>
                                <p className="text-gray-600 text-lg mb-6 leading-relaxed">Get a personalized demo and see if it&apos;s the perfect fit for your website</p>

                                <div className="mb-6">
                                    <div className="flex items-baseline justify-center gap-2">
                                        <span className="text-6xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Free</span>
                                        <span className="text-gray-500 text-lg font-medium">during beta</span>
                                    </div>
                                    <p className="text-sm text-blue-600 font-medium mt-2">No credit card required</p>
                                </div>
                            </div>

                            <div className="space-y-5 mb-10">
                                <div className="flex items-start group">
                                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-4 mt-0.5 group-hover:scale-110 transition-transform duration-200">
                                        <Check className="size-3 text-white" />
                                    </div>
                                    <span className="text-gray-700 font-medium">Personal call with one of our founders</span>
                                </div>
                                <div className="flex items-start group">
                                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-4 mt-0.5 group-hover:scale-110 transition-transform duration-200">
                                        <Check className="size-3 text-white" />
                                    </div>
                                    <span className="text-gray-700 font-medium">Full walkthrough tailored to your site</span>
                                </div>
                                <div className="flex items-start group">
                                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-4 mt-0.5 group-hover:scale-110 transition-transform duration-200">
                                        <Check className="size-3 text-white" />
                                    </div>
                                    <span className="text-gray-700 font-medium">Try it hands-on to see if it fits your needs</span>
                                </div>
                                <div className="flex items-start group">
                                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-4 mt-0.5 group-hover:scale-110 transition-transform duration-200">
                                        <Check className="size-3 text-white" />
                                    </div>
                                    <span className="text-gray-700 font-medium">We&apos;ll build what you need if it&apos;s missing</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Link href="/signup">
                                    <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 text-lg font-semibold transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 rounded-xl">
                                        Request Early Access
                                    </Button>
                                </Link>
                                <p className="text-sm text-gray-500 text-center leading-relaxed">
                                    <span className="font-medium">Access granted after account review</span> • Usually within 24 hours
                                </p>
                            </div>
                        </div>
                    </AnimationContainer>
                </div>

                {/* FAQ Section */}
                <AnimationContainer delay={0.3} className="mt-16 text-center">
                    <div className="bg-blue-50 rounded-2xl p-8 max-w-4xl mx-auto">
                        <h3 className="text-xl font-semibold mb-4">How does early access work?</h3>
                        <p className="text-gray-700 leading-relaxed">
                            Request access and one of our founders will hop on a call with you for a full walkthrough of UnveilSEO
                            tailored to your specific website. Try it hands-on to see if it&apos;s a great fit for your needs.
                        </p>
                        <p className="text-gray-700 leading-relaxed mt-4">
                            If it&apos;s not quite right yet, just tell us what would make it perfect for you - and we&apos;ll build it!
                            Questions? Email us at{" "}
                            <a href="mailto:hello@unveilseo.com" className="text-blue-600 hover:text-blue-700 font-medium">
                                hello@unveilseo.com
                            </a>
                        </p>
                    </div>
                </AnimationContainer>
            </div>
        </section>
    );
};

export default Pricing;