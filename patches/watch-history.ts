export interface WatchedEpisode {
  episodeId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  confirmedCompleted: boolean;
  timestamp: string;
}

export interface ShowWatchHistory {
  showId: string;
  title: string;
  posterPath: string;
  backdropPath?: string;
  totalEpisodes: number;
  episodes: Record<string, WatchedEpisode>;
  lastUpdated: string;
}

export interface DislikedTitle {
  id: string;
  title: string;
  mediaType: "movie" | "tv";
  dislikedAt: string;
}

const WATCH_HISTORY_KEY = "rabtv_watch_history";
const DISLIKED_TITLES_KEY = "rabtv_disliked_titles";

export function getWatchHistory(): Record<string, ShowWatchHistory> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(WATCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveWatchHistory(history: Record<string, ShowWatchHistory>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(history));
  window.dispatchEvent(new Event("rabtv_watch_history_updated"));
}

export function logEpisodeInProgress(
  showId: string,
  showTitle: string,
  posterPath: string,
  totalEpisodes: number,
  seasonNumber: number,
  episodeNumber: number,
  episodeTitle: string
): void {
  const history = getWatchHistory();
  const episodeId = `s${seasonNumber}e${episodeNumber}`;

  if (!history[showId]) {
    history[showId] = {
      showId,
      title: showTitle,
      posterPath,
      totalEpisodes: totalEpisodes || 1,
      episodes: {},
      lastUpdated: new Date().toISOString(),
    };
  }

  if (totalEpisodes > 0) {
    history[showId].totalEpisodes = totalEpisodes;
  }

  if (!history[showId].episodes[episodeId]) {
    history[showId].episodes[episodeId] = {
      episodeId,
      seasonNumber,
      episodeNumber,
      title: episodeTitle || `Season ${seasonNumber}, Episode ${episodeNumber}`,
      confirmedCompleted: false,
      timestamp: new Date().toISOString(),
    };
    history[showId].lastUpdated = new Date().toISOString();
    saveWatchHistory(history);
  }
}

export function markEpisodeCompleted(showId: string, episodeId: string, completed: boolean = true): void {
  const history = getWatchHistory();
  if (history[showId] && history[showId].episodes[episodeId]) {
    history[showId].episodes[episodeId].confirmedCompleted = completed;
    history[showId].lastUpdated = new Date().toISOString();
    saveWatchHistory(history);
  }
}

export function calculateSeriesProgress(show: ShowWatchHistory): number {
  if (!show || !show.totalEpisodes || show.totalEpisodes === 0) return 0;
  const completedCount = Object.values(show.episodes).filter((e) => e.confirmedCompleted).length;
  const percentage = Math.round((completedCount / show.totalEpisodes) * 100);
  return Math.min(100, Math.max(0, percentage));
}

export function removeFromWatchHistory(showId: string, episodeId?: string): void {
  const history = getWatchHistory();
  if (!history[showId]) return;

  if (episodeId) {
    delete history[showId].episodes[episodeId];
    if (Object.keys(history[showId].episodes).length === 0) {
      delete history[showId];
    }
  } else {
    delete history[showId];
  }
  saveWatchHistory(history);
}

export function getDislikedTitles(): DislikedTitle[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DISLIKED_TITLES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addDislikedTitle(id: string, title: string, mediaType: "movie" | "tv"): void {
  const list = getDislikedTitles();
  if (!list.some((item) => item.id === id)) {
    list.push({ id, title, mediaType, dislikedAt: new Date().toISOString() });
    localStorage.setItem(DISLIKED_TITLES_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("rabtv_disliked_updated"));
  }
}

export function removeDislikedTitle(id: string): void {
  let list = getDislikedTitles();
  list = list.filter((item) => item.id !== id);
  localStorage.setItem(DISLIKED_TITLES_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("rabtv_disliked_updated"));
}
