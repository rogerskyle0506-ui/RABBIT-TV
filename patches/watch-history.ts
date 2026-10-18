export interface WatchHistoryItem {
  id: string; // e.g. "movie-123" or "tv-456-s1-e2"
  mediaId: string | number;
  title?: string;
  name?: string;
  mediaType?: "movie" | "tv";
  media_type?: "movie" | "tv";
  posterPath?: string | null;
  poster_path?: string | null;
  backdropPath?: string | null;
  backdrop_path?: string | null;
  progressPercent?: number;
  progress?: number;
  lastWatchedAt?: string;
  updatedAt?: number;
  seasonNumber?: number;
  season?: number;
  episodeNumber?: number;
  episode?: number;
  confirmedCompleted?: boolean;
  completed?: boolean;
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
    if (!raw) return [];
    const items = JSON.parse(raw);
    // Normalize properties so components using snake_case or camelCase both work seamlessly
    return items.map((item: any) => ({
      ...item,
      mediaId: item.mediaId ?? item.id,
      title: item.title ?? item.name,
      mediaType: item.mediaType ?? item.media_type ?? "movie",
      posterPath: item.posterPath ?? item.poster_path,
      backdropPath: item.backdropPath ?? item.backdrop_path,
      progressPercent: item.progressPercent ?? item.progress ?? 0,
      confirmedCompleted: item.confirmedCompleted ?? item.completed ?? false,
    }));
  } catch {
    return [];
  }
}

export function saveWatchProgress(item: Omit<WatchHistoryItem, "lastWatchedAt">): void {
  if (typeof window === "undefined") return;
  const history = getWatchHistory();
  const existingIndex = history.findIndex((h) => String(h.id) === String(item.id));

  const progressVal = item.progressPercent ?? item.progress ?? 0;
  const existingConfirmed = existingIndex >= 0 ? history[existingIndex].confirmedCompleted ?? false : false;

  const updatedItem: WatchHistoryItem = {
    ...item,
    mediaId: item.mediaId ?? item.id,
    mediaType: item.mediaType ?? item.media_type ?? "movie",
    posterPath: item.posterPath ?? item.poster_path,
    backdropPath: item.backdropPath ?? item.backdrop_path,
    progressPercent: progressVal,
    lastWatchedAt: new Date().toISOString(),
    updatedAt: Date.now(),
    confirmedCompleted: progressVal >= 95 ? true : existingConfirmed,
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
  const item = history.find((h) => String(h.id) === String(id));
  if (item) {
    item.confirmedCompleted = completed;
    item.completed = completed;
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
  const history = getWatchHistory().filter((h) => String(h.id) !== String(id));
  localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(history));
  window.dispatchEvent(new Event("rabtv_watch_history_updated"));
}

export function calculateSeriesProgress(id: number | string): number {
  const history = getWatchHistory();
  const item = history.find((h) => String(h.id) === String(id) || String(h.mediaId) === String(id));
  if (!item) return 0;
  return item.progressPercent ?? (item.confirmedCompleted ? 100 : 0);
}

export function getDislikedTitles(): DislikedTitle[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(DISLIKED_TITLES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to get disliked titles:', e);
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
