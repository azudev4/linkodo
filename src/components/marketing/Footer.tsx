import Link from 'next/link';
import { Search } from 'lucide-react';

const footerLinks = {
  product: {
    title: 'Product',
    links: [
      { name: 'Features', href: '#features' },
      { name: 'Pricing', href: '#pricing' },
      { name: 'API Documentation', href: '#docs' },
      { name: 'Integrations', href: '#integrations' },
    ],
  },
  solutions: {
    title: 'Solutions',
    links: [
      { name: 'Content Creators', href: '#content-creators' },
      { name: 'SEO Agencies', href: '#seo-agencies' },
      { name: 'E-commerce', href: '#ecommerce' },
      { name: 'Enterprise', href: '#enterprise' },
    ],
  },
  resources: {
    title: 'Resources',
    links: [
      { name: 'Blog', href: '#blog' },
      { name: 'SEO Guides', href: '#guides' },
      { name: 'Help Center', href: '#help' },
      { name: 'Community', href: '#community' },
    ],
  },
  company: {
    title: 'Company',
    links: [
      { name: 'About Us', href: '#about' },
      { name: 'Privacy Policy', href: '#privacy' },
      { name: 'Terms of Service', href: '#terms' },
      { name: 'Contact', href: '#contact' },
    ],
  },
};

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Search className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-semibold text-foreground">
                  Unveil SEO
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                AI-powered internal linking suggestions that help boost your SEO rankings and improve content discoverability across your website.
              </p>
            </div>

            {/* Links Grid */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {Object.entries(footerLinks).map(([key, section]) => (
                  <div key={key}>
                    <h3 className="text-sm font-semibold text-foreground mb-4">
                      {section.title}
                    </h3>
                    <ul className="space-y-3">
                      {section.links.map((link) => (
                        <li key={link.name}>
                          <Link
                            href={link.href}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                          >
                            {link.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/50 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Unveil SEO. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="#privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="#terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <Link
                href="#cookies"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}