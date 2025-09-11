import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage, PersistOptions, PersistStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Draft, enableMapSet } from 'immer';

// Enable Map/Set support in Immer
enableMapSet();

// Base type for all stores
export type StoreStatus = 'idle' | 'loading' | 'error' | 'success';

// Global type for error state
export interface ErrorState {
  error: string | null;
  setError: (error: string | null) => void;
}

// Helper to create error slice
export const createErrorSlice = <T extends ErrorState>(
  set: (fn: (state: T) => void) => void
): ErrorState => ({
  error: null,
  setError: (error) => set((state) => { state.error = error; })
});

// Logger middleware (development only)
export const withLogger = <T extends object>(
  config: StateCreator<T, [], [], T>
): StateCreator<T, [], [], T> => 
  (set, get, api) => config(
    (...args) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Updating state:', args[0]);
      }
      return set(...(args as [T | Partial<T> | ((state: T) => T | Partial<T>), false?]));
    },
    get,
    api
  );

// Create a store with persistence and immer
export function createPersistedStore<T extends object>(
  name: string,
  config: (
    set: (fn: (state: Draft<T>) => void | T) => void,
    get: () => T,
    api: object
  ) => T,
  persistOptions?: Partial<PersistOptions<T>>
) {
  return create<T>()(
    persist(
      immer(
        (set, get, api) => config(set, get, api)
      ),
      {
        name,
        storage: createJSONStorage(() => localStorage) as PersistStorage<T>,
        ...persistOptions
      }
    )
  );
}

// Semaphore for async operations
export class AsyncLock {
  private locked: boolean = false;
  private queue: Array<() => void> = [];
  private timeout: number;

  constructor(timeout = 10000) {
    this.timeout = timeout;
  }

  async acquire(): Promise<() => void> {
    if (!this.locked) {
      this.locked = true;
      return this.createReleaseFn();
    }

    // Return a promise that resolves when lock is released
    return new Promise<() => void>((resolve, reject) => {
      // Add timeout to prevent deadlock
      const timeoutId = setTimeout(() => {
        reject(new Error('Lock acquisition timeout'));
      }, this.timeout);

      this.queue.push(() => {
        clearTimeout(timeoutId);
        this.locked = true;
        resolve(this.createReleaseFn());
      });
    });
  }

  private createReleaseFn(): () => void {
    return () => {
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        if (next) next();
      } else {
        this.locked = false;
      }
    };
  }
}