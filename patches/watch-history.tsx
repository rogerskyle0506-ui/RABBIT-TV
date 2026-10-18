import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  getWatchHistory,
  markAsConfirmedCompleted,
  removeFromWatchHistory,
  WatchHistoryItem,
} from "@/lib/watch-history";

export const Route = createFileRoute("/watch-history")({
  component: WatchHistoryComponent,
});

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

function WatchHistoryComponent() {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [verifyingItem, setVerifyingItem] = useState<WatchHistoryItem | null>(null);

  const refreshHistory = () => {
    setHistory(getWatchHistory());
  };

  useEffect(() => {
    refreshHistory();
    window.addEventListener("rabtv_watch_history_updated", refreshHistory);
    return () => {
      window.removeEventListener("rabtv_watch_history_updated", refreshHistory);
    };
  }, []);

  const handleEyeballClick = (item: WatchHistoryItem) => {
    if (!item.confirmedCompleted) {
      setVerifyingItem(item);
    } else {
      // Toggle back if needed
      markAsConfirmedCompleted(item.id, false);
    }
  };

  const handleConfirmModal = (completed: boolean) => {
    if (verifyingItem) {
      markAsConfirmedCompleted(verifyingItem.id, completed);
      setVerifyingItem(null);
    }
  };

  const movies = history.filter((h) => h.mediaType === "movie");
  const tvShows = history.filter((h) => h.mediaType === "tv");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 text-white space-y-8">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h1 className="text-2xl font-black tracking-wide flex items-center gap-2">
          <span>🕒</span> Watch History
        </h1>
        <span className="text-xs text-slate-400 font-semibold">
          {history.length} {history.length === 1 ? "Item" : "Items"} Tracked
        </span>
      </div>

      {history.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-12 text-center text-slate-400">
          <p className="text-lg font-bold">No watch history recorded yet.</p>
          <p className="text-xs mt-1">Start watching movies or shows to automatically track progress.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* MOVIES SECTION */}
          {movies.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-slate-200 border-l-4 border-violet-500 pl-3">
                Movies
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {movies.map((item) => (
                  <MovieCard
                    key={item.id}
                    item={item}
                    onEyeballClick={() => handleEyeballClick(item)}
                    onRemove={() => removeFromWatchHistory(item.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* TV SHOWS SECTION */}
          {tvShows.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-slate-200 border-l-4 border-blue-500 pl-3">
                TV Shows
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tvShows.map((item) => (
                  <TvShowCard
                    key={item.id}
                    item={item}
                    onEyeballClick={() => handleEyeballClick(item)}
                    onRemove={() => removeFromWatchHistory(item.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* VERIFICATION MODAL */}
      {verifyingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl text-center">
            <div className="text-4xl">👁️</div>
            <h3 className="text-xl font-bold text-white">Verify Completion</h3>
            <p className="text-sm text-slate-300">
              Did you complete watching <strong className="text-violet-400">{verifyingItem.title}</strong>?
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleConfirmModal(true)}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-sm font-bold text-white shadow-lg transition"
              >
                Yes, Completed (✓)
              </button>
              <button
                type="button"
                onClick={() => handleConfirmModal(false)}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 py-3 text-sm font-bold text-slate-300 transition"
              >
                No, In Progress (?)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MovieCard({
  item,
  onEyeballClick,
  onRemove,
}: {
  item: WatchHistoryItem;
  onEyeballClick: () => void;
  onRemove: () => void;
}) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  return (
    <div className="group relative rounded-2xl border border-white/10 bg-slate-900/80 overflow-hidden shadow-xl flex flex-col justify-between transition hover:border-violet-500/40">
      {/* Cover Art */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
        {item.posterPath ? (
          <img
            src={`${TMDB_IMAGE_BASE}${item.posterPath}`}
            alt={item.title}
            className="h-full w-full object-cover transition transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-600 text-xs font-bold">
            NO COVER ART
          </div>
        )}

        {/* Action Controls (Eyeball + Dislike X) */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
          {/* Eyeball / Status Indicator */}
          <div className="relative">
            <button
              type="button"
              onClick={onEyeballClick}
              onMouseEnter={() => setIsTooltipOpen(true)}
              onMouseLeave={() => setIsTooltipOpen(false)}
              onFocus={() => setIsTooltipOpen(true)}
              onBlur={() => setIsTooltipOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950/80 text-white backdrop-blur-md border border-white/20 transition hover:scale-110 focus:outline-none"
              aria-label="Toggle Status"
            >
              {item.confirmedCompleted ? "👁️ ✓" : "👁️ ?"}
            </button>

            {/* Hover / D-Pad Focus Submenu Tooltip */}
            {isTooltipOpen && (
              <div className="absolute right-0 top-10 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1 text-[10px] font-bold text-white shadow-xl border border-white/20 z-20">
                Status: {item.confirmedCompleted ? "Completed" : "Unconfirmed Completion"}
              </div>
            )}
          </div>

          {/* Dislike / Delete Button */}
          <button
            type="button"
            onClick={onRemove}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-950/80 text-red-300 backdrop-blur-md border border-red-500/30 transition hover:bg-red-600 hover:text-white focus:outline-none"
            title="Remove / Dislike"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Card Info & Progress Bar */}
      <div className="p-3 space-y-2">
        <h3 className="text-sm font-bold truncate text-white" title={item.title}>
          {item.title}
        </h3>
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-bold text-slate-400">
            <span>Progress</span>
            <span>{item.progressPercent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden border border-white/5">
            <div
              className={`h-full transition-all duration-300 ${
                item.confirmedCompleted ? "bg-emerald-500" : "bg-violet-500"
              }`}
              style={{ width: `${item.progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TvShowCard({
  item,
  onEyeballClick,
  onRemove,
}: {
  item: WatchHistoryItem;
  onEyeballClick: () => void;
  onRemove: () => void;
}) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  return (
    <div className="group relative rounded-2xl border border-white/10 bg-slate-900/80 overflow-hidden shadow-xl flex flex-col justify-between transition hover:border-blue-500/40">
      {/* Cover Art */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
        {item.posterPath ? (
          <img
            src={`${TMDB_IMAGE_BASE}${item.posterPath}`}
            alt={item.title}
            className="h-full w-full object-cover transition transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-600 text-xs font-bold">
            NO COVER ART
          </div>
        )}

        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
          <div className="relative">
            <button
              type="button"
              onClick={onEyeballClick}
              onMouseEnter={() => setIsTooltipOpen(true)}
              onMouseLeave={() => setIsTooltipOpen(false)}
              onFocus={() => setIsTooltipOpen(true)}
              onBlur={() => setIsTooltipOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950/80 text-white backdrop-blur-md border border-white/20 transition hover:scale-110 focus:outline-none"
              aria-label="Toggle Status"
            >
              {item.confirmedCompleted ? "👁️ ✓" : "👁️ ?"}
            </button>

            {isTooltipOpen && (
              <div className="absolute right-0 top-10 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1 text-[10px] font-bold text-white shadow-xl border border-white/20 z-20">
                Status: {item.confirmedCompleted ? "Completed" : "Unconfirmed Completion"}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onRemove}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-950/80 text-red-300 backdrop-blur-md border border-red-500/30 transition hover:bg-red-600 hover:text-white focus:outline-none"
            title="Remove / Dislike"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Card Info, Season/Episode Indicators & Progress Bar */}
      <div className="p-3 space-y-2">
        <h3 className="text-sm font-bold truncate text-white" title={item.title}>
          {item.title}
        </h3>
        {(item.seasonNumber !== undefined || item.episodeNumber !== undefined) && (
          <p className="text-[11px] font-semibold text-blue-400">
            {item.seasonNumber ? `S${item.seasonNumber}` : ""} {item.episodeNumber ? `E${item.episodeNumber}` : ""}
          </p>
        )}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-bold text-slate-400">
            <span>Progress</span>
            <span>{item.progressPercent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden border border-white/5">
            <div
              className={`h-full transition-all duration-300 ${
                item.confirmedCompleted ? "bg-emerald-500" : "bg-blue-500"
              }`}
              style={{ width: `${item.progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
