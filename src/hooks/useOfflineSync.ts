import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PendingItem {
  id: string;
  type: 'carga' | 'descarga' | 'apontamento_pedreira' | 'apontamento_pipa' | 'mov_cal';
  data: Record<string, unknown>;
  createdAt: string;
  status: 'pending' | 'syncing' | 'error' | 'synced';
  error?: string;
  retryCount: number;
}

const STORAGE_KEY = 'apropriapp_offline_pending';

export function useOfflineSync() {
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load pending items from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const items = JSON.parse(stored);
        setPendingItems(items);
      } catch (e) {
        console.error('Error loading offline items:', e);
      }
    }
  }, []);

  // Save pending items to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingItems));
  }, [pendingItems]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add new pending item
  const addPendingItem = useCallback((type: PendingItem['type'], data: Record<string, unknown>) => {
    const newItem: PendingItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      createdAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    };

    setPendingItems(prev => [...prev, newItem]);
    return newItem.id;
  }, []);

  // Sync single item
  const syncItem = useCallback(async (itemId: string) => {
    const item = pendingItems.find(i => i.id === itemId);
    if (!item) return;

    // Update status to syncing
    setPendingItems(prev => prev.map(i => 
      i.id === itemId ? { ...i, status: 'syncing' as const } : i
    ));

    try {
      // Call the edge function to append
      const { error } = await supabase.functions.invoke('google-sheets-append', {
        body: {
          action: 'append',
          sheetName: item.type,
          rowData: item.data,
        },
      });

      if (error) throw error;

      // Remove synced item
      setPendingItems(prev => prev.filter(i => i.id !== itemId));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      // Mark as error
      setPendingItems(prev => prev.map(i => 
        i.id === itemId ? { 
          ...i, 
          status: 'error' as const, 
          error: errorMessage,
          retryCount: i.retryCount + 1 
        } : i
      ));
      throw error;
    }
  }, [pendingItems]);

  // Sync all pending items
  const syncAll = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    const pendingToSync = pendingItems.filter(i => i.status === 'pending' || i.status === 'error');

    for (const item of pendingToSync) {
      try {
        await syncItem(item.id);
      } catch (error) {
        console.error(`Error syncing item ${item.id}:`, error);
      }
    }

    setIsSyncing(false);
  }, [pendingItems, isOnline, isSyncing, syncItem]);

  // Remove item
  const removeItem = useCallback((itemId: string) => {
    setPendingItems(prev => prev.filter(i => i.id !== itemId));
  }, []);

  // Clear all items
  const clearAll = useCallback(() => {
    setPendingItems([]);
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && pendingItems.some(i => i.status === 'pending')) {
      // Small delay to ensure connection is stable
      const timer = setTimeout(() => {
        syncAll();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingItems, syncAll]);

  return {
    pendingItems,
    isOnline,
    isSyncing,
    addPendingItem,
    syncItem,
    syncAll,
    removeItem,
    clearAll,
  };
}
