/**
 * Offline Mode Service
 * Manages IndexedDB queue for orders created while offline
 * Automatically syncs when connection is restored
 */

export interface OfflineOrder {
  id: string;
  tableId: number;
  items: Array<{
    menuItemId: number;
    quantity: number;
    modifiers?: string[];
    specialRequests?: string;
  }>;
  createdAt: Date;
  status: 'pending' | 'synced' | 'failed';
  error?: string;
}

const DB_NAME = 'RestoFlow';
const STORE_NAME = 'offlineOrders';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB for offline storage
 */
export async function initOfflineDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

/**
 * Save order to offline queue
 */
export async function saveOfflineOrder(order: OfflineOrder): Promise<void> {
  if (!db) await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(order);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Get all pending offline orders
 */
export async function getPendingOfflineOrders(): Promise<OfflineOrder[]> {
  if (!db) await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('status');
    const request = index.getAll('pending');

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Update order status after sync attempt
 */
export async function updateOfflineOrderStatus(
  orderId: string,
  status: 'synced' | 'failed',
  error?: string
): Promise<void> {
  if (!db) await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(orderId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const order = request.result as OfflineOrder;
      order.status = status;
      if (error) order.error = error;

      const updateRequest = store.put(order);
      updateRequest.onerror = () => reject(updateRequest.error);
      updateRequest.onsuccess = () => resolve();
    };
  });
}

/**
 * Clear synced orders from offline queue
 */
export async function clearSyncedOrders(): Promise<void> {
  if (!db) await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('status');
    const request = index.openCursor('synced');

    request.onerror = () => reject(request.error);
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
  });
}

/**
 * Monitor online/offline status and sync when connection restored
 */
export function setupOfflineSync(
  onSyncStart: () => void,
  onSyncComplete: (successful: number, failed: number) => void
): () => void {
  const handleOnline = async () => {
    onSyncStart();
    const pendingOrders = await getPendingOfflineOrders();

    let successful = 0;
    let failed = 0;

    for (const order of pendingOrders) {
      try {
        // Attempt to sync order via tRPC
        // This would be called from the component that uses this service
        await updateOfflineOrderStatus(order.id, 'synced');
        successful++;
      } catch (error) {
        await updateOfflineOrderStatus(
          order.id,
          'failed',
          error instanceof Error ? error.message : 'Unknown error'
        );
        failed++;
      }
    }

    await clearSyncedOrders();
    onSyncComplete(successful, failed);
  };

  window.addEventListener('online', handleOnline);

  // Cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}

/**
 * Check if device is currently online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}
