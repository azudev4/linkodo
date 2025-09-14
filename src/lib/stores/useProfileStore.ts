import React from 'react';
import { createPersistedStore, ErrorState, createErrorSlice } from './core';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'default' | 'early_access' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface ProfileState extends ErrorState {
  profile: UserProfile | null;
  isLoading: boolean;
  lastFetch: number;
  
  // Internal actions (components should NOT call these directly)
  _fetchProfile: (force?: boolean) => Promise<void>;
  
  // Public actions
  refresh: () => Promise<void>;
  reset: () => void;
  
  // Getters
  hasRole: (role: 'default' | 'early_access' | 'admin') => boolean;
  hasAccess: (requiredRoles: string[]) => boolean;
  isStale: () => boolean;
}

// Cache TTL - 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

// Global state to prevent multiple simultaneous requests
let isCurrentlyFetching = false;
let fetchPromise: Promise<void> | null = null;

export const useProfileStore = createPersistedStore<ProfileState>(
  'user-profile',
  (set, get) => ({
    ...createErrorSlice(set),
    profile: null,
    isLoading: false,
    lastFetch: 0,
    
    // INTERNAL fetch function
    _fetchProfile: async (force = false) => {
      if (!force && !get().isStale()) {
        return;
      }
      
      // Prevent multiple simultaneous fetches
      if (isCurrentlyFetching && fetchPromise) {
        return fetchPromise;
      }
      
      isCurrentlyFetching = true;
      
      fetchPromise = (async () => {
        await Promise.resolve();
        set(state => ({ ...state, isLoading: true, error: null }));
        
        try {
          const response = await fetch('/api/user/profile', { 
            credentials: 'include' 
          });
          
          // If not authenticated, clear profile but don't cache (so it retries)
          if (response.status === 401 || response.status === 403) {
            set(state => ({
              ...state,
              profile: null,
              isLoading: false,
              lastFetch: 0, // Don't cache auth failures - keep retrying
              error: null
            }));
            return;
          }

          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch profile');
          }
          
          set(state => ({
            ...state,
            profile: data.profile,
            isLoading: false,
            lastFetch: Date.now(),
            error: null
          }));
          
        } catch (error) {
          console.error('Profile fetch error:', error);
          set(state => ({
            ...state,
            error: error instanceof Error ? error.message : 'Failed to fetch profile',
            isLoading: false
          }));
        } finally {
          isCurrentlyFetching = false;
          fetchPromise = null;
        }
      })();
      
      return fetchPromise;
    },
    
    // PUBLIC: Check if user has specific role
    hasRole: (role: 'default' | 'early_access' | 'admin') => {
      const state = get();
      if (state.isStale()) {
        state._fetchProfile();
      }
      return state.profile?.role === role;
    },
    
    // PUBLIC: Check if user has access (any of the required roles)
    hasAccess: (requiredRoles: string[]) => {
      const state = get();
      if (state.isStale()) {
        state._fetchProfile();
      }
      if (!state.profile) return false;
      return requiredRoles.includes(state.profile.role);
    },
    
    // UTILITY: Check if data is stale
    isStale: () => {
      const { lastFetch } = get();
      if (lastFetch === 0) return true;
      return (Date.now() - lastFetch) > CACHE_TTL;
    },
    
    // PUBLIC: Force refresh
    refresh: async () => {
      return get()._fetchProfile(true);
    },
    
    // PUBLIC: Reset store
    reset: () => {
      isCurrentlyFetching = false;
      fetchPromise = null;
      
      set(state => {
        state.profile = null;
        state.lastFetch = 0;
        state.isLoading = false;
        state.error = null;
      });
    }
  }),
  {
    partialize: (state) => ({
      profile: state.profile,
      lastFetch: state.lastFetch
    }) as unknown as ProfileState,
    
    onRehydrateStorage: () => (state) => {
      if (state && state.isStale()) {
        setTimeout(() => {
          state._fetchProfile();
        }, 100);
      }
    }
  }
);

// Hook to access profile data
export function useProfile() {
  const store = useProfileStore();
  
  React.useEffect(() => {
    let mounted = true;
    
    const initializeProfile = async () => {
      // Check if we might be authenticated
      const checkAuth = () => {
        if (typeof window === 'undefined') return false;
        
        // Check for auth cookies
        const cookies = document.cookie;
        const hasAuthCookie = cookies.includes('sb-access-token');
        
        return hasAuthCookie;
      };
      
      if (store.isStale() && checkAuth() && mounted) {
        await store._fetchProfile();
      }
    };
    
    initializeProfile();
    
    return () => {
      mounted = false;
    };
  }, [store]);
  
  return {
    // Data
    profile: store.profile,
    isLoading: store.isLoading,
    error: store.error,
    
    // Actions
    refresh: store.refresh,
    reset: store.reset,
    
    // Getters
    hasRole: store.hasRole,
    hasAccess: store.hasAccess,
    isStale: store.isStale
  };
}