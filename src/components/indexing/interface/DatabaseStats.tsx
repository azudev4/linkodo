import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { StatCard } from './StatCard';
import { StatCardSkeleton, ProgressBarSkeleton } from '@/components/ui/skeleton';

interface DatabaseStats {
  totalPages: number;
  pagesWithEmbeddings: number;
  pagesWithoutEmbeddings: number;
  embeddingProgress: number;
  lastSync: string | null;
}

interface DatabaseStatsProps {
  stats: DatabaseStats | null;
  onRefresh: () => void;
  isLoading?: boolean;
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function DatabaseStats({ stats, onRefresh, isLoading = false }: DatabaseStatsProps) {
  const handleRefresh = async () => {
    await onRefresh();
  };
  return (
    <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center space-x-3">
            <div className="rounded-full bg-blue-100 p-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xl font-semibold text-blue-600">Database Status</span>
          </CardTitle>
          <CardDescription>
            Current indexing and embedding status
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
        </Button>
      </CardHeader>
      
      <CardContent className="min-h-[280px]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats && !isLoading ? (
            <>
              <StatCard
                value={stats.totalPages}
                label="Pages Indexed"
                sublabel={`Last sync: ${formatDate(stats.lastSync)}`}
                colorScheme="blue"
              />
              <StatCard
                value={stats.pagesWithEmbeddings}
                label="Embeddings Generated"
                sublabel={`${stats.embeddingProgress}% complete`}
                colorScheme="green"
              />
              <StatCard
                value={stats.pagesWithoutEmbeddings}
                label="Pending Embeddings"
                sublabel="Ready for processing"
                colorScheme="orange"
              />
            </>
          ) : (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          )}
        </div>

        {/* Enhanced Embedding Progress Bar */}
        <div className="h-[120px] flex items-stretch">
          {stats && !isLoading ? (
            stats.totalPages > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 space-y-3 p-4 rounded-xl bg-blue-50/30 border border-blue-100 w-full"
              >
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-blue-700">Embedding Progress</span>
                    <div className="text-xs text-blue-600/70">
                      {stats.pagesWithEmbeddings.toLocaleString()} of {stats.totalPages.toLocaleString()} pages processed
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.embeddingProgress}%
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.embeddingProgress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                    />
                  </div>
                  <div 
                    className="absolute -bottom-1 left-0 h-4 w-full opacity-20 blur-sm rounded-full"
                    style={{
                      background: `linear-gradient(90deg, 
                        transparent 0%, 
                        rgba(37, 99, 235, 0.5) ${stats.embeddingProgress}%, 
                        transparent ${stats.embeddingProgress + 5}%
                      )`
                    }}
                  />
                </div>
              </motion.div>
            )
          ) : (
            <ProgressBarSkeleton />
          )}
        </div>
      </CardContent>
    </Card>
  );
} 