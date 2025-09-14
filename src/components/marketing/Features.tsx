'use client';

import React from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BentoCard, BentoGrid, UNVEILSEO_CARDS } from '@/components/ui/bento-grid';

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

export function Features() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <AnimationContainer className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6">
            Powerful Features
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            Smart Internal Linking
            <br />
            <span className="text-transparent bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text">
              Made Simple
            </span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Unveil SEO uses AI to automatically discover, suggest, and track internal linking opportunities across your content.
            Boost your SEO and improve user experience effortlessly.
          </p>
        </AnimationContainer>

        {/* Bento Grid */}
        <AnimationContainer delay={0.15} className="py-8">
          <BentoGrid>
            {UNVEILSEO_CARDS.map((feature, idx) => (
              <BentoCard key={idx} {...feature} />
            ))}
          </BentoGrid>
        </AnimationContainer>
      </div>
    </section>
  );
}