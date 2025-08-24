import Hero from '@/components/marketing/Hero';
import { Features } from '@/components/marketing/Features';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
    </main>
  );
}