export interface WatchHistoryItem {
  id: string | number;
  mediaId: string | number;
  title?: string;
  name?: string;
  mediaType?: "movie" | "tv";
  media_type?: "movie" | "tv";
  posterPath?: string | null;
  poster_path?: string | null;
  backdropPath?: string | null;
  backdrop_path?: string | null;
  image?: string | null;
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
  totalEpisodes?: number;
}

export interface EpisodeWatchRecord {
  episodeId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  confirmedCompleted: boolean;
}

export interface ShowWatchHistory {
  showId: string;
  title: string;
  mediaType: "movie" | "tv";
  posterPath?: string | null;
  backdropPath?: string | null;
  totalEpisodes: number;
  episodes: Record<string, EpisodeWatchRecord>;
}

export interface DislikedTitle {
  id: number | string;
  title?: string;
  name?: string;
  mediaType?: string;
}

const WATCH_HISTORY_KEY = "rabtv_watch_history";
const DISLIKED_TITLES_KEY = "rabbit_tv_disliked_titles";

export function getRawWatchHistory(): WatchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCH_HISTORY_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw);
    return items.map((item: any) => {
      const resolvedId = String(item.mediaId ?? item.id ?? "");
      const cleanId = resolvedId.replace(/^(movie|tv)-/, "");
      const mediaType = item.mediaType ?? item.media_type ?? (String(item.id).startsWith("tv") ? "tv" : "movie");
      
      return {
        ...item,
        id: resolvedId,
        mediaId: cleanId,
        title: item.title ?? item.name ?? "Unknown Title",
        mediaType,
        media_type: mediaType,
        posterPath: item.posterPath ?? item.poster_path ?? item.image,
        poster_path: item.posterPath ?? item.poster_path ?? item.image,
        image: item.image ?? item.posterPath ?? item.poster_path,
        progressPercent: item.progressPercent ?? item.progress ?? 0,
        confirmedCompleted: item.confirmedCompleted ?? item.completed ?? false,
      };
    });
  } catch {
    return [];
  }
}

/** Returns the grouped record map expected by watch-history.tsx */
export function getWatchHistory(): Record<string, ShowWatchHistory> {
  const rawItems = getRawWatchHistory();
  const map: Record<string, ShowWatchHistory> = {};

  for (const item of rawItems) {
    const showId = String(item.mediaId ?? item.id ?? "unknown").replace(/^(movie|tv)-/, "");
    const title = item.title ?? item.name ?? "Unknown Title";
    const mediaType = item.mediaType ?? item.media_type ?? "movie";
    const posterPath = item.posterPath ?? item.poster_path ?? item.image;
    const seasonNum = item.seasonNumber ?? item.season ?? 1;
    const episodeNum = item.episodeNumber ?? item.episode ?? 1;
    const episodeId = `${showId}-s${seasonNum}-e${episodeNum}`;

    if (!map[showId]) {
      map[showId] = {
        showId,
        title,
        mediaType,
        posterPath,
        backdropPath: item.backdropPath ?? item.backdrop_path,
        totalEpisodes: item.totalEpisodes && item.totalEpisodes > 1 ? item.totalEpisodes : (mediaType === "movie" ? 1 : 24),
        episodes: {},
      };
    }

    if (item.totalEpisodes && item.totalEpisodes > map[showId].totalEpisodes) {
      map[showId].totalEpisodes = item.totalEpisodes;
    }

    map[showId].episodes[episodeId] = {
      episodeId,
      seasonNumber: seasonNum,
      episodeNumber: episodeNum,
      title: item.title ?? title,
      confirmedCompleted: item.confirmedCompleted ?? false,
    };
  }

  return map;
}

export function saveWatchProgress(item: Omit<WatchHistoryItem, "lastWatchedAt">): void {
  if (typeof window === "undefined") return;
  const history = getRawWatchHistory();
  const existingIndex = history.findIndex((h) => String(h.id) === String(item.id) || String(h.mediaId) === String(item.mediaId));

  const progressVal = item.progressPercent ?? item.progress ?? 0;
  const existingConfirmed = existingIndex >= 0 ? history[existingIndex].confirmedCompleted ?? false : false;

  const updatedItem: WatchHistoryItem = {
    ...item,
    mediaId: String(item.mediaId ?? item.id).replace(/^(movie|tv)-/, ""),
    mediaType: item.mediaType ?? item.media_type ?? "movie",
    posterPath: item.posterPath ?? item.poster_path ?? item.image,
    backdropPath: item.backdropPath ?? item.backdrop_path,
    image: item.image ?? item.posterPath ?? item.poster_path,
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
  const history = getRawWatchHistory();
  const item = history.find((h) => String(h.id) === String(id) || String(h.mediaId) === String(id));
  if (item) {
    item.confirmedCompleted = completed;
    item.completed = completed;
    if (completed) item.progressPercent = 100;
    localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(history));
    window.dispatchEvent(new Event("rabtv_watch_history_updated"));
  }
}

export function markEpisodeCompleted(showId: string, episodeId: string, completed: boolean): void {
  if (typeof window === "undefined") return;
  const history = getRawWatchHistory();
  const cleanShowId = String(showId).replace(/^(movie|tv)-/, "");
  
  const existingIndex = history.findIndex(
    (h) => String(h.id) === String(episodeId) || (String(h.mediaId) === cleanShowId && String(h.id) === String(episodeId))
  );

  if (existingIndex >= 0) {
    history[existingIndex].confirmedCompleted = completed;
    history[existingIndex].completed = completed;
    history[existingIndex].progressPercent = completed ? 100 : 0;
  } else {
    history.unshift({
      id: episodeId,
      mediaId: cleanShowId,
      mediaType: "tv",
      title: "Episode",
      progressPercent: completed ? 100 : 0,
      confirmedCompleted: completed,
      completed,
      lastWatchedAt: new Date().toISOString()
    });
  }
  
  localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(history));
  window.dispatchEvent(new Event("rabtv_watch_history_updated"));
}

export function removeFromWatchHistory(id: string): void {
  if (typeof window === "undefined") return;
  const history = getRawWatchHistory().filter((h) => String(h.id) !== String(id) && String(h.mediaId) !== String(id));
  localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(history));
  window.dispatchEvent(new Event("rabtv_watch_history_updated"));
}

export function calculateSeriesProgress(show: ShowWatchHistory | string | number): number {
  if (typeof show === "object" && show !== null && "episodes" in show) {
    const eps = Object.values(show.episodes);
    if (eps.length === 0 || show.totalEpisodes === 0) return 0;
    
    const completedCount = eps.filter((e) => e.confirmedCompleted).length;
    const percentage = Math.round((completedCount / show.totalEpisodes) * 100);
    return Math.min(100, percentage);
  }

  const history = getRawWatchHistory();
  const cleanId = String(show).replace(/^(movie|tv)-/, "");
  const item = history.find((h) => String(h.id) === String(show) || String(h.mediaId) === cleanId);
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
