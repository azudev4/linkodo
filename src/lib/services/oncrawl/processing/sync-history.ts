// src/lib/services/oncrawl/sync-history.ts
import { supabase } from '@/lib/db/client';
import { OnCrawlClient } from '../client';

/**
 * Create sync history record
 */
export async function createSyncHistoryRecord(
  projectId: string,
  projectName: string,
  crawlId: string,
  crawlName: string | null
): Promise<number> {
  console.log(`📝 Creating sync history record for project "${projectName}"...`);
  
  const { data, error } = await supabase
    .from('sync_history')
    .insert({
      project_id: projectId,
      project_name: projectName,
      crawl_id: crawlId,
      crawl_name: crawlName || 'Unnamed crawl',
      synced_at: new Date().toISOString(),
      pages_added: 0,
      pages_updated: 0,
      pages_unchanged: 0,
      pages_removed: 0,
      pages_failed: 0,
      duration_ms: 0
    })
    .select('id')
    .single();

  if (error) {
    console.error(`❌ Failed to create sync history record:`, error);
    throw new Error(`Failed to create sync history record: ${error.message}`);
  }

  console.log(`📝 ✅ Created sync history record with ID: ${data.id}`);
  return data.id;
}

/**
 * Update sync history record with final results
 */
export async function updateSyncHistoryRecord(
  syncHistoryId: number,
  result: { added: number; updated: number; unchanged: number; removed: number; failed: number },
  durationMs: number
): Promise<void> {
  console.log(`📝 Updating sync history record ${syncHistoryId} with final results...`);
  
  const { error } = await supabase
    .from('sync_history')
    .update({
      pages_added: result.added,
      pages_updated: result.updated,
      pages_unchanged: result.unchanged,
      pages_removed: result.removed,
      pages_failed: result.failed,
      duration_ms: durationMs
    })
    .eq('id', syncHistoryId);

  if (error) {
    console.error(`❌ Failed to update sync history record:`, error);
  } else {
    console.log(`📝 ✅ Successfully updated sync history record ${syncHistoryId}`);
  }
}

/**
 * Get project name from OnCrawl API or use fallback
 */
export async function getProjectName(projectId: string): Promise<string> {
  try {
    const client = new OnCrawlClient(process.env.ONCRAWL_API_TOKEN!);
    const projects = await client.getProjects();
    const project = projects.find(p => p.id === projectId);
    return project?.name || `Project ${projectId}`;
  } catch {
    console.warn(`⚠️  Could not fetch project name, using fallback`);
    return `Project ${projectId}`;
  }
}