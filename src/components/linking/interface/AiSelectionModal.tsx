'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Target, Info } from 'lucide-react';

interface AiSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (linkCount: number) => void;
  totalSuggestions: number;
}

export function AiSelectionModal({ 
  open, 
  onOpenChange, 
  onConfirm, 
  totalSuggestions 
}: AiSelectionModalProps) {
  const [selectionMethod, setSelectionMethod] = useState<'percentage' | 'count'>('percentage');
  const [linkPercentage, setLinkPercentage] = useState([2]);
  const [linkCount, setLinkCount] = useState(3);
  
  // Mock word count - would come from actual text analysis
  const estimatedWordCount = 800;
  const calculatedLinks = Math.round((linkPercentage[0] / 100) * estimatedWordCount / 100); // ~1 link per 100 words at 1%

  const handleConfirm = () => {
    const finalCount = selectionMethod === 'percentage' 
      ? Math.min(calculatedLinks, totalSuggestions)
      : Math.min(linkCount, totalSuggestions);
    
    onConfirm(finalCount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>AI Link Selection</span>
          </DialogTitle>
          <DialogDescription>
            Let AI choose the most contextually relevant links from {totalSuggestions} suggestions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Selection Method Toggle */}
          <div className="flex space-x-2">
            <Button
              variant={selectionMethod === 'percentage' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectionMethod('percentage')}
              className="flex-1"
            >
              <Target className="w-4 h-4 mr-1" />
              By Density
            </Button>
            <Button
              variant={selectionMethod === 'count' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectionMethod('count')}
              className="flex-1"
            >
              By Count
            </Button>
          </div>

          {/* Percentage Mode */}
          {selectionMethod === 'percentage' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label className="flex items-center justify-between">
                  <span>Link Density: {linkPercentage[0]}%</span>
                  <Badge variant="secondary" className="text-xs">
                    ~{calculatedLinks} links
                  </Badge>
                </Label>
                <Slider
                  value={linkPercentage}
                  onValueChange={setLinkPercentage}
                  max={5}
                  min={0.5}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0.5%</span>
                  <span>5%</span>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Recommended: 1-3%</p>
                    <p className="text-blue-700">
                      Based on your ~{estimatedWordCount} word content, {linkPercentage[0]}% density equals approximately {calculatedLinks} internal links.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Count Mode */}
          {selectionMethod === 'count' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="linkCount">Number of Links</Label>
                <Input
                  id="linkCount"
                  type="number"
                  min={1}
                  max={totalSuggestions}
                  value={linkCount}
                  onChange={(e) => setLinkCount(Math.min(parseInt(e.target.value) || 1, totalSuggestions))}
                />
                <p className="text-xs text-gray-500">
                  Maximum: {totalSuggestions} (total suggestions available)
                </p>
              </div>
            </motion.div>
          )}

          {/* Preview */}
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="text-sm">
              <p className="font-medium text-gray-900 mb-1">AI will select:</p>
              <p className="text-gray-700">
                <span className="font-semibold text-blue-600">
                  {selectionMethod === 'percentage' ? calculatedLinks : linkCount}
                </span>
                {' '}most contextually relevant links from {totalSuggestions} suggestions
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            <Sparkles className="w-4 h-4 mr-2" />
            Let AI Choose
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}