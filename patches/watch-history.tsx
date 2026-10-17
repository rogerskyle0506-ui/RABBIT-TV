import React, { useState, useEffect } from "react";
import {
  getWatchHistory,
  calculateSeriesProgress,
  removeFromWatchHistory,
  getDislikedTitles,
  removeDislikedTitle,
  ShowWatchHistory,
  DislikedTitle,
} from "../lib/watch-history";

export default function WatchHistoryPage() {
  const [history, setHistory] = useState<Record<string, ShowWatchHistory>>({});
  const [dislikes, setDislikes] = useState<DislikedTitle[]>([]);
  const [selectedShow, setSelectedShow] = useState<ShowWatchHistory | null>(null);

  const loadData = () => {
    setHistory(getWatchHistory());
    setDislikes(getDislikedTitles());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("rabtv_watch_history_updated", loadData);
    window.addEventListener("rabtv_disliked_updated", loadData);
    return () => {
      window.removeEventListener("rabtv_watch_history_updated", loadData);
      window.removeEventListener("rabtv_disliked_updated", loadData);
    };
  }, []);

  const showsList = Object.values(history);

  if (selectedShow) {
    const currentShow = history[selectedShow.showId] || selectedShow;
    const episodes = Object.values(currentShow.episodes || {});
    const inProgress = episodes.filter((e) => !e.confirmedCompleted);
    const completed = episodes.filter((e) => e.confirmedCompleted);
    const progressPct = calculateSeriesProgress(currentShow);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <button
            onClick={() => setSelectedShow(null)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-white font-medium"
          >
            <span>← Back to Watch History</span>
          </button>
          <button
            onClick={() => {
              removeFromWatchHistory(currentShow.showId);
              setSelectedShow(null);
            }}
            className="px-4 py-2 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600/30 transition text-sm font-semibold"
          >
            Clear Entire Show
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 bg-zinc-900/60 p-6 rounded-2xl border border-white/10">
          {currentShow.posterPath && (
            <img
              src={`https://image.tmdb.org/t/p/w300${currentShow.posterPath}`}
              alt={currentShow.title}
              className="w-32 h-48 object-cover rounded-xl shadow-lg"
            />
          )}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{currentShow.title}</h1>
            <p className="text-zinc-400 text-sm">
              Overall Progress: <span className="text-white font-bold">{progressPct}%</span>
            </p>
            <div className="w-full bg-zinc-800 rounded-full h-3 max-w-md overflow-hidden border border-white/10">
              <div
                className="bg-purple-600 h-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-bold text-amber-400">In Progress / Uncompleted</h2>
          {inProgress.length === 0 ? (
            <p className="text-zinc-500 text-sm italic">No in-progress episodes.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {inProgress.map((ep) => (
                <div
                  key={ep.episodeId}
                  className="p-4 rounded-xl bg-zinc-900/80 border border-white/10 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-white text-sm">{ep.title}</h3>
                    <p className="text-xs text-zinc-400">
                      Season {ep.seasonNumber}, Episode {ep.episodeNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromWatchHistory(currentShow.showId, ep.episodeId)}
                    className="p-2 text-zinc-400 hover:text-red-400 text-xs"
                    title="Remove item"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-bold text-emerald-400">Completed</h2>
          {completed.length === 0 ? (
            <p className="text-zinc-500 text-sm italic">No completed episodes yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {completed.map((ep) => (
                <div
                  key={ep.episodeId}
                  className="p-4 rounded-xl bg-zinc-900/80 border border-emerald-900/30 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-white text-sm">{ep.title}</h3>
                    <p className="text-xs text-zinc-400">
                      Season {ep.seasonNumber}, Episode {ep.episodeNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromWatchHistory(currentShow.showId, ep.episodeId)}
                    className="p-2 text-zinc-400 hover:text-red-400 text-xs"
                    title="Remove item"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-white">Watch History</h1>

      {showsList.length === 0 && dislikes.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900/40 rounded-2xl border border-white/5">
          <p className="text-zinc-400 font-medium">Your watch history is currently empty.</p>
        </div>
      ) : (
        <>
          {showsList.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-zinc-200">Shows & Movies</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {showsList.map((show) => {
                  const progressPct = calculateSeriesProgress(show);
                  return (
                    <div
                      key={show.showId}
                      onClick={() => setSelectedShow(show)}
                      className="group cursor-pointer flex flex-col space-y-2 bg-zinc-900/60 p-2 rounded-xl border border-white/10 hover:border-white/30 transition transform hover:-translate-y-1"
                    >
                      <div className="aspect-[2/3] w-full relative overflow-hidden rounded-lg bg-zinc-800">
                        {show.posterPath ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w300${show.posterPath}`}
                            alt={show.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-2 text-center text-xs text-zinc-500">
                            {show.title}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 px-1">
                        <h3 className="text-xs font-semibold text-white truncate">{show.title}</h3>
                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span>Progress</span>
                          <span className="font-bold text-white">{progressPct}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden border border-white/10">
                          <div
                            className="bg-purple-500 h-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {dislikes.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-white/10">
              <h2 className="text-xl font-bold text-red-400">Disliked Titles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {dislikes.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-zinc-900/80 border border-red-900/30 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                      <p className="text-xs text-zinc-400 capitalize">{item.mediaType}</p>
                    </div>
                    <button
                      onClick={() => removeDislikedTitle(item.id)}
                      className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
