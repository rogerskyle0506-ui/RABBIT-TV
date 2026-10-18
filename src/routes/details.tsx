import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
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
  
  // Dynamic mediaType state that can be corrected immediately upon data fetch
  const [mediaType, setMediaType] = useState<string>(search?.type || "movie");

  const [mediaDetails, setMediaDetails] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  // Active App Theme State synced with root.tsx
  const [appTheme, setAppTheme] = useState<AppTheme>("violet");

  // List Status State
  const [inMyList, setInMyList] = useState(false);
  const [inFavorites, setInFavorites] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // TV Series Episode State & Season Episodes List
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [seasonEpisodes, setSeasonEpisodes] = useState<any[]>([]);
  const [autoPlayNext, setAutoPlayNext] = useState(true);

  // Custom Dropdown Open States
  const [isSeasonOpen, setIsSeasonOpen] = useState(false);
  const [isEpisodeOpen, setIsEpisodeOpen] = useState(false);

  const seasonRef = useRef<HTMLDivElement>(null);
  const episodeRef = useRef<HTMLDivElement>(null);

  // Close custom dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (seasonRef.current && !seasonRef.current.contains(event.target as Node)) {
        setIsSeasonOpen(false);
      }
      if (episodeRef.current && !episodeRef.current.contains(event.target as Node)) {
        setIsEpisodeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Fetch episodes dynamically whenever the selected season changes for a TV show
  useEffect(() => {
    async function fetchSeasonEpisodes() {
      if (mediaType !== "tv" || !mediaId) return;
      try {
        const apiKey =
          (import.meta.env.VITE_TMDB_API_KEY as string) || "9619884fc9c0e58b374a661ab2a692cd";
        const res = await fetch(
          `https://api.themoviedb.org/3/tv/${mediaId}/season/${season}?api_key=${apiKey}`
        );
        const data = await res.json();
        if (data.episodes) {
          setSeasonEpisodes(data.episodes);
        } else {
          setSeasonEpisodes([]);
        }
      } catch (err) {
        console.error("Failed to load season episodes", err);
        setSeasonEpisodes([]);
      }
    }
    fetchSeasonEpisodes();
  }, [season, mediaId, mediaType]);

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

  // Fetch item details + cast with LocalStorage Caching (6-hour expiry) & Type Auto-Correction
  useEffect(() => {
    async function fetchDetailsWithCache() {
      if (!mediaId) return;
      
      // Try fetching as current mediaType first, or try 'tv' if search didn't specify
      let activeFetchType = mediaType;
      const cacheKey = `rabtv_cache_${activeFetchType}_${mediaId}`;

      try {
        const cachedItem = localStorage.getItem(cacheKey);
        if (cachedItem) {
          const { data, timestamp } = JSON.parse(cachedItem);
          if (Date.now() - timestamp < 21600000) {
            if (data?.seasons) {
              setMediaType("tv");
            }
            setMediaDetails(data);
            setLoading(false);
            return;
          }
        }

        const apiKey =
          (import.meta.env.VITE_TMDB_API_KEY as string) || "9619884fc9c0e58b374a661ab2a692cd";

        let res = await fetch(
          `https://api.themoviedb.org/3/${activeFetchType}/${mediaId}?api_key=${apiKey}&append_to_response=credits`
        );
        let data = await res.json();

        // Fallback: If it failed or has no title/overview and we assumed movie, try fetching as TV!
        if ((!data || data.success === false) && activeFetchType === "movie") {
          activeFetchType = "tv";
          res = await fetch(
            `https://api.themoviedb.org/3/tv/${mediaId}?api_key=${apiKey}&append_to_response=credits`
          );
          data = await res.json();
        }

        // Lock in tv type if seasons exist
        if (data?.seasons || activeFetchType === "tv") {
          setMediaType("tv");
        }

        localStorage.setItem(
          `rabtv_cache_${activeFetchType}_${mediaId}`,
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

  // Robust inferred type check
  const inferredMediaType = mediaDetails?.seasons || mediaType === "tv" ? "tv" : "movie";

  const buildCatalogItem = () => ({
    id: `${inferredMediaType}-${mediaId}`,
    mediaId: String(mediaId),
    title: mediaDetails?.title || mediaDetails?.name || "Untitled",
    description: mediaDetails?.overview || "",
    image: mediaDetails?.poster_path
      ? `https://image.tmdb.org/t/p/w500${mediaDetails.poster_path}`
      : "",
    href: `/details?id=${mediaId}&type=${inferredMediaType}`,
    year: (mediaDetails?.release_date || mediaDetails?.first_air_date || "").split("-")[0],
    rating: mediaDetails?.vote_average ? mediaDetails.vote_average.toFixed(1) : undefined,
    mediaType: inferredMediaType as "movie" | "tv",
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
      window.dispatchEvent(new Event("rabtv_watch_history_updated"));
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
    inferredMediaType === "tv"
      ? `https://vidsrc.to/embed/tv/${mediaId}/${season}/${episode}`
      : `https://vidsrc.to/embed/movie/${mediaId}`;

  const currentSeasonObj = mediaDetails?.seasons?.find((s: any) => s.season_number === season);
  const currentEpisodeObj = seasonEpisodes?.find((e: any) => e.episode_number === episode);

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
          {inferredMediaType === "tv" && (
            <div className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border ${getCardBackground(appTheme)} p-4 backdrop-blur`}>
              <div className="flex flex-wrap items-center gap-4 text-sm font-semibold relative">
                
                {/* Custom Active Player Season Dropdown */}
                <div className="relative" ref={seasonRef}>
                  <span className="block text-xs text-slate-400 mb-1">Season</span>
                  <button
                    type="button"
                    onClick={() => setIsSeasonOpen(!isSeasonOpen)}
                    className={`flex items-center justify-between gap-3 rounded-xl border border-white/10 ${getCardBackground(appTheme)} px-4 py-2 text-white font-medium focus:outline-none focus:ring-4 ${activeTheme.ring}`}
                  >
                    <span>{currentSeasonObj ? currentSeasonObj.name : `Season ${season}`}</span>
                    <span>▾</span>
                  </button>

                  {isSeasonOpen && (
                    <div className={`absolute left-0 mt-2 z-50 max-h-60 w-56 overflow-y-auto rounded-xl border border-white/20 ${getCardBackground(appTheme)} shadow-2xl backdrop-blur p-1`}>
                      {mediaDetails?.seasons
                        ?.filter((s: any) => s.season_number > 0)
                        .map((s: any) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setSeason(s.season_number);
                              setEpisode(1);
                              setIsSeasonOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition ${
                              season === s.season_number ? `${activeTheme.bg} text-white font-bold` : "text-slate-200 hover:bg-white/10"
                            }`}
                          >
                            {s.name} ({s.episode_count} Eps)
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Custom Active Player Episode Dropdown */}
                <div className="relative" ref={episodeRef}>
                  <span className="block text-xs text-slate-400 mb-1">Episode</span>
                  <button
                    type="button"
                    onClick={() => setIsEpisodeOpen(!isEpisodeOpen)}
                    className={`flex items-center justify-between gap-3 rounded-xl border border-white/10 ${getCardBackground(appTheme)} px-4 py-2 text-white font-medium focus:outline-none focus:ring-4 ${activeTheme.ring}`}
                  >
                    <span>{currentEpisodeObj ? `Ep ${currentEpisodeObj.episode_number}: ${currentEpisodeObj.name}` : `Episode ${episode}`}</span>
                    <span>▾</span>
                  </button>

                  {isEpisodeOpen && (
                    <div className={`absolute left-0 mt-2 z-50 max-h-60 w-72 overflow-y-auto rounded-xl border border-white/20 ${getCardBackground(appTheme)} shadow-2xl backdrop-blur p-1`}>
                      {seasonEpisodes.length > 0 ? (
                        seasonEpisodes.map((ep: any) => (
                          <button
                            key={ep.id}
                            type="button"
                            onClick={() => {
                              setEpisode(ep.episode_number);
                              setIsEpisodeOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition ${
                              episode === ep.episode_number ? `${activeTheme.bg} text-white font-bold` : "text-slate-200 hover:bg-white/10"
                            }`}
                          >
                            Ep {ep.episode_number}: {ep.name}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-slate-400">Loading episodes...</div>
                      )}
                    </div>
                  )}
                </div>

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
              key={`${inferredMediaType}-${mediaId}-${season}-${episode}`}
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
        /* Overview Card with Custom Theme-Aware Dropdown Pickers */
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
                {inferredMediaType}
              </span>
            </div>

            <p className="max-w-2xl text-base leading-relaxed text-slate-300">
              {overview}
            </p>

            {/* Custom Theme-Aware Season & Episode Dropdown Pickers for TV Series */}
            {inferredMediaType === "tv" && mediaDetails?.seasons && (
              <div className={`flex flex-wrap items-center gap-4 rounded-2xl border ${getCardBackground(appTheme)} p-4 backdrop-blur my-2`}>
                
                {/* Custom Season Dropdown */}
                <div className="relative" ref={seasonRef}>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Select Season</label>
                  <button
                    type="button"
                    onClick={() => setIsSeasonOpen(!isSeasonOpen)}
                    className={`flex items-center justify-between gap-6 rounded-xl border border-white/20 ${getCardBackground(appTheme)} px-4 py-2.5 text-sm font-medium text-white shadow-lg focus:outline-none focus:ring-4 ${activeTheme.ring}`}
                  >
                    <span>{currentSeasonObj ? `${currentSeasonObj.name} (${currentSeasonObj.episode_count} Episodes)` : `Season ${season}`}</span>
                    <span>▾</span>
                  </button>

                  {isSeasonOpen && (
                    <div className={`absolute left-0 mt-2 z-50 max-h-65 w-72 overflow-y-auto rounded-xl border border-white/20 ${getCardBackground(appTheme)} shadow-2xl backdrop-blur p-1`}>
                      {mediaDetails.seasons
                        .filter((s: any) => s.season_number > 0)
                        .map((s: any) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setSeason(s.season_number);
                              setEpisode(1);
                              setIsSeasonOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition ${
                              season === s.season_number ? `${activeTheme.bg} text-white font-bold` : "text-slate-200 hover:bg-white/10"
                            }`}
                          >
                            {s.name} ({s.episode_count} Episodes)
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Custom Episode Dropdown */}
                <div className="relative" ref={episodeRef}>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Select Episode</label>
                  <button
                    type="button"
                    onClick={() => setIsEpisodeOpen(!isEpisodeOpen)}
                    className={`flex items-center justify-between gap-6 rounded-xl border border-white/20 ${getCardBackground(appTheme)} px-4 py-2.5 text-sm font-medium text-white shadow-lg focus:outline-none focus:ring-4 ${activeTheme.ring}`}
                  >
                    <span>{currentEpisodeObj ? `Ep ${currentEpisodeObj.episode_number}: ${currentEpisodeObj.name}` : `Episode ${episode}`}</span>
                    <span>▾</span>
                  </button>

                  {isEpisodeOpen && (
                    <div className={`absolute left-0 mt-2 z-50 max-h-65 w-80 overflow-y-auto rounded-xl border border-white/20 ${getCardBackground(appTheme)} shadow-2xl backdrop-blur p-1`}>
                      {seasonEpisodes.length > 0 ? (
                        seasonEpisodes.map((ep: any) => (
                          <button
                            key={ep.id}
                            type="button"
                            onClick={() => {
                              setEpisode(ep.episode_number);
                              setIsEpisodeOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition ${
                              episode === ep.episode_number ? `${activeTheme.bg} text-white font-bold` : "text-slate-200 hover:bg-white/10"
                            }`}
                          >
                            Ep {ep.episode_number}: {ep.name}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-slate-400">Loading episodes...</div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Action Bar */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handlePlay}
                className={`flex items-center gap-2 rounded-full ${activeTheme.bg} px-8 py-4 text-lg font-bold text-white shadow-lg ${activeTheme.shadow} transition ${activeTheme.hoverBg} active:scale-95 focus:outline-none focus:ring-4 ${activeTheme.ring} focus:scale-105`}
              >
                ▶ Play {inferredMediaType === "tv" ? `S${season}:E${episode}` : "Movie"}
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
