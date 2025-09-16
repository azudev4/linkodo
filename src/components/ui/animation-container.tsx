'use client';

import React from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimationContainerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  reverse?: boolean;
  simple?: boolean;
}

export const AnimationContainer = ({
  children,
  className,
  delay = 0.1,
  reverse = false,
  simple = false
}: AnimationContainerProps) => {
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