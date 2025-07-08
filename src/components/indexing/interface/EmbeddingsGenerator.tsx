import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Zap } from 'lucide-react';

interface DatabaseStats {
  totalPages: number;
  pagesWithEmbeddings: number;
  pagesWithoutEmbeddings: number;
  embeddingProgress: number;
  lastSync: string | null;
}

interface EmbeddingsGeneratorProps {
  stats: DatabaseStats | null;
  onGenerate: () => Promise<void>;
  isGenerating: boolean;
  progress: number;
}

export function EmbeddingsGenerator({
  stats,
  onGenerate,
  isGenerating,
  progress
}: EmbeddingsGeneratorProps) {
  return (
    <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          <div className="rounded-full bg-purple-100 p-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-xl font-semibold text-purple-600">AI Embeddings</span>
        </CardTitle>
        <CardDescription>
          Generate semantic embeddings for pages to enable intelligent link suggestions
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {stats && stats.pagesWithoutEmbeddings > 0 && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
            <div className="flex items-center space-x-3">
              <Zap className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium text-purple-900">
                  {stats.pagesWithoutEmbeddings.toLocaleString()} pages need embeddings
                </div>
                <div className="text-sm text-purple-700">
                  Generate embeddings to enable semantic link matching
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Embedding Progress */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 p-4 rounded-xl bg-purple-50 border-2 border-purple-100"
          >
            <div className="flex items-center text-purple-700">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span className="font-medium">Generating AI embeddings...</span>
            </div>
            <Progress value={progress} className="w-full" />
          </motion.div>
        )}

        {/* Generate Button */}
        <Button
          onClick={onGenerate}
          disabled={!stats || stats.pagesWithoutEmbeddings === 0 || isGenerating}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              <span className="font-medium">Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              <span className="font-medium">
                {stats && stats.pagesWithoutEmbeddings > 0 
                  ? `Generate ${stats.pagesWithoutEmbeddings} Embeddings`
                  : 'All Embeddings Generated'
                }
              </span>
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
} 