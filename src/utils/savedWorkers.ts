export interface SavedWorkerRecord {
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  category: string;
  location: string;
  sellerPhoto?: string;
  productId?: string;
  productTitle?: string;
  savedAtIso: string;
}

const getStorageKey = (buyerKey?: string) => {
  const clean = (buyerKey || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `nawab_saved_workers_${clean}`;
};

export function loadSavedWorkers(buyerKey?: string): SavedWorkerRecord[] {
  try {
    const raw = localStorage.getItem(getStorageKey(buyerKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedWorkerRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveWorkersList(workers: SavedWorkerRecord[], buyerKey?: string): void {
  try {
    localStorage.setItem(getStorageKey(buyerKey), JSON.stringify(workers));
  } catch {
    // ignore storage quota errors
  }
}

export function isWorkerSaved(sellerId: string, buyerKey?: string): boolean {
  if (!sellerId) return false;
  return loadSavedWorkers(buyerKey).some((w) => w.sellerId === sellerId);
}

export function toggleSavedWorker(worker: Omit<SavedWorkerRecord, 'savedAtIso'>, buyerKey?: string): boolean {
  const existing = loadSavedWorkers(buyerKey);
  const exists = existing.some((w) => w.sellerId === worker.sellerId);
  if (exists) {
    saveWorkersList(
      existing.filter((w) => w.sellerId !== worker.sellerId),
      buyerKey
    );
    return false;
  }
  const next: SavedWorkerRecord[] = [
    { ...worker, savedAtIso: new Date().toISOString() },
    ...existing,
  ];
  saveWorkersList(next, buyerKey);
  return true;
}

export function removeSavedWorker(sellerId: string, buyerKey?: string): SavedWorkerRecord[] {
  const next = loadSavedWorkers(buyerKey).filter((w) => w.sellerId !== sellerId);
  saveWorkersList(next, buyerKey);
  return next;
}
