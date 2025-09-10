'use client';

import { BentoCard, BentoGrid, UNVEILSEO_CARDS } from '@/components/ui/bento-grid';

export function Features() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
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
        </div>

        {/* Bento Grid */}
        <BentoGrid className="py-8">
          {UNVEILSEO_CARDS.map((feature, idx) => (
            <BentoCard key={idx} {...feature} />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}