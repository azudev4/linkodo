// src/hooks/useStatsCache.ts
import { useState, useEffect, useCallback, useRef } from 'react';

interface DatabaseStats {
  totalPages: number;
  pagesWithEmbeddings: number;
  pagesWithoutEmbeddings: number;
  embeddingProgress: number;
  lastSync: string | null;
}

interface CachedStats {
  data: DatabaseStats | null;
  timestamp: number;
}

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const CACHE_KEY = 'database_stats_cache';

export function useStatsCache() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  // Get cached data from localStorage
  const getCachedStats = useCallback((): CachedStats | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const parsedCache: CachedStats = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - parsedCache.timestamp > CACHE_DURATION) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      
      return parsedCache;
    } catch (error) {
      console.error('Error reading cache:', error);
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  }, []);

  // Save data to cache
  const setCachedStats = useCallback((data: DatabaseStats) => {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheData: CachedStats = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }, []);

  // Fetch stats from API
  const fetchStats = useCallback(async (forceRefresh = false) => {
    // Only set loading if it's a force refresh or first load
    if (forceRefresh || !hasInitialized.current) {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedData = getCachedStats();
        if (cachedData) {
          setStats(cachedData.data);
          hasInitialized.current = true;
          setIsLoading(false);
          return cachedData.data;
        }
      }

      // Fetch from API
      const response = await fetch('/api/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
        setCachedStats(data.stats);
        hasInitialized.current = true;
        return data.stats;
      } else {
        throw new Error(data.error || 'Failed to fetch stats');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading stats';
      setError(errorMessage);
      console.error('Error fetching stats:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getCachedStats, setCachedStats]);

  // Refresh stats (force refresh)
  const refreshStats = useCallback(async () => {
    return await fetchStats(true);
  }, [fetchStats]);

  // Clear cache
  const clearCache = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
    }
  }, []);

  // Get cache info
  const getCacheInfo = useCallback(() => {
    const cachedData = getCachedStats();
    if (!cachedData) return null;
    
    const age = Date.now() - cachedData.timestamp;
    const remainingTime = Math.max(0, CACHE_DURATION - age);
    
    return {
      isFromCache: true,
      cacheAge: age,
      remainingTime,
      expiresAt: new Date(cachedData.timestamp + CACHE_DURATION)
    };
  }, [getCachedStats]);

  // Load initial data
  useEffect(() => {
    if (!hasInitialized.current) {
      fetchStats();
    }
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
    refreshStats,
    clearCache,
    getCacheInfo,
    cacheDuration: CACHE_DURATION
  };
}