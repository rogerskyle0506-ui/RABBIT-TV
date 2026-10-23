import { MediaItem } from "./tmdb-scraper";

const MY_LIST_KEY = "rabtv_my_list";
const WATCH_HISTORY_KEY = "rabtv_watch_history";

// --- My List Helpers ---
export function getMyList(): MediaItem[] {
  try {
    const saved = localStorage.getItem(MY_LIST_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function toggleMyList(item: MediaItem): boolean {
  const list = getMyList();
  const exists = list.some((i) => i.id === item.id);
  let updated: MediaItem[];

  if (exists) {
    updated = list.filter((i) => i.id !== item.id);
  } else {
    updated = [...list, item];
  }

  localStorage.setItem(MY_LIST_KEY, JSON.stringify(updated));
  
  // Dispatch event so active catalog views and headers refresh instantly
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("rabtv_catalog_updated"));
  }

  return !exists; // Returns true if added, false if removed
}

export function isInMyList(id: string): boolean {
  return getMyList().some((item) => item.id === id);
}

// --- Watch History Helpers ---
export function saveToWatchHistory(item: MediaItem) {
  try {
    const history = getWatchHistory();
    const filtered = history.filter((i) => i.id !== item.id);
    const updated = [item, ...filtered].slice(0, 20); // Keep last 20 watched
    localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(updated));
    
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("rabtv_watch_history_updated"));
    }
  } catch (e) {
    console.error("Could not save watch history", e);
  }
}

export function getWatchHistory(): MediaItem[] {
  try {
    const saved = localStorage.getItem(WATCH_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}
