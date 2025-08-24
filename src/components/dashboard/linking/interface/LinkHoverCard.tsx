import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Globe, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface OGData {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url: string;
}

interface LinkHoverCardProps {
  url: string;
  isVisible: boolean;
  position: { x: number; y: number };
}

export function LinkHoverCard({ url, isVisible, position }: LinkHoverCardProps) {
  const [ogData, setOgData] = useState<OGData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isVisible && url) {
      fetchOGData(url);
    }
  }, [isVisible, url]);

  const fetchOGData = async (targetUrl: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/og-data?url=${encodeURIComponent(targetUrl)}`);
      
      if (response.ok) {
        const data = await response.json();
        setOgData(data);
      } else {
        setOgData({
          url: targetUrl,
          title: new URL(targetUrl).hostname,
          description: targetUrl
        });
      }
    } catch {
      setOgData({
        url: targetUrl,
        title: new URL(targetUrl).hostname,
        description: targetUrl
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ duration: 0.2 }}
          className="fixed z-50 w-80"
          data-hover-card="true"
          style={{
            left: Math.min(position.x, window.innerWidth - 320),
            top: position.y + 8,
          }}
        >
          <Card className="shadow-xl border-2 overflow-hidden">
            {isLoading ? (
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            ) : ogData ? (
              <div>
                {/* OG Image */}
                {ogData.image && (
                  <div className="relative h-32 overflow-hidden">
                    <Image 
                      src={ogData.image} 
                      alt={ogData.title || 'Preview'}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <CardContent className="p-4 space-y-3">
                  {/* Title */}
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-gray-900 leading-tight line-clamp-2">
                      {ogData.title || getDomainFromUrl(ogData.url)}
                    </h3>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(ogData.url, '_blank', 'noopener,noreferrer');
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-400 hover:text-gray-600 flex-shrink-0" />
                    </button>
                  </div>
                  
                  {/* Description */}
                  {ogData.description && (
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {ogData.description}
                    </p>
                  )}
                  
                  {/* Site info */}
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Globe className="w-3 h-3" />
                    <span>{ogData.siteName || getDomainFromUrl(ogData.url)}</span>
                  </div>
                  
                  {/* URL */}
                  <div className="text-xs text-gray-400 truncate font-mono">
                    {ogData.url}
                  </div>
                </CardContent>
              </div>
            ) : (
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 text-gray-500">
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-sm">Failed to load preview</span>
                </div>
              </CardContent>
            )}
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}