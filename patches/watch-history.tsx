import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { AppTheme, CardSize, HistoryScale, getSavedTheme, getSavedCardSize, getHistoryOverscale, getLargeButtons } from "@/lib/settings";
import {
  getWatchHistory,
  markEpisodeCompleted,
  removeFromWatchHistory,
  calculateSeriesProgress,
  getDislikedTitles,
  removeDislikedTitle,
  dislikeTitle,
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
  const [historyOverscale, setHistoryOverscale] = useState<HistoryScale>("off");
  const [largeButtons, setLargeButtons] = useState<boolean>(true);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    const checkVerticalScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      setCanScrollDown(scrollTop + clientHeight < scrollHeight - 80);
    };

    checkVerticalScroll();
    window.addEventListener("scroll", checkVerticalScroll, { passive: true });
    window.addEventListener("resize", checkVerticalScroll);

    return () => {
      window.removeEventListener("scroll", checkVerticalScroll);
      window.removeEventListener("resize", checkVerticalScroll);
    };
  }, [historyMap, dislikedTitles]);

  const refreshData = () => {
    setHistoryMap(getWatchHistory());
    setDislikedTitles(getDislikedTitles());
    setAppTheme(getSavedTheme());
    setCardSize(getSavedCardSize());
    setHistoryOverscale(getHistoryOverscale());
    setLargeButtons(getLargeButtons());
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

  const getThemeArrowColor = (theme: AppTheme) => {
    switch (theme) {
      case "red":
        return "text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]";
      case "midnight":
        return "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]";
      case "emerald":
        return "text-emerald-300 drop-shadow-[0_0_8px_rgba(110,231,183,0.8)]";
      case "amber":
        return "text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.8)]";
      case "cyan":
        return "text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]";
      case "violet":
      default:
        return "text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]";
    }
  };

  const getGridColsClass = (size: CardSize, overscale: HistoryScale) => {
    let reductionOffset = 0;
    if (overscale === "20%") reductionOffset = 1;
    if (overscale === "50%") reductionOffset = 2;
    if (overscale === "80%") reductionOffset = 3;

    switch (size) {
      case "small":
        return reductionOffset >= 3
          ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          : reductionOffset >= 2
          ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8";
      case "medium":
        return reductionOffset >= 2
          ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";
      case "large":
      default:
        return reductionOffset >= 2
          ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
    }
  };

  const gridColsClass = getGridColsClass(cardSize, historyOverscale);
  const allEntries = Object.values(historyMap);

  const tvShows = allEntries.filter((item) => item.mediaType === "tv");
  const movies = allEntries.filter((item) => item.mediaType === "movie");

  const inProgressMovies = movies.filter((m) => calculateSeriesProgress(m) < 100);
  const completedMovies = movies.filter((m) => calculateSeriesProgress(m) === 100);

  const inProgressShows = tvShows.filter((s) => calculateSeriesProgress(s) < 100);
  const completedShows = tvShows.filter((s) => calculateSeriesProgress(s) === 100);

  return (
    <div className={`min-h-screen w-full ${getPageBackground(appTheme)} p-4 md:p-12 text-white space-y-6 transition-colors duration-300 pb-20 overflow-x-hidden`}>
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h1 className="text-xl font-bold tracking-wide flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-950 via-red-900 to-black border border-red-500/30 shadow-lg text-lg">
            🐰
          </div>
          <span>Watch History & Activity</span>
        </h1>
        <span className="text-xs text-slate-400 font-semibold">
          {allEntries.length} Tracked Titles
        </span>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 shadow-md backdrop-blur-md flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm">💡</span>
          <span><strong className="text-white">👁️</strong> = Confirm Progress</span>
          <span className="text-slate-600">•</span>
          <span><strong className="text-white">👎</strong> = Scrub & Hide from Catalogs</span>
          <span className="text-slate-600">•</span>
          <span><strong className="text-white">✕</strong> = Reset to Un-tracked</span>
        </div>
        <div className="text-violet-400 font-medium">
          ✨ More saved items are also on your <strong className="text-white">My List</strong> tab!
        </div>
      </div>

      {allEntries.length === 0 && dislikedTitles.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-black/40 p-8 text-center text-slate-400 backdrop-blur-md">
          <p className="text-sm font-bold">No watch history recorded yet.</p>
          <p className="text-xs mt-1">Start watching movies or shows to automatically populate your history.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {inProgressMovies.length > 0 && (
            <section className="space-y-4">
              <h2 className={`text-sm font-bold text-slate-200 border-l-4 pl-3 uppercase tracking-wider ${getPrimaryAccentColor(appTheme)}`}>
                Movies - In Progress
              </h2>
              <div className={`grid ${gridColsClass} gap-x-6 gap-y-10 pt-2 items-start`}>
                {inProgressMovies.map((movie) => (
                  <MovieCard
                    key={movie.showId}
                    movie={movie}
                    appTheme={appTheme}
                    historyOverscale={historyOverscale}
                    largeButtons={largeButtons}
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

          {inProgressShows.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-slate-200 border-l-4 border-blue-500 pl-3 uppercase tracking-wider">
                TV Shows - In Progress
              </h2>
              <div className={`grid ${gridColsClass} gap-x-6 gap-y-10 pt-2 items-start`}>
                {inProgressShows.map((show) => (
                  <TvShowCard
                    key={show.showId}
                    show={show}
                    appTheme={appTheme}
                    historyOverscale={historyOverscale}
                    largeButtons={largeButtons}
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

          {(completedMovies.length > 0 || completedShows.length > 0) && (
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-slate-200 border-l-4 border-emerald-500 pl-3 uppercase tracking-wider">
                Completed
              </h2>
              <div className={`grid ${gridColsClass} gap-x-6 gap-y-10 pt-2 items-start`}>
                {completedMovies.map((movie) => (
                  <MovieCard
                    key={movie.showId}
                    movie={movie}
                    appTheme={appTheme}
                    historyOverscale={historyOverscale}
                    largeButtons={largeButtons}
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
                    historyOverscale={historyOverscale}
                    largeButtons={largeButtons}
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

          {dislikedTitles.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-slate-200 border-l-4 border-red-500 pl-3 uppercase tracking-wider">
                Disliked / Removed
              </h2>
              <div className={`grid ${gridColsClass} gap-4 pt-2 items-start`}>
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
                          className={`text-slate-400 hover:text-white font-bold ${largeButtons ? "text-sm p-1" : "text-xs p-0.5"}`}
                          title="Restore"
                        >
                          ↺
                        </button>
                      </div>
                      <h3 className="text-xs font-bold text-white truncate" title={item.title}>
                        {item.title}
                      </h3>
                    </div>
                    <span className="text-[9px] text-slate-500 pt-2">Excluded from catalog</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {canScrollDown && (
        <div className="fixed bottom-4 left-0 right-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-0.5 bg-black/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-2xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white opacity-100">
              More History Below
            </span>
            <span className={`text-xl font-black animate-slow-glow ${getThemeArrowColor(appTheme)} opacity-100`}>
              ⌄
            </span>
          </div>
        </div>
      )}

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

const MovieCard = React.memo(function MovieCard({
  movie,
  appTheme,
  historyOverscale,
  largeButtons,
  onEyeballClick,
  onRemove,
}: {
  movie: ShowWatchHistory;
  appTheme: AppTheme;
  historyOverscale: HistoryScale | boolean;
  largeButtons: boolean;
  onEyeballClick: (showId: string, episodeId: string, episodeTitle: string, isCompleted: boolean) => void;
  onRemove: () => void;
}) {
  const navigate = useNavigate();
  const singleEp = Object.values(movie.episodes)[0] || { episodeId: `${movie.showId}-s1-e1`, title: movie.title, confirmedCompleted: false };
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

  const btnClass = largeButtons ? "h-7 px-2 text-xs" : "h-6 px-1.5 text-[10px]";
  const iconBtnClass = largeButtons ? "h-7 w-7 text-sm" : "h-6 w-6 text-xs";

  return (
    <div className="w-full">
      <div
        onClick={() => navigate({ to: "/details", search: { id: movie.showId, type: "movie" } })}
        className={`group relative rounded-xl border overflow-hidden shadow-xl flex flex-col justify-between transition hover:brightness-110 cursor-pointer ${getCardThemeStyles(appTheme)}`}
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950 shrink-0">
          {movie.posterPath ? (
            <img
              src={`${TMDB_IMAGE_BASE}${movie.posterPath}`}
              alt={movie.title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-center transition transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-2 text-center text-slate-500 text-xs font-bold">
              {movie.title}
            </div>
          )}

          <div className="absolute top-1.5 right-1.5 flex items-center gap-1.5 z-10" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onEyeballClick(movie.showId, singleEp.episodeId, movie.title, isCompleted)}
              className={`flex items-center justify-center rounded-lg bg-slate-950/90 text-white backdrop-blur-md border border-white/20 transition hover:scale-110 focus:outline-none font-bold ${btnClass}`}
              title="Toggle Status"
            >
              {isCompleted ? "👁️ ✓" : "👁️ ?"}
            </button>
            <button
              type="button"
              onClick={() => dislikeTitle({ id: movie.showId, title: movie.title, mediaType: "movie", posterPath: movie.posterPath })}
              className={`flex items-center justify-center rounded-lg bg-amber-950/90 text-amber-300 backdrop-blur-md border border-amber-500/30 transition hover:bg-amber-600 hover:text-white focus:outline-none font-bold ${iconBtnClass}`}
              title="Dislike & Hide Globally"
            >
              👎
            </button>
            <button
              type="button"
              onClick={onRemove}
              className={`flex items-center justify-center rounded-lg bg-red-950/90 text-red-300 backdrop-blur-md border border-red-500/30 transition hover:bg-red-600 hover:text-white focus:outline-none font-bold ${iconBtnClass}`}
              title="Remove from history"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-3 shrink-0">
          <h3 className="text-xs font-bold truncate text-white" title={movie.title}>
            {movie.title}
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">Movie</span>
        </div>
      </div>
    </div>
  );
});

const TvShowCard = React.memo(function TvShowCard({
  show,
  appTheme,
  historyOverscale,
  largeButtons,
  onEyeballClick,
  onRemove,
}: {
  show: ShowWatchHistory;
  appTheme: AppTheme;
  historyOverscale: HistoryScale | boolean;
  largeButtons: boolean;
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

  const iconBtnClass = largeButtons ? "h-7 w-7 text-sm" : "h-6 w-6 text-xs";

  return (
    <div className="w-full">
      <div
        onClick={() => navigate({ to: "/details", search: { id: show.showId, type: "tv" } })}
        className={`group relative rounded-xl border overflow-hidden shadow-xl flex flex-col justify-between transition hover:brightness-110 cursor-pointer ${getCardThemeStyles(appTheme)}`}
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950 shrink-0">
          {show.posterPath ? (
            <img
              src={`${TMDB_IMAGE_BASE}${show.posterPath}`}
              alt={show.title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-center transition transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-2 text-center text-slate-500 text-xs font-bold">
              {show.title}
            </div>
          )}

          <div className="absolute top-1.5 right-1.5 flex items-center gap-1.5 z-10" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => dislikeTitle({ id: show.showId, title: show.title, mediaType: "tv", posterPath: show.posterPath })}
              className={`flex items-center justify-center rounded-lg bg-amber-950/90 text-amber-300 backdrop-blur-md border border-amber-500/30 transition hover:bg-amber-600 hover:text-white focus:outline-none font-bold ${iconBtnClass}`}
              title="Dislike & Hide Globally"
            >
              👎
            </button>
            <button
              type="button"
              onClick={onRemove}
              className={`flex items-center justify-center rounded-lg bg-red-950/90 text-red-300 backdrop-blur-md border border-red-500/30 transition hover:bg-red-600 hover:text-white focus:outline-none font-bold ${iconBtnClass}`}
              title="Remove from history"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-3 space-y-2.5 shrink-0">
          <h3 className="text-xs font-bold truncate text-white" title={show.title}>
            {show.title}
          </h3>

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

          <div className="space-y-1 max-h-28 overflow-y-auto pr-0.5" onClick={(e) => e.stopPropagation()}>
            {episodesList.map((ep) => (
              <EpisodeRow
                key={ep.episodeId}
                episode={ep}
                largeButtons={largeButtons}
                onEyeballClick={() => onEyewayClickWrapper(show.showId, ep.episodeId, ep.title, ep.confirmedCompleted, onEyeballClick)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

function onEyewayClickWrapper(
  showId: string, 
  episodeId: string, 
  title: string, 
  isCompleted: boolean, 
  onEyeballClick: (sId: string, eId: string, t: string, comp: boolean) => void
) {
  onEyeballClick(showId, episodeId, title, isCompleted);
}

const EpisodeRow = React.memo(function EpisodeRow({
  episode,
  largeButtons,
  onEyeballClick,
}: {
  episode: { episodeId: string; seasonNumber: number; episodeNumber: number; title: string; confirmedCompleted: boolean };
  largeButtons: boolean;
  onEyeballClick: () => void;
}) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const rowBtnClass = largeButtons ? "h-7 px-2 text-xs" : "h-6 w-6 text-[10px]";

  return (
    <div className="flex items-center justify-between rounded-md bg-slate-950/60 px-2 py-1.5 border border-white/5 text-[11px]">
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
          className={`flex items-center justify-center rounded-md bg-slate-900 text-white border border-white/20 transition hover:scale-110 focus:outline-none font-bold ${rowBtnClass}`}
          aria-label="Toggle Status"
        >
          {episode.confirmedCompleted ? "👁️ ✓" : "👁️ ?"}
        </button>

        {isTooltipOpen && (
          <div className="absolute right-0 top-8 whitespace-nowrap rounded-lg bg-slate-950 px-2 py-1 text-[9px] font-bold text-white shadow-xl border border-white/20 z-20">
            Status: {episode.confirmedCompleted ? "Completed" : "Unconfirmed Completion"}
          </div>
        )}
      </div>
    </div>
  );
});
