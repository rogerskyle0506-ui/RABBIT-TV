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

export interface DislikedTitle {
  id: number | string;
  title?: string;
  name?: string;
}

const WATCH_HISTORY_KEY = "rabtv_watch_history";
const DISLIKED_TITLES_KEY = "rabbit_tv_disliked_titles";

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

export function markEpisodeCompleted(id: string, seasonNumber?: number, episodeNumber?: number): void {
  const targetId = seasonNumber !== undefined && episodeNumber !== undefined ? `${id}-s${seasonNumber}-e${episodeNumber}` : id;
  markAsConfirmedCompleted(targetId, true);
}

export function removeFromWatchHistory(id: string): void {
  if (typeof window === "undefined") return;
  const history = getWatchHistory().filter((h) => h.id !== id);
  localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(history));
  window.dispatchEvent(new Event("rabtv_watch_history_updated"));
}

export function calculateSeriesProgress(id: number | string): number {
  const history = getWatchHistory();
  const item = history.find((h) => h.id === String(id) || h.mediaId === String(id));
  if (!item) return 0;
  return item.progressPercent ?? (item.confirmedCompleted ? 100 : 0);
}

export function getDislikedTitles(): DislikedTitle[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(DISLIKED_TITLES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function removeDislikedTitle(id: number | string): void {
  if (typeof window === "undefined") return;
  try {
    const disliked = getDislikedTitles().filter((item) => String(item.id) !== String(id));
    localStorage.setItem(DISLIKED_TITLES_KEY, JSON.stringify(disliked));
    window.dispatchEvent(new Event("rabtv_watch_history_updated"));
  } catch (e) {
    console.error('Failed to remove disliked title:', e);
  }
}
