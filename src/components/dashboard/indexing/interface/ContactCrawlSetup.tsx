import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Mail, Sparkles, Shield, Zap, RotateCcw } from 'lucide-react';

export function ContactCrawlSetup() {
  const handleContactUs = () => {
    const subject = encodeURIComponent('Custom Crawl & Link Setup Request');
    const body = encodeURIComponent(`Hi,

I'd like to set up custom crawling and link filtering for my website.

Website URL: [Your website URL]
Specific requirements: [Any specific filtering or crawling needs]

Looking forward to working with you!

Best regards`);
    
    window.location.href = `mailto:anthod.pro@gmail.com,mathias@decourt.fr?subject=${subject}&body=${body}`;
  };

  return (
    <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          <div className="rounded-full bg-blue-100 p-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-xl font-semibold text-blue-600">Custom Crawl Service</span>
        </CardTitle>
        <CardDescription>
          Weekly crawls with dedicated account management and curated link filtering
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Why We Handle It */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/5 via-blue-500/10 to-purple-500/5 border border-blue-100 shadow-sm">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative p-6">
            <div className="space-y-4">
              <div className="text-lg font-semibold text-blue-900 mb-3">
                Why we handle your crawls
              </div>
              
              <div className="grid gap-4">
                <div className="flex items-start space-x-3">
                  <div className="rounded-full bg-green-100 p-2 mt-0.5">
                    <Shield className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 mb-1">Quality Assurance</div>
                    <div className="text-gray-600 text-sm">Your dedicated account manager ensures internal linking quality by filtering and validating all discovered links</div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="rounded-full bg-blue-100 p-2 mt-0.5">
                    <Zap className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 mb-1">Optimized Performance</div>
                    <div className="text-gray-600 text-sm">Our crawlers are fine-tuned for your specific site structure and content type</div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="rounded-full bg-purple-100 p-2 mt-0.5">
                    <RotateCcw className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 mb-1">Weekly Crawl Requests</div>
                    <div className="text-gray-600 text-sm">Request up to one crawl per week to keep your data fresh as your content evolves</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={handleContactUs}
            className="w-full h-16 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-200 shadow-lg hover:shadow-xl text-lg font-semibold"
            size="lg"
          >
            <Mail className="w-6 h-6 mr-3" />
            Request a Crawl
          </Button>
        </motion.div>

        {/* Contact Info */}
        <div className="text-center space-y-2">
          <div className="text-sm text-gray-600">
            Your account manager will set up everything within 24 hours
          </div>
          <div className="text-xs text-gray-500">
            anthod.pro@gmail.com • mathias@decourt.fr
          </div>
        </div>
      </CardContent>
    </Card>
  );
}