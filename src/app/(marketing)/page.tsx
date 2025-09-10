import Hero from '@/components/marketing/Hero';
import { Features } from '@/components/marketing/Features';
import Testimonials from '@/components/marketing/Testimonials';
import FAQ from '@/components/marketing/FAQ';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
      </div>
      <Testimonials />
      <FAQ />
    </main>
  );
}