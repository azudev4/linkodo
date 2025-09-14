"use client";

import React from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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

const FAQS = [
    {
        question: "How accurate are the internal linking suggestions?",
        answer: "Our AI analyzes your content contextually and semantically, providing 90%+ accurate link suggestions. The system understands topical relationships and content hierarchies to suggest the most relevant connections.",
    },
    {
        question: "Can I customize which pages get linked?",
        answer: "Yes, you have full control. You can exclude specific pages, prioritize certain content types, and set custom linking rules. The system respects your content strategy while providing intelligent suggestions.",
    },
    {
        question: "Does this work with my existing CMS?",
        answer: "We integrate with major CMS platforms including WordPress, Drupal, and custom solutions via API. The system works with your existing content structure without requiring major changes.",
    },
    {
        question: "How quickly will I see SEO improvements?",
        answer: "Most users see initial improvements in 2-4 weeks, with significant gains in 2-3 months. The timeline depends on your content volume, current linking structure, and search engine crawl frequency.",
    },
    {
        question: "What about link equity and SEO best practices?",
        answer: "Our algorithm follows Google's best practices for internal linking, distributing link equity effectively and avoiding over-optimization. We help strengthen your site's authority distribution naturally."
    }
];

const FAQ = () => {
    return (
        <div className="py-20 lg:py-32">
            <div className="max-w-7xl mx-auto px-4">
                <AnimationContainer className="flex flex-col items-center text-center gap-4 mb-12">
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold !leading-tight">
                        Still have{" "}
                        <span className="bg-gradient-to-r from-blue-600 to-blue-800 text-transparent bg-clip-text">
                            questions?
                        </span>
                    </h2>
                    <p className="text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
                        Find answers to common questions about intelligent internal linking
                    </p>
                </AnimationContainer>

                <AnimationContainer delay={0.15} className="max-w-3xl mx-auto">
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {FAQS.map((faq, index) => (
                            <AccordionItem
                                key={index}
                                value={`item-${index}`}
                                className="border border-border bg-white rounded-lg px-6 shadow-sm"
                            >
                                <AccordionTrigger className="hover:no-underline py-6 text-base md:text-lg text-left font-medium">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground text-left pb-6">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </AnimationContainer>
            </div>
        </div>
    );
};

export default FAQ;