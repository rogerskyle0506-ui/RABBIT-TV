export function removeDislikedTitle(id: number | string): void {
  try {
    const disliked = getDislikedTitles().filter(item => item.id !== id);
    localStorage.setItem('rabbit_tv_disliked_titles', JSON.stringify(disliked));
  } catch (e) {
    console.error('Failed to remove disliked title:', e);
  }
}
export interface WatchHistoryItem {
  id: string; // e.g. "movie-123" or "tv-456-s1-e2"
  mediaId: string;
  title: string;
  mediaType: "movie" | "tv";
  posterPath?: string | null;
  backdropPath?: string | null;
  progressPercent: number; // 0 to 100
  lastWatchedAt: string;
  seasonNumber?: number;
  episodeNumber?: number;
  confirmedCompleted?: boolean; // false = '?', true = '✓'
}

const WATCH_HISTORY_KEY = "rabtv_watch_history";

export function getWatchHistory(): WatchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWatchProgress(item: Omit<WatchHistoryItem, "lastWatchedAt">): void {
  if (typeof window === "undefined") return;
  const history = getWatchHistory();
  const existingIndex = history.findIndex((h) => h.id === item.id);

  const updatedItem: WatchHistoryItem = {
    ...item,
    lastWatchedAt: new Date().toISOString(),
    confirmedCompleted:
      item.progressPercent >= 95
        ? true
        : existingIndex >= 0
        ? history[existingIndex].confirmedCompleted ?? false
        : false,
  };

  if (existingIndex >= 0) {
    history[existingIndex] = updatedItem;
  } else {
    history.unshift(updatedItem);
  }

  localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(history));
  window.dispatchEvent(new Event("rabtv_watch_history_updated"));
}

export function markAsConfirmedCompleted(id: string, completed: boolean): void {
  if (typeof window === "undefined") return;
  const history = getWatchHistory();
  const item = history.find((h) => h.id === id);
  if (item) {
    item.confirmedCompleted = completed;
    if (completed) item.progressPercent = 100;
    localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(history));
    window.dispatchEvent(new Event("rabtv_watch_history_updated"));
  }
}

export function removeFromWatchHistory(id: string): void {
  if (typeof window === "undefined") return;
  const history = getWatchHistory().filter((h) => h.id !== id);
  localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(history));
  window.dispatchEvent(new Event("rabtv_watch_history_updated"));
}
