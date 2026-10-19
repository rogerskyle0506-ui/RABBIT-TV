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
  posterPath?: string | null;
}

const WATCH_HISTORY_KEY = "rabtv_watch_history";
const DISLIKED_TITLES_KEY = "rabbit_tv_disliked_titles";
const MAX_HISTORY_ITEMS = 50; // Hard cap for 2GB device memory optimization

export function getRawWatchHistory(): WatchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCH_HISTORY_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw);
    return items.map((item: any) => {
      const resolvedId = String(item.mediaId ?? item.id ?? "");
      const cleanId = resolvedId.replace(/^(movie|tv)-/, "");
      const rawType = item.mediaType ?? item.media_type;
      const mediaType = rawType === "tv" || String(item.id).startsWith("tv-") ? "tv" : "movie";
      
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

export function getWatchHistory(): Record<string, ShowWatchHistory> {
  const rawItems = getRawWatchHistory();
  const map: Record<string, ShowWatchHistory> = {};

  for (const item of rawItems) {
    const showId = String(item.mediaId ?? item.id ?? "unknown").replace(/^(movie|tv)-/, "");
    const title = item.title ?? item.name ?? "Unknown Title";
    const mediaType = (item.mediaType ?? item.media_type) === "tv" ? "tv" : "movie";
    const posterPath = item.posterPath ?? item.poster_path ?? item.image;
    const seasonNum = item.seasonNumber ?? item.season ?? 1;
    const episodeNum = item.episodeNumber ?? item.episode ?? 1;
    const episodeId = `${showId}-s${seasonNum}-e${episodeNum}`;

    if (!map[showId]) {
      map[showId] = {
        showId,
        title: title === "Episode" || title === "Title" ? "Unknown Title" : title,
        mediaType,
        posterPath,
        backdropPath: item.backdropPath ?? item.backdrop_path,
        totalEpisodes: mediaType === "movie" ? 1 : (item.totalEpisodes && item.totalEpisodes > 1 ? item.totalEpisodes : 24),
        episodes: {},
      };
    } else {
      if ((map[showId].title === "Unknown Title" || map[showId].title === "Episode") && title && title !== "Episode" && title !== "Title") {
        map[showId].title = title;
      }
      if (!map[showId].posterPath && posterPath) {
        map[showId].posterPath = posterPath;
      }
    }

    if (mediaType === "tv" && item.totalEpisodes && item.totalEpisodes > map[showId].totalEpisodes) {
      map[showId].totalEpisodes = item.totalEpisodes;
    }

    const epKey = mediaType === "movie" ? `${showId}-s1-e1` : episodeId;
    map[showId].episodes[epKey] = {
      episodeId: epKey,
      seasonNumber: seasonNum,
      episodeNumber: episodeNum,
      title: item.title && item.title !== "Episode" ? item.title : `S${seasonNum}E${episodeNum}`,
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

  const rawType = item.mediaType ?? item.media_type;
  const resolvedType = rawType === "tv" || String(item.id).startsWith("tv-") ? "tv" : "movie";

  const updatedItem: WatchHistoryItem = {
    ...item,
    mediaId: String(item.mediaId ?? item.id).replace(/^(movie|tv)-/, ""),
    mediaType: resolvedType,
    media_type: resolvedType,
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

  // Enforce strict 50-item cap to prevent JSON parse freezes
  const cappedHistory = history.slice(0, MAX_HISTORY_ITEMS);

  localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(cappedHistory));
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
    localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS)));
    window.dispatchEvent(new Event("rabtv_watch_history_updated"));
  }
}

export function markEpisodeCompleted(showId: string, episodeId: string, completed: boolean): void {
  if (typeof window === "undefined") return;
  const history = getRawWatchHistory();
  const cleanShowId = String(showId).replace(/^(movie|tv)-/, "");
  
  let updated = false;

  for (const item of history) {
    const itemCleanId = String(item.mediaId ?? item.id).replace(/^(movie|tv)-/, "");
    if (itemCleanId === cleanShowId || String(item.id) === String(episodeId)) {
      item.confirmedCompleted = completed;
      item.completed = completed;
      item.progressPercent = completed ? 100 : 0;
      updated = true;
    }
  }

  if (!updated) {
    history.unshift({
      id: episodeId || cleanShowId,
      mediaId: cleanShowId,
      mediaType: "movie",
      title: "Unknown Title",
      progressPercent: completed ? 100 : 0,
      confirmedCompleted: completed,
      completed,
      lastWatchedAt: new Date().toISOString()
    });
  }
  
  localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS)));
  window.dispatchEvent(new Event("rabtv_watch_history_updated"));
}

export function removeFromWatchHistory(id: string): void {
  if (typeof window === "undefined") return;
  const history = getRawWatchHistory().filter((h) => String(h.id) !== String(id) && String(h.mediaId) !== String(id));
  localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS)));
  window.dispatchEvent(new Event("rabtv_watch_history_updated"));
}

export function calculateSeriesProgress(show: ShowWatchHistory | string | number): number {
  if (typeof show === "object" && show !== null && "episodes" in show) {
    if (show.mediaType === "movie") {
      const singleEp = Object.values(show.episodes)[0];
      return singleEp?.confirmedCompleted ? 100 : 0;
    }
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

export function isTitleDisliked(id: string | number): boolean {
  if (!id) return false;
  const cleanId = String(id).replace(/^(movie|tv)-/, "");
  const disliked = getDislikedTitles();
  return disliked.some((item) => String(item.id).replace(/^(movie|tv)-/, "") === cleanId);
}

export function dislikeTitle(item: { id: string | number; title?: string; name?: string; mediaType?: string; posterPath?: string | null }): void {
  if (typeof window === "undefined") return;
  
  const cleanId = String(item.id).replace(/^(movie|tv)-/, "");
  removeFromWatchHistory(cleanId);

  const disliked = getDislikedTitles();
  const exists = disliked.some((d) => String(d.id).replace(/^(movie|tv)-/, "") === cleanId);
  
  if (!exists) {
    disliked.unshift({
      id: cleanId,
      title: item.title ?? item.name ?? "Unknown Title",
      mediaType: item.mediaType ?? "movie",
      posterPath: item.posterPath ?? null,
    });
    localStorage.setItem(DISLIKED_TITLES_KEY, JSON.stringify(disliked));
  }

  window.dispatchEvent(new Event("rabtv_watch_history_updated"));
  window.dispatchEvent(new Event("rabtv_disliked_updated"));
}

export function removeDislikedTitle(id: number | string): void {
  if (typeof window === "undefined") return;
  try {
    const cleanId = String(id).replace(/^(movie|tv)-/, "");
    const disliked = getDislikedTitles().filter((item) => String(item.id).replace(/^(movie|tv)-/, "") !== cleanId);
    localStorage.setItem(DISLIKED_TITLES_KEY, JSON.stringify(disliked));
    
    window.dispatchEvent(new Event("rabtv_watch_history_updated"));
    window.dispatchEvent(new Event("rabtv_disliked_updated"));
  } catch (e) {
    console.error('Failed to remove disliked title:', e);
  }
}
