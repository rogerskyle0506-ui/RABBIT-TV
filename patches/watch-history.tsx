import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppTheme, CardSize, getSavedTheme, getSavedCardSize } from "@/lib/settings";
import {
  getWatchHistory,
  markEpisodeCompleted,
  removeFromWatchHistory,
  calculateSeriesProgress,
  getDislikedTitles,
  removeDislikedTitle,
  ShowWatchHistory,
  DislikedTitle,
} from "@/lib/watch-history";

export const Route = createFileRoute("/watch-history")({
  component: WatchHistoryComponent,
});

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

function WatchHistoryComponent() {
  const [historyMap, setHistoryMap] = useState<Record<string, ShowWatchHistory>>({});
  const [dislikedTitles, setDislikedTitles] = useState<DislikedTitle[]>([]);
  const [verifyingTarget, setVerifyingTarget] = useState<{ showId: string; episodeId: string; title: string } | null>(null);
  const [appTheme, setAppTheme] = useState<AppTheme>("violet");
  const [cardSize, setCardSize] = useState<CardSize>("large");

  const refreshData = () => {
    setHistoryMap(getWatchHistory());
    setDislikedTitles(getDislikedTitles());
    setAppTheme(getSavedTheme());
    setCardSize(getSavedCardSize());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("rabtv_watch_history_updated", refreshData);
    window.addEventListener("rabtv_disliked_updated", refreshData);
    window.addEventListener("rabtv_settings_updated", refreshData as any);
    return () => {
      window.removeEventListener("rabtv_watch_history_updated", refreshData);
      window.removeEventListener("rabtv_disliked_updated", refreshData);
      window.removeEventListener("rabtv_settings_updated", refreshData as any);
    };
  }, []);

  const handleEyeballClick = (showId: string, episodeId: string, episodeTitle: string, isCompleted: boolean) => {
    if (!isCompleted) {
      setVerifyingTarget({ showId, episodeId, title: episodeTitle });
    } else {
      markEpisodeCompleted(showId, episodeId, false);
      refreshData();
    }
  };

  const handleConfirmModal = (completed: boolean) => {
    if (verifyingTarget) {
      markEpisodeCompleted(verifyingTarget.showId, verifyingTarget.episodeId, completed);
      setVerifyingTarget(null);
      refreshData();
    }
  };

  const getPageBackground = (theme: AppTheme) => {
    switch (theme) {
      case "red":
        return "bg-gradient-to-br from-zinc-950 via-red-950/40 to-black";
      case "midnight":
        return "bg-gradient-to-br from-slate-950 via-blue-950/40 to-slate-950";
      case "emerald":
        return "bg-gradient-to-br from-slate-950 via-emerald-950/40 to-slate-950";
      case "amber":
        return "bg-gradient-to-br from-stone-950 via-yellow-950/40 to-neutral-950";
      case "cyan":
        return "bg-gradient-to-br from-slate-950 via-cyan-950/40 to-slate-950";
      case "violet":
      default:
        return "bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950";
    }
  };

  const getPrimaryAccentColor = (theme: AppTheme) => {
    switch (theme) {
      case "red":
        return "text-red-400 border-red-500";
      case "midnight":
        return "text-blue-400 border-blue-500";
      case "emerald":
        return "text-emerald-300 border-emerald-500";
      case "amber":
        return "text-amber-300 border-amber-500";
      case "cyan":
        return "text-cyan-300 border-cyan-500";
      case "violet":
      default:
        return "text-violet-400 border-violet-500";
    }
  };

  const getGridColsClass = (size: CardSize) => {
    switch (size) {
      case "small":
        return "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8";
      case "medium":
        return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";
      case "large":
      default:
        return "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
    }
  };

  const gridColsClass = getGridColsClass(cardSize);
  const allEntries = Object.values(historyMap);

  const tvShows = allEntries.filter(
    (item) => item.mediaType === "tv" || item.media_type === "tv" || item.totalEpisodes > 1
  );
  const movies = allEntries.filter((item) => !tvShows.includes(item));

  const inProgressMovies = movies.filter((m) => calculateSeriesProgress(m) < 100);
  const completedMovies = movies.filter((m) => calculateSeriesProgress(m) === 100);

  const inProgressShows = tvShows.filter((s) => calculateSeriesProgress(s) < 100);
  const completedShows = tvShows.filter((s) => calculateSeriesProgress(s) === 100);

  return (
    <div className={`min-h-screen w-full ${getPageBackground(appTheme)} p-4 md:p-12 text-white space-y-8 transition-colors duration-300`}>
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h1 className="text-xl font-bold tracking-wide flex items-center gap-2">
          <span>🕒</span> Watch History & Activity
        </h1>
        <span className="text-xs text-slate-400 font-semibold">
          {allEntries.length} Tracked Titles
        </span>
      </div>

      {allEntries.length === 0 && dislikedTitles.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-black/40 p-8 text-center text-slate-400 backdrop-blur-md">
          <p className="text-sm font-bold">No watch history recorded yet.</p>
          <p className="text-xs mt-1">Start watching movies or shows to automatically populate your history.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* SECTION: IN PROGRESS (MOVIES) */}
          {inProgressMovies.length > 0 && (
            <section className="space-y-3">
              <h2 className={`text-sm font-bold text-slate-200 border-l-4 pl-3 uppercase tracking-wider ${getPrimaryAccentColor(appTheme)}`}>
                Movies - In Progress
              </h2>
              <div className={`grid ${gridColsClass} gap-3`}>
                {inProgressMovies.map((movie) => (
                  <MovieCard
                    key={movie.showId}
                    movie={movie}
                    appTheme={appTheme}
                    onEyeballClick={handleEyeballClick}
                    onRemove={() => {
                      removeFromWatchHistory(movie.showId);
                      refreshData();
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* SECTION: IN PROGRESS (TV SHOWS) */}
          {inProgressShows.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-slate-200 border-l-4 border-blue-500 pl-3 uppercase tracking-wider">
                TV Shows - In Progress
              </h2>
              <div className={`grid ${gridColsClass} gap-3`}>
                {inProgressShows.map((show) => (
                  <TvShowCard
                    key={show.showId}
                    show={show}
                    appTheme={appTheme}
                    onEyeballClick={handleEyeballClick}
                    onRemove={() => {
                      removeFromWatchHistory(show.showId);
                      refreshData();
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* SECTION: COMPLETED (MOVIES & TV SHOWS) */}
          {(completedMovies.length > 0 || completedShows.length > 0) && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-slate-200 border-l-4 border-emerald-500 pl-3 uppercase tracking-wider">
                Completed
              </h2>
              <div className={`grid ${gridColsClass} gap-3`}>
                {completedMovies.map((movie) => (
                  <MovieCard
                    key={movie.showId}
                    movie={movie}
                    appTheme={appTheme}
                    onEyeballClick={handleEyeballClick}
                    onRemove={() => {
                      removeFromWatchHistory(movie.showId);
                      refreshData();
                    }}
                  />
                ))}
                {completedShows.map((show) => (
                  <TvShowCard
                    key={show.showId}
                    show={show}
                    appTheme={appTheme}
                    onEyeballClick={handleEyeballClick}
                    onRemove={() => {
                      removeFromWatchHistory(show.showId);
                      refreshData();
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* SECTION: DISLIKED / REMOVED */}
          {dislikedTitles.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-slate-200 border-l-4 border-red-500 pl-3 uppercase tracking-wider">
                Disliked / Removed
              </h2>
              <div className={`grid ${gridColsClass} gap-3`}>
                {dislikedTitles.map((item) => (
                  <div
                    key={item.id}
                    className="group relative rounded-xl border border-red-500/20 bg-black/60 backdrop-blur-md overflow-hidden shadow-md flex flex-col justify-between p-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-red-400 uppercase">{item.mediaType}</span>
                        <button
                          type="button"
                          onClick={() => {
                            removeDislikedTitle(item.id);
                            refreshData();
                          }}
                          className="text-slate-400 hover:text-white text-xs font-bold"
                          title="Restore"
                        >
                          ↺
                        </button>
                      </div>
                      <h3 className="text-xs font-bold text-white truncate" title={item.title}>
                        {item.title}
                      </h3>
                    </div>
                    <span className="text-[9px] text-slate-500 pt-2">Removed from history</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* VERIFICATION MODAL */}
      {verifyingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl text-center">
            <div className="text-3xl">👁️</div>
            <h3 className="text-lg font-bold text-white">Verify Completion</h3>
            <p className="text-xs text-slate-300">
              Did you complete watching <strong className="text-violet-400">{verifyingTarget.title}</strong>?
            </p>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleConfirmModal(true)}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white shadow-lg transition"
              >
                Yes (✓)
              </button>
              <button
                type="button"
                onClick={() => handleConfirmModal(false)}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 py-2.5 text-xs font-bold text-slate-300 transition"
              >
                No (?)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** STREAMLINED MOVIE CARD */
function MovieCard({
  movie,
  appTheme,
  onEyeballClick,
  onRemove,
}: {
  movie: ShowWatchHistory;
  appTheme: AppTheme;
  onEyeballClick: (showId: string, episodeId: string, episodeTitle: string, isCompleted: boolean) => void;
  onRemove: () => void;
}) {
  const navigate = useNavigate();
  const singleEp = Object.values(movie.episodes)[0] || { episodeId: "default", title: movie.title, confirmedCompleted: false };
  const isCompleted = singleEp.confirmedCompleted;

  const getCardThemeStyles = (theme: AppTheme) => {
    switch (theme) {
      case "red":
        return "bg-gradient-to-b from-red-950/70 via-zinc-900 to-black border-red-500/30";
      case "midnight":
        return "bg-gradient-to-b from-blue-950/70 via-slate-900 to-slate-950 border-blue-500/30";
      case "emerald":
        return "bg-gradient-to-b from-emerald-950/70 via-slate-900 to-slate-950 border-emerald-500/30";
      case "amber":
        return "bg-gradient-to-b from-yellow-950/70 via-stone-900 to-stone-950 border-amber-500/30";
      case "cyan":
        return "bg-gradient-to-b from-cyan-950/70 via-slate-900 to-slate-950 border-cyan-500/30";
      case "violet":
      default:
        return "bg-gradient-to-b from-purple-950/70 via-slate-900 to-slate-950 border-violet-500/30";
    }
  };

  return (
    <div
      onClick={() => navigate({ to: "/details", search: { id: movie.showId, type: "movie" } })}
      className={`group relative rounded-xl border overflow-hidden shadow-xl flex flex-col justify-between transition hover:brightness-110 cursor-pointer ${getCardThemeStyles(appTheme)}`}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
        {movie.posterPath ? (
          <img
            src={`${TMDB_IMAGE_BASE}${movie.posterPath}`}
            alt={movie.title}
            className="h-full w-full object-cover transition transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-2 text-center text-slate-500 text-[10px] font-bold">
            {movie.title}
          </div>
        )}

        {/* Action Controls */}
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-10" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onEyeballClick(movie.showId, singleEp.episodeId, movie.title, isCompleted)}
            className="flex h-6 px-1.5 items-center justify-center rounded-lg bg-slate-950/80 text-white backdrop-blur-md border border-white/20 transition hover:scale-110 focus:outline-none text-[10px] font-bold"
            title="Toggle Status"
          >
            {isCompleted ? "👁️ ✓" : "👁️ ?"}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-950/80 text-red-300 backdrop-blur-md border border-red-500/30 transition hover:bg-red-600 hover:text-white focus:outline-none text-xs font-bold"
            title="Remove"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="p-2.5">
        <h3 className="text-xs font-bold truncate text-white" title={movie.title}>
          {movie.title}
        </h3>
        <span className="text-[10px] text-slate-400 font-medium">Movie</span>
      </div>
    </div>
  );
}

/** TV SHOW CARD */
function TvShowCard({
  show,
  appTheme,
  onEyeballClick,
  onRemove,
}: {
  show: ShowWatchHistory;
  appTheme: AppTheme;
  onEyeballClick: (showId: string, episodeId: string, episodeTitle: string, isCompleted: boolean) => void;
  onRemove: () => void;
}) {
  const navigate = useNavigate();
  const progress = calculateSeriesProgress(show);
  const episodesList = Object.values(show.episodes);

  const getCardThemeStyles = (theme: AppTheme) => {
    switch (theme) {
      case "red":
        return "bg-gradient-to-b from-red-950/70 via-zinc-900 to-black border-red-500/30";
      case "midnight":
        return "bg-gradient-to-b from-blue-950/70 via-slate-900 to-slate-950 border-blue-500/30";
      case "emerald":
        return "bg-gradient-to-b from-emerald-950/70 via-slate-900 to-slate-950 border-emerald-500/30";
      case "amber":
        return "bg-gradient-to-b from-yellow-950/70 via-stone-900 to-stone-950 border-amber-500/30";
      case "cyan":
        return "bg-gradient-to-b from-cyan-950/70 via-slate-900 to-slate-950 border-cyan-500/30";
      case "violet":
      default:
        return "bg-gradient-to-b from-purple-950/70 via-slate-900 to-slate-950 border-violet-500/30";
    }
  };

  return (
    <div
      onClick={() => navigate({ to: "/details", search: { id: show.showId, type: "tv" } })}
      className={`group relative rounded-xl border overflow-hidden shadow-xl flex flex-col justify-between transition hover:brightness-110 cursor-pointer ${getCardThemeStyles(appTheme)}`}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
        {show.posterPath ? (
          <img
            src={`${TMDB_IMAGE_BASE}${show.posterPath}`}
            alt={show.title}
            className="h-full w-full object-cover transition transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-2 text-center text-slate-500 text-[10px] font-bold">
            {show.title}
          </div>
        )}

        <div className="absolute top-1.5 right-1.5 z-10" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onRemove}
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-950/80 text-red-300 backdrop-blur-md border border-red-500/30 transition hover:bg-red-600 hover:text-white focus:outline-none text-xs font-bold"
            title="Remove"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="p-2.5 space-y-2">
        <h3 className="text-xs font-bold truncate text-white" title={show.title}>
          {show.title}
        </h3>

        {/* Overall Beginning-to-End Series Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>Series Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden border border-white/5">
            <div
              className={`h-full transition-all duration-300 ${
                progress === 100 ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Episode Breakdown Sublist */}
        <div className="space-y-1 max-h-28 overflow-y-auto pr-0.5" onClick={(e) => e.stopPropagation()}>
          {episodesList.map((ep) => (
            <EpisodeRow
              key={ep.episodeId}
              episode={ep}
              onEyeballClick={() => onEyeballClick(show.showId, ep.episodeId, ep.title, ep.confirmedCompleted)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EpisodeRow({
  episode,
  onEyeballClick,
}: {
  episode: { episodeId: string; seasonNumber: number; episodeNumber: number; title: string; confirmedCompleted: boolean };
  onEyeballClick: () => void;
}) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  return (
    <div className="flex items-center justify-between rounded-md bg-slate-950/60 px-2 py-1 border border-white/5 text-[11px]">
      <div className="truncate pr-1 text-slate-300">
        <span className="font-semibold text-slate-400">S{episode.seasonNumber}E{episode.episodeNumber}</span>
      </div>

      <div className="relative shrink-0">
        <button
          type="button"
          onClick={onEyeballClick}
          onMouseEnter={() => setIsTooltipOpen(true)}
          onMouseLeave={() => setIsTooltipOpen(false)}
          onFocus={() => setIsTooltipOpen(true)}
          onBlur={() => setIsTooltipOpen(false)}
          className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-white border border-white/20 transition hover:scale-110 focus:outline-none text-[10px]"
          aria-label="Toggle Status"
        >
          {episode.confirmedCompleted ? "👁️ ✓" : "👁️ ?"}
        </button>

        {isTooltipOpen && (
          <div className="absolute right-0 top-7 whitespace-nowrap rounded-lg bg-slate-950 px-2 py-1 text-[9px] font-bold text-white shadow-xl border border-white/20 z-20">
            Status: {episode.confirmedCompleted ? "Completed" : "Unconfirmed Completion"}
          </div>
        )}
      </div>
    </div>
  );
}
