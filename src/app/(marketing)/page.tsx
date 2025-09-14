import Hero from '@/components/marketing/Hero';
import { Features } from '@/components/marketing/Features';
import Pricing from '@/components/marketing/Pricing';
import FAQ from '@/components/marketing/FAQ';
import CTA from '@/components/marketing/CTA';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <section id="features">
        <Features />
      </section>
      <section id="pricing">
        <Pricing />
      </section>
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
      </div>
      <section id="faq">
        <FAQ />
      </section>
      <CTA />
    </main>
  );
}