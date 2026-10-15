import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppTheme, getSavedTheme } from "@/lib/settings";

const WATCH_HISTORY_STORAGE_KEY = "rabtv_watch_history";
const MY_LIST_STORAGE_KEY = "rabtv_my_list";
const FAVORITES_STORAGE_KEY = "rabtv_favorites";

export const Route = createFileRoute("/details")({
  component: DetailsPage,
});

export function DetailsPage() {
  const search = Route.useSearch() as { id?: string; type?: string };
  const mediaId = search?.id;
  const mediaType = search?.type || "movie";

  const [mediaDetails, setMediaDetails] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  // Active App Theme State synced with root.tsx
  const [appTheme, setAppTheme] = useState<AppTheme>("violet");

  // List Status State
  const [inMyList, setInMyList] = useState(false);
  const [inFavorites, setInFavorites] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // TV Series Episode State
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [autoPlayNext, setAutoPlayNext] = useState(true);

  // Sync Theme with global settings store
  useEffect(() => {
    const loadTheme = () => {
      setAppTheme(getSavedTheme());
    };

    loadTheme();
    window.addEventListener("storage", loadTheme);
    window.addEventListener("rabtv_settings_updated" as any, loadTheme);

    return () => {
      window.removeEventListener("storage", loadTheme);
      window.removeEventListener("rabtv_settings_updated" as any, loadTheme);
    };
  }, []);

  // Theme-aware helpers matching root.tsx
  const getPageBackground = (theme: AppTheme) => {
    switch (theme) {
      case "red":
        return "bg-[#120202]";
      case "midnight":
        return "bg-[#020617]";
      case "violet":
      default:
        return "bg-[#050b16]";
    }
  };

  const getCardBackground = (theme: AppTheme) => {
    switch (theme) {
      case "red":
        return "bg-[#160404] border-red-500/20";
      case "midnight":
        return "bg-[#03091e] border-blue-500/20";
      case "violet":
      default:
        return "bg-[#090e1f] border-violet-500/20";
    }
  };

  const getThemeClasses = (theme: AppTheme) => {
    switch (theme) {
      case "red":
        return {
          text: "text-red-400",
          bg: "bg-red-600",
          hoverBg: "hover:bg-red-500",
          border: "border-red-500",
          ring: "focus:ring-red-400",
          shadow: "shadow-red-600/30",
        };
      case "midnight":
        return {
          text: "text-blue-400",
          bg: "bg-blue-600",
          hoverBg: "hover:bg-blue-500",
          border: "border-blue-500",
          ring: "focus:ring-blue-400",
          shadow: "shadow-blue-600/30",
        };
      case "violet":
      default:
        return {
          text: "text-violet-400",
          bg: "bg-violet-600",
          hoverBg: "hover:bg-violet-500",
          border: "border-violet-500",
          ring: "focus:ring-violet-400",
          shadow: "shadow-violet-600/30",
        };
    }
  };

  const activeTheme = getThemeClasses(appTheme);

  // Check saved state for My List & Favorites
  useEffect(() => {
    if (!mediaId) return;
    const currentId = `${mediaType}-${mediaId}`;

    try {
      const myList = JSON.parse(localStorage.getItem(MY_LIST_STORAGE_KEY) || "[]");
      setInMyList(myList.some((item: any) => item.id === currentId));

      const favs = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]");
      setInFavorites(favs.some((item: any) => item.id === currentId));
    } catch (err) {
      console.error("Error reading saved catalog lists", err);
    }
  }, [mediaId, mediaType]);

  // Fetch item details + cast with LocalStorage Caching (6-hour expiry)
  useEffect(() => {
    async function fetchDetailsWithCache() {
      if (!mediaId) return;
      const cacheKey = `rabtv_cache_${mediaType}_${mediaId}`;

      try {
        const cachedItem = localStorage.getItem(cacheKey);
        if (cachedItem) {
          const { data, timestamp } = JSON.parse(cachedItem);
          if (Date.now() - timestamp < 21600000) {
            setMediaDetails(data);
            setLoading(false);
            return;
          }
        }

        const apiKey =
          (import.meta.env.VITE_TMDB_API_KEY as string) || "9619884fc9c0e58b374a661ab2a692cd";

        const res = await fetch(
          `https://api.themoviedb.org/3/${mediaType}/${mediaId}?api_key=${apiKey}&append_to_response=credits`
        );
        const data = await res.json();

        localStorage.setItem(
          cacheKey,
          JSON.stringify({ data, timestamp: Date.now() })
        );

        setMediaDetails(data);
      } catch (err) {
        console.error("Failed to load details", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetailsWithCache();
  }, [mediaId, mediaType]);

  const buildCatalogItem = () => ({
    id: `${mediaType}-${mediaId}`,
    mediaId: String(mediaId),
    title: mediaDetails?.title || mediaDetails?.name || "Untitled",
    description: mediaDetails?.overview || "",
    image: mediaDetails?.poster_path
      ? `https://image.tmdb.org/t/p/w500${mediaDetails.poster_path}`
      : "",
    href: `/details?id=${mediaId}&type=${mediaType}`,
    year: (mediaDetails?.release_date || mediaDetails?.first_air_date || "").split("-")[0],
    rating: mediaDetails?.vote_average ? mediaDetails.vote_average.toFixed(1) : undefined,
    mediaType: mediaType as "movie" | "tv",
    genreIds: mediaDetails?.genres?.map((g: any) => g.id) || [],
  });

  const handlePlay = () => {
    setIsPlaying(true);
    if (!mediaDetails) return;

    try {
      const savedHistory = localStorage.getItem(WATCH_HISTORY_STORAGE_KEY);
      const history = savedHistory ? JSON.parse(savedHistory) : [];
      const newItem = buildCatalogItem();

      const updatedHistory = [
        newItem,
        ...history.filter((i: any) => i.id !== newItem.id),
      ].slice(0, 20);

      localStorage.setItem(
        WATCH_HISTORY_STORAGE_KEY,
        JSON.stringify(updatedHistory)
      );
    } catch (err) {
      console.error("Could not save to watch history", err);
    }
  };

  const toggleMyList = () => {
    if (!mediaDetails) return;
    const item = buildCatalogItem();

    try {
      const myList = JSON.parse(localStorage.getItem(MY_LIST_STORAGE_KEY) || "[]");
      let updatedList = [];

      if (inMyList) {
        updatedList = myList.filter((i: any) => i.id !== item.id);
        setInMyList(false);
        triggerFeedback("Removed from My List");
      } else {
        updatedList = [item, ...myList.filter((i: any) => i.id !== item.id)];
        setInMyList(true);
        triggerFeedback("Saved to My List!");
      }

      localStorage.setItem(MY_LIST_STORAGE_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(new Event("rabtv_catalog_updated"));
    } catch (err) {
      console.error("Failed to update My List", err);
    }
  };

  const toggleFavorites = () => {
    if (!mediaDetails) return;
    const item = buildCatalogItem();

    try {
      const favs = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]");
      let updatedFavs = [];

      if (inFavorites) {
        updatedFavs = favs.filter((i: any) => i.id !== item.id);
        setInFavorites(false);
        triggerFeedback("Removed from Favorites");
      } else {
        updatedFavs = [item, ...favs.filter((i: any) => i.id !== item.id)];
        setInFavorites(true);
        triggerFeedback("Added to Favorites!");
      }

      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavs));
      window.dispatchEvent(new Event("rabtv_catalog_updated"));
    } catch (err) {
      console.error("Failed to update Favorites", err);
    }
  };

  const triggerFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 2500);
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${getPageBackground(appTheme)} text-white`}>
        <p className={`text-xl font-medium animate-pulse ${activeTheme.text}`}>
          Loading title details...
        </p>
      </div>
    );
  }

  const title = mediaDetails?.title || mediaDetails?.name || "Sample Content";
  const overview = mediaDetails?.overview || "No description available for this title.";
  const poster = mediaDetails?.poster_path
    ? `https://image.tmdb.org/t/p/w500${mediaDetails.poster_path}`
    : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80";
  const releaseYear = (mediaDetails?.release_date || mediaDetails?.first_air_date || "").split("-")[0];
  const rating = mediaDetails?.vote_average ? mediaDetails.vote_average.toFixed(1) : "N/A";
  const genres = mediaDetails?.genres?.map((g: any) => g.name).join(", ") || "Entertainment";

  const embedUrl =
    mediaType === "tv"
      ? `https://vidsrc.to/embed/tv/${mediaId}/${season}/${episode}`
      : `https://vidsrc.to/embed/movie/${mediaId}`;

  return (
    <div className={`min-h-screen w-full ${getPageBackground(appTheme)} p-6 text-white md:p-12 overflow-y-auto scroll-smooth transition-colors duration-300`}>
      <Link
        className={`mb-6 inline-flex items-center gap-2 text-sm font-semibold ${activeTheme.text} transition hover:opacity-80 hover:underline focus:outline-none focus:ring-4 ${activeTheme.ring} focus:rounded-lg px-2 py-1`}
        to="/"
      >
        ← Back to Home
      </Link>

      {isPlaying ? (
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          {mediaType === "tv" && (
            <div className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border ${getCardBackground(appTheme)} p-4 backdrop-blur`}>
              <div className="flex items-center gap-4 text-sm font-semibold">
                <label className="flex items-center gap-2">
                  <span>Season:</span>
                  <input
                    type="number"
                    min="1"
                    value={season}
                    onChange={(e) => setSeason(Math.max(1, parseInt(e.target.value) || 1))}
                    className={`w-16 rounded-lg border border-white/10 bg-slate-800 px-2 py-1 text-center text-white focus:outline-none focus:ring-4 ${activeTheme.ring}`}
                  />
                </label>

                <label className="flex items-center gap-2">
                  <span>Episode:</span>
                  <input
                    type="number"
                    min="1"
                    value={episode}
                    onChange={(e) => setEpisode(Math.max(1, parseInt(e.target.value) || 1))}
                    className={`w-16 rounded-lg border border-white/10 bg-slate-800 px-2 py-1 text-center text-white focus:outline-none focus:ring-4 ${activeTheme.ring}`}
                  />
                </label>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEpisode((prev) => Math.max(1, prev - 1))}
                  disabled={episode <= 1}
                  className={`rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-40 focus:outline-none focus:ring-4 ${activeTheme.ring}`}
                >
                  ◀ Previous
                </button>

                <button
                  type="button"
                  onClick={() => setEpisode((prev) => prev + 1)}
                  className={`rounded-xl ${activeTheme.bg} px-4 py-2 text-xs font-semibold text-white shadow transition ${activeTheme.hoverBg} focus:outline-none focus:ring-4 ${activeTheme.ring}`}
                >
                  Next Episode ▶
                </button>

                <label className="ml-2 flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPlayNext}
                    onChange={(e) => setAutoPlayNext(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-violet-600 focus:ring-violet-500 focus:outline-none"
                  />
                  Autoplay Next
                </label>
              </div>
            </div>
          )}

          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl shadow-black/50 border border-white/10">
            <iframe
              key={`${mediaType}-${mediaId}-${season}-${episode}`}
              srcDoc={`
                <!DOCTYPE html>
                <html>
                  <head>
                    <style>
                      body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
                      iframe { width: 100%; height: 100%; border: none; }
                    </style>
                    <script>
                      window.open = function() { console.log("Blocked timed popup injection"); return null; };
                      window.alert = function() {};
                      window.confirm = function() { return true; };
                    </script>
                  </head>
                  <body>
                    <iframe 
                      src="${embedUrl}" 
                      allowfullscreen 
                      allow="autoplay; encrypted-media; picture-in-picture; accelerometer; gyroscope"
                    ></iframe>
                  </body>
                </html>
              `}
              className="h-full w-full border-0"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture; accelerometer; gyroscope"
            ></iframe>
          </div>

          <div className={`flex flex-col gap-4 rounded-2xl border ${getCardBackground(appTheme)} p-6 backdrop-blur`}>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="text-sm leading-relaxed text-slate-300">{overview}</p>
          </div>
        </div>
      ) : (
        /* Overview Card */
        <div className="mx-auto flex max-w-5xl flex-col gap-8 md:flex-row md:items-start">
          <img
            src={poster}
            alt={title}
            className="h-[450px] w-[300px] rounded-2xl object-cover shadow-2xl shadow-black/40 border border-white/10 self-center md:self-start"
          />

          <div className="flex flex-col justify-center gap-4">
            <span className={`w-fit rounded-full border ${activeTheme.border}/30 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider ${activeTheme.text}`}>
              {genres}
            </span>

            <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
              {title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-slate-300">
              {rating !== "N/A" && (
                <span className="flex items-center gap-1 font-bold text-yellow-300">
                  ⭐ {rating}
                </span>
              )}
              {releaseYear && <span>{releaseYear}</span>}
              <span className="uppercase rounded-md bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 border border-white/10">
                {mediaType}
              </span>
            </div>

            <p className="max-w-2xl text-base leading-relaxed text-slate-300">
              {overview}
            </p>

            {/* Action Bar */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handlePlay}
                className={`flex items-center gap-2 rounded-full ${activeTheme.bg} px-8 py-4 text-lg font-bold text-white shadow-lg ${activeTheme.shadow} transition ${activeTheme.hoverBg} active:scale-95 focus:outline-none focus:ring-4 ${activeTheme.ring} focus:scale-105`}
              >
                ▶ Play {mediaType === "tv" ? `S${season}:E${episode}` : ""}
              </button>

              <button
                type="button"
                onClick={toggleMyList}
                className={`flex items-center gap-2 rounded-full border px-6 py-4 text-sm font-bold transition focus:outline-none focus:ring-4 ${activeTheme.ring} ${
                  inMyList
                    ? `${activeTheme.border} bg-white/10${activeTheme.text}`
                    : "border-white/20 bg-slate-800/80 text-slate-200 hover:bg-slate-700"
                }`}
              >
                {inMyList ? "✓ In My List" : "🔖 + Save to My List"}
              </button>

              <button
                type="button"
                onClick={toggleFavorites}
                className={`flex items-center gap-2 rounded-full border px-6 py-4 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-amber-400 ${
                  inFavorites
                    ? "border-amber-500 bg-amber-950/80 text-amber-300 shadow-lg shadow-amber-500/20"
                    : "border-white/20 bg-slate-800/80 text-slate-200 hover:bg-slate-700"
                }`}
              >
                {inFavorites ? "★ In Favorites" : "⭐ Add Favorite"}
              </button>
            </div>

            {actionFeedback && (
              <p className={`text-xs font-semibold ${activeTheme.text} transition animate-fade-in`}>
                {actionFeedback}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
