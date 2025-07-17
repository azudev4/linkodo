import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { motion } from 'framer-motion';
import { Database, Download, Loader2, FileText, Zap as ZapIcon, HelpCircle, Edit3, AlertTriangle, Mail } from 'lucide-react';
import { SyncMode } from '@/lib/services/oncrawl/types';
import { useState } from 'react';

interface OnCrawlProject {
  id: string;
  name: string;
  url: string;
  workspace_id: string;
  last_crawl_id?: string;
  tokenSource?: string;
}

interface OnCrawlSyncProps {
  projects: OnCrawlProject[];
  selectedProject: string;
  onProjectSelect: (id: string) => void;
  onSync: (mode: SyncMode) => Promise<void>;
  onDownload: () => Promise<void>;
  isSyncing: boolean;
  isDownloading: boolean;
  syncProgress: number;
}

export function OnCrawlSync({
  projects,
  selectedProject,
  onProjectSelect,
  onSync,
  onDownload,
  isSyncing,
  isDownloading,
  syncProgress
}: OnCrawlSyncProps) {
  const [showWarning, setShowWarning] = useState(true);
  
  return (
    <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 relative">
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          <div className="rounded-full bg-green-100 p-2">
            <Database className="w-5 h-5 text-green-600" />
          </div>
          <span className="text-xl font-semibold text-green-600">OnCrawl Sync</span>
        </CardTitle>
        <CardDescription>
          Import data from the latest accessible crawl in your OnCrawl project
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Project Selection */}
        <div className="space-y-2">
          <Select value={selectedProject} onValueChange={onProjectSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a project to sync" />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-[300px]">
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{project.name}</span>
                    {project.tokenSource && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({project.tokenSource === 'token2' ? 'Token 2' : 'Token 1'})
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sync Progress */}
        {isSyncing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 p-4 rounded-xl bg-blue-50 border-2 border-blue-100"
          >
            <div className="flex items-center text-blue-700">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span className="font-medium">Syncing data from OnCrawl...</span>
            </div>
            <Progress value={syncProgress} className="w-full" />
          </motion.div>
        )}

        {/* Sync Actions */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <Button
              onClick={() => onSync(SyncMode.URL_ONLY)}
              disabled={!selectedProject || isSyncing}
              className="flex-1 h-14 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 text-lg"
              size="lg"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  <span className="font-medium">Syncing...</span>
                </>
              ) : (
                <>
                  <ZapIcon className="w-6 h-6 mr-2" />
                  <span className="font-medium">Quick Sync</span>
                </>
              )}
            </Button>

            <Button
              onClick={() => onSync(SyncMode.CONTENT)}
              disabled={!selectedProject || isSyncing}
              className="flex-1 h-14 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
              size="lg"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  <span className="font-medium">Syncing...</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-5 h-5 mr-2" />
                  <span className="font-medium">Content Sync</span>
                </>
              )}
            </Button>

            <Button
              onClick={() => onSync(SyncMode.FULL)}
              disabled={!selectedProject || isSyncing}
              className="flex-1 h-14 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
              size="lg"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  <span className="font-medium">Syncing...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  <span className="font-medium">Full Sync</span>
                </>
              )}
            </Button>
          </div>

          <div className="text-sm text-gray-600 space-y-1.5 pl-1">
            <div className="flex items-center">
              <ZapIcon className="w-4 h-4 mr-1.5 text-emerald-500" />
              <span className="font-medium text-gray-700">Quick Sync:</span>
              <span className="ml-1.5">Adds new & removes old pages - <span className="font-medium text-emerald-600">10x faster</span></span>
            </div>
            <div className="flex items-center">
              <Edit3 className="w-4 h-4 mr-1.5 text-purple-500" />
              <span className="font-medium text-gray-700">Content Sync:</span>
              <span className="ml-1.5">Updates h1, title, meta (ignores metrics that change frequently)</span>
            </div>
            <div className="flex items-center">
              <Download className="w-4 h-4 mr-1.5 text-blue-500" />
              <span className="font-medium text-gray-700">Full Sync:</span>
              <span className="ml-1.5">Detects & updates all content/data changes</span>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div className="inline-flex ml-1.5 cursor-help">
                    <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </div>
                </HoverCardTrigger>
                <HoverCardContent 
                  align="start"
                  side="right"
                  sideOffset={10}
                  className="w-80"
                >
                  <div className="space-y-2">
                    <p className="text-sm font-medium">When to use Full Sync:</p>
                    <ul className="text-sm text-gray-500 list-disc pl-4 space-y-1">
                      <li>You&apos;ve updated page titles or meta descriptions</li>
                      <li>Content has changed significantly</li>
                      <li>You need fresh word count, depth or inrank values</li>
                    </ul>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </div>
        </div>

        {/* Download Options */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">Debug Export:</div>
          <div className="flex flex-col gap-3">
            <div className="min-h-[40px]">
              <Button
                onClick={onDownload}
                disabled={!selectedProject || isDownloading}
                variant="outline"
                className="flex-1 h-10 rounded-lg border-2 hover:bg-gray-50 hover:text-gray-600 hover:border-gray-200 transition-all duration-200"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="font-medium">Downloading...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="font-medium">Excel (.xlsx)</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Vercel Warning Overlay */}
      {showWarning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10"
        >
          <div className="bg-white/90 backdrop-blur-md rounded-xl border-2 border-amber-200 shadow-xl p-8 max-w-md mx-4">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-amber-100 p-3">
                  <AlertTriangle className="w-8 h-8 text-amber-600" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Vercel Function Limitations
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  This feature might not work properly with Vercel&apos;s function execution limitations. 
                  Large syncs may timeout or fail.
                </p>
              </div>
              
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => setShowWarning(false)}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium"
                >
                  I understand, proceed anyway
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.open('mailto:anthod.pro@gmail.com?subject=Vercel%20Function%20Help&body=Hi%2C%20I%20need%20help%20with%20Vercel%20function%20limitations%20for%20OnCrawl%20sync.', '_blank')}
                  className="w-full border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact for help
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-3">
                anthod.pro@gmail.com
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </Card>
  );
} 