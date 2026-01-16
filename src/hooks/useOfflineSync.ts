import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PendingSheetKey = 'carga' | 'descarga' | 'apontamento_pedreira' | 'apontamento_pipa' | 'mov_cal';

export interface PendingItem {
  id: string;
  sheetKey: PendingSheetKey;
  sheetName: string; // nome real da aba (ex: "Carga")
  rowData: string[]; // linha já formatada na ordem correta
  createdAt: string;
  status: 'pending' | 'syncing' | 'error' | 'synced';
  error?: string;
  retryCount: number;
}

const STORAGE_KEY = 'apropriapp_offline_pending_v2';

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

  const addPendingAppend = useCallback((args: {
    sheetKey: PendingSheetKey;
    sheetName: string;
    rowData: string[];
  }) => {
    const newItem: PendingItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      sheetKey: args.sheetKey,
      sheetName: args.sheetName,
      rowData: args.rowData,
      createdAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    };

    setPendingItems((prev) => [...prev, newItem]);
    return newItem.id;
  }, []);

  const syncItem = useCallback(async (itemId: string) => {
    const item = pendingItems.find((i) => i.id === itemId);
    if (!item) return;

    setPendingItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, status: 'syncing' } : i)));

    try {
      const { error } = await supabase.functions.invoke('google-sheets-append', {
        body: {
          action: 'append',
          sheetName: item.sheetName,
          rowData: item.rowData,
        },
      });

      if (error) throw error;

      setPendingItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setPendingItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? { ...i, status: 'error', error: errorMessage, retryCount: i.retryCount + 1 }
            : i
        )
      );
      throw error;
    }
  }, [pendingItems]);

  const syncAll = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    const pendingToSync = pendingItems.filter((i) => i.status === 'pending' || i.status === 'error');

    for (const item of pendingToSync) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await syncItem(item.id);
      } catch (error) {
        console.error(`Error syncing item ${item.id}:`, error);
      }
    }

    setIsSyncing(false);
  }, [pendingItems, isOnline, isSyncing, syncItem]);

  const removeItem = useCallback((itemId: string) => {
    setPendingItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const clearAll = useCallback(() => {
    setPendingItems([]);
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && pendingItems.some((i) => i.status === 'pending' || i.status === 'error')) {
      const timer = setTimeout(() => {
        syncAll();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingItems, syncAll]);

  return {
    pendingItems,
    isOnline,
    isSyncing,
    addPendingAppend,
    syncItem,
    syncAll,
    removeItem,
    clearAll,
  };
}

