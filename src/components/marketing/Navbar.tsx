'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Link as ScrollLink } from 'react-scroll';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu, X, Search } from 'lucide-react';

const navigation = [
  { name: 'Features', to: 'features' },
  { name: 'Pricing', to: 'pricing' },
  { name: 'FAQ', to: 'faq' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 w-full h-16 bg-background/80 backdrop-blur-sm z-50 border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <Search className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-semibold text-foreground">
                Unveil SEO
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navigation.map((item) => (
              <ScrollLink
                key={item.name}
                to={item.to}
                smooth={true}
                duration={500}
                offset={-80}
                className="relative text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-500 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-gray-900 after:transition-all after:duration-500 after:ease-out hover:after:w-full cursor-pointer"
              >
                {item.name}
              </ScrollLink>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden lg:block">
              <Button variant="outline" size="sm" className="transition-all duration-300 hover:scale-[1.02] hover:shadow-sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup" className="hidden lg:block">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
                Get Started
              </Button>
            </Link>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-muted transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            'lg:hidden overflow-hidden transition-all duration-300 ease-in-out',
            isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="py-4 space-y-4 border-t border-border/50">
            {navigation.map((item) => (
              <ScrollLink
                key={item.name}
                to={item.to}
                smooth={true}
                duration={500}
                offset={-80}
                className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-gray-700 hover:bg-muted rounded-md transition-colors cursor-pointer"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </ScrollLink>
            ))}
            <div className="flex flex-col gap-3 px-4 pt-4">
              <Link href="/login" onClick={() => setIsOpen(false)}>
                <Button variant="outline" size="sm" className="w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setIsOpen(false)}>
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}