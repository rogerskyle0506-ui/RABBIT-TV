import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  getWatchHistory,
  markEpisodeCompleted,
  removeFromWatchHistory,
  calculateSeriesProgress,
  ShowWatchHistory,
} from "@/lib/watch-history";

export const Route = createFileRoute("/watch-history")({
  component: WatchHistoryComponent,
});

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

function WatchHistoryComponent() {
  const [historyMap, setHistoryMap] = useState<Record<string, ShowWatchHistory>>({});
  const [verifyingTarget, setVerifyingTarget] = useState<{ showId: string; episodeId: string; title: string } | null>(null);

  const refreshHistory = () => {
    setHistoryMap(getWatchHistory());
  };

  useEffect(() => {
    refreshHistory();
    window.addEventListener("rabtv_watch_history_updated", refreshHistory);
    return () => {
      window.removeEventListener("rabtv_watch_history_updated", refreshHistory);
    };
  }, []);

  const handleEyeballClick = (showId: string, episodeId: string, episodeTitle: string, isCompleted: boolean) => {
    if (!isCompleted) {
      setVerifyingTarget({ showId, episodeId, title: episodeTitle });
    } else {
      markEpisodeCompleted(showId, episodeId, false);
      refreshHistory();
    }
  };

  const handleConfirmModal = (completed: boolean) => {
    if (verifyingTarget) {
      markEpisodeCompleted(verifyingTarget.showId, verifyingTarget.episodeId, completed);
      setVerifyingTarget(null);
      refreshHistory();
    }
  };

  const shows = Object.values(historyMap);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 text-white space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h1 className="text-xl font-bold tracking-wide flex items-center gap-2">
          <span>🕒</span> Watch History
        </h1>
        <span className="text-xs text-slate-400 font-semibold">
          {shows.length} {shows.length === 1 ? "Title" : "Titles"} Tracked
        </span>
      </div>

      {shows.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-slate-900/50 p-8 text-center text-slate-400">
          <p className="text-sm font-bold">No watch history recorded yet.</p>
          <p className="text-xs mt-1">Start watching media to automatically track progress.</p>
        </div>
      ) : (
        /* Scaled down grid matching the app's standard catalog card sizing */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {shows.map((show) => {
            const progress = calculateSeriesProgress(show);
            const episodesList = Object.values(show.episodes);

            return (
              <div
                key={show.showId}
                className="group relative rounded-xl border border-white/10 bg-slate-900/90 overflow-hidden shadow-md flex flex-col justify-between transition hover:border-violet-500/50"
              >
                {/* Scaled Poster Container */}
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

                  {/* Dislike / Delete Button */}
                  <div className="absolute top-1.5 right-1.5 z-10">
                    <button
                      type="button"
                      onClick={() => {
                        removeFromWatchHistory(show.showId);
                        refreshHistory();
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-950/80 text-red-300 backdrop-blur-md border border-red-500/30 transition hover:bg-red-600 hover:text-white focus:outline-none text-xs font-bold"
                      title="Remove / Dislike"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Card Info & Breakdown */}
                <div className="p-2.5 space-y-2">
                  <h3 className="text-xs font-bold truncate text-white" title={show.title}>
                    {show.title}
                  </h3>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden border border-white/5">
                      <div
                        className={`h-full transition-all duration-300 ${
                          progress === 100 ? "bg-emerald-500" : "bg-violet-500"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Compact Episode Sub-list */}
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-0.5 custom-scrollbar">
                    {episodesList.map((ep) => (
                      <EpisodeRow
                        key={ep.episodeId}
                        episode={ep}
                        onEyeballClick={() =>
                          handleEyeballClick(show.showId, ep.episodeId, ep.title, ep.confirmedCompleted)
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
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
