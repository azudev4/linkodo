import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Zap, Trash2, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteEmbeddings = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/reset-embeddings', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to delete embeddings');
      }

      window.location.reload();
    } catch (error) {
      console.error('Error deleting embeddings:', error);
      alert('Failed to delete embeddings. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
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
          {stats ? (
            <>
              {stats.pagesWithoutEmbeddings > 0 ? (
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/5 via-purple-500/10 to-pink-500/5 border border-purple-100 shadow-sm">
                  <div className="absolute inset-0 bg-grid-white/10" />
                  <div className="relative p-6">
                    <div className="flex items-start space-x-4">
                      <div className="rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-3 shadow-lg">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-lg font-semibold text-purple-900 mb-1">
                          {stats.pagesWithoutEmbeddings.toLocaleString()} pages need embeddings
                        </div>
                        <div className="text-purple-700 leading-relaxed">
                          Generate AI embeddings to enable semantic link matching and improve content discovery
                        </div>
                        <div className="mt-4 flex items-center text-sm text-purple-600">
                          <ArrowRight className="w-4 h-4 mr-1" />
                          <span>Click generate below to start</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : stats.pagesWithEmbeddings === 0 ? (
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200 shadow-sm">
                  <div className="absolute inset-0 bg-grid-white/10" />
                  <div className="relative p-8 text-center">
                    <div className="inline-flex rounded-full bg-gradient-to-br from-gray-100 to-gray-200 p-4 shadow-inner mb-4">
                      <Sparkles className="w-8 h-8 text-gray-500" />
                    </div>
                    <div className="text-lg font-medium text-gray-700 mb-2">
                      No Pages Available
                    </div>
                    <div className="text-gray-500 max-w-sm mx-auto leading-relaxed">
                      Sync your content first to start generating AI embeddings for semantic link matching
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500/5 via-emerald-500/10 to-teal-500/5 border border-green-100 shadow-sm">
                  <div className="absolute inset-0 bg-grid-white/10" />
                  <div className="relative p-8 text-center">
                    <div className="inline-flex rounded-full bg-gradient-to-br from-green-500 to-emerald-500 p-4 shadow-lg mb-4">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-lg font-medium text-green-800 mb-2">
                      All Pages Have Embeddings
                    </div>
                    <div className="text-green-600 max-w-sm mx-auto leading-relaxed">
                      Your content is ready for semantic matching and intelligent link suggestions
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/5 via-purple-500/10 to-pink-500/5 border border-purple-100 shadow-sm">
              <div className="absolute inset-0 bg-grid-white/10" />
              <div className="relative p-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-3 flex-1">
                    <Skeleton className="h-6 w-[250px]" />
                    <Skeleton className="h-4 w-[300px] opacity-70" />
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
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/5 via-purple-500/10 to-pink-500/5 border-2 border-purple-200 shadow-sm"
            >
              <div className="absolute inset-0 bg-grid-white/10" />
              <div className="relative p-6 space-y-4">
                <div className="flex items-center text-purple-700">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  <span className="font-medium">Generating AI embeddings...</span>
                </div>
                <Progress value={progress} className="h-2 w-full" />
                <div className="text-sm text-purple-600">
                  {Math.round(progress)}% complete
                </div>
              </div>
            </motion.div>
          )}

          {/* Button Group */}
          <div className="flex gap-2">
            {/* Generate Button */}
            {stats ? (
              <Button
                onClick={onGenerate}
                disabled={stats.pagesWithoutEmbeddings === 0 || isGenerating || isDeleting}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
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
                      {stats.pagesWithoutEmbeddings > 0 
                        ? `Generate ${stats.pagesWithoutEmbeddings} Embeddings`
                        : 'All Embeddings Generated'
                      }
                    </span>
                  </>
                )}
              </Button>
            ) : (
              <Skeleton className="flex-1 h-12 rounded-xl" />
            )}

            {/* Delete Button */}
            {stats && stats.pagesWithEmbeddings > 0 && (
              <Button
                onClick={() => setShowDeleteDialog(true)}
                disabled={isGenerating || isDeleting}
                variant="destructive"
                className="h-12 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                size="lg"
              >
                {isDeleting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete All Embeddings
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete all AI embeddings from your database. This cannot be undone.
              You will need to regenerate embeddings for all pages again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEmbeddings}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete All Embeddings'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 