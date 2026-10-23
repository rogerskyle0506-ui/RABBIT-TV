import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { AppTheme, getSavedTheme } from "@/lib/settings";
import { isTitleDisliked } from "@/lib/watch-history";
import type { MediaItem } from "@/lib/tmdb-scraper";

const WATCH_HISTORY_STORAGE_KEY = "rabtv_watch_history";
const MY_LIST_STORAGE_KEY = "rabtv_my_list";
const FAVORITES_STORAGE_KEY = "rabtv_favorites";

export const Route = createFileRoute("/details")({
  component: DetailsPage,
});

export function DetailsPage() {
  const navigate = useNavigate();
  const search = Route.useSearch() as { id?: string; type?: string };
  const mediaId = search?.id;
  
  const [mediaType, setMediaType] = useState<string>(search?.type || "movie");

  const [mediaDetails, setMediaDetails] = useState<any>(null);
  const [similarItems, setSimilarItems] = useState<MediaItem[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  const [appTheme, setAppTheme] = useState<AppTheme>("violet");

  const [inMyList, setInMyList] = useState(false);
  const [inFavorites, setInFavorites] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [seasonEpisodes, setSeasonEpisodes] = useState<any[]>([]);
  const [autoPlayNext, setAutoPlayNext] = useState(true);

  const [isSeasonOpen, setIsSeasonOpen] = useState(false);
  const [isEpisodeOpen, setIsEpisodeOpen] = useState(false);

  const [canScrollDown, setCanScrollDown] = useState(false);

  const seasonRef = useRef<HTMLDivElement>(null);
  const episodeRef = useRef<HTMLDivElement>(null);

  const handleBackHome = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new Event("rabtv_restore_home_state"));
    navigate({ to: "/" });
  };

  useEffect(() => {
    if (isPlaying) return;

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
  }, [mediaDetails, similarItems, loading, isPlaying]);

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

  useEffect(() => {
    async function fetchSimilarContent() {
      if (!mediaId || isPlaying) return;
      try {
        const apiKey =
          (import.meta.env.VITE_TMDB_API_KEY as string) || "9619884fc9c0e58b374a661ab2a692cd";
        const endpointType = mediaType === "tv" ? "tv" : "movie";
        const res = await fetch(
          `https://api.themoviedb.org/3/${endpointType}/${mediaId}/similar?api_key=${apiKey}`
        );
        const data = await res.json();

        if (data?.results) {
          const mapped: MediaItem[] = data.results
            .filter((item: any) => !isTitleDisliked(item.id))
            .slice(0, 6)
            .map((item: any) => ({
              id: String(item.id),
              title: item.title || item.name || "Untitled",
              description: item.overview || "",
              image: item.poster_path
                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                : "",
              href: `/details?id=${item.id}&type=${endpointType}`,
              year: (item.release_date || item.first_air_date || "").split("-")[0],
              rating: item.vote_average ? item.vote_average.toFixed(1) : undefined,
              mediaType: endpointType as "movie" | "tv",
            }));
          setSimilarItems(mapped);
        } else {
          setSimilarItems([]);
        }
      } catch (err) {
        console.error("Failed to load similar recommendations", err);
        setSimilarItems([]);
      }
    }
    fetchSimilarContent();
  }, [mediaId, mediaType, isPlaying]);

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

  const getCardBackground = (theme: AppTheme) => {
    switch (theme) {
      case "red":
        return "bg-red-950/60 border-red-500/30 shadow-red-950/50";
      case "midnight":
        return "bg-blue-950/60 border-blue-500/30 shadow-blue-950/50";
      case "emerald":
        return "bg-emerald-950/60 border-emerald-500/30 shadow-emerald-950/50";
      case "amber":
        return "bg-yellow-950/60 border-amber-500/30 shadow-yellow-950/50";
      case "cyan":
        return "bg-cyan-950/60 border-cyan-500/30 shadow-cyan-950/50";
      case "violet":
      default:
        return "bg-purple-950/60 border-violet-500/30 shadow-violet-950/50";
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
      case "emerald":
        return {
          text: "text-emerald-300",
          bg: "bg-emerald-600",
          hoverBg: "hover:bg-emerald-500",
          border: "border-emerald-500",
          ring: "focus:ring-emerald-400",
          shadow: "shadow-emerald-600/30",
        };
      case "amber":
        return {
          text: "text-amber-300",
          bg: "bg-amber-600",
          hoverBg: "hover:bg-amber-500",
          border: "border-amber-500",
          ring: "focus:ring-amber-400",
          shadow: "shadow-amber-600/30",
        };
      case "cyan":
        return {
          text: "text-cyan-300",
          bg: "bg-cyan-600",
          hoverBg: "hover:bg-cyan-500",
          border: "border-cyan-500",
          ring: "focus:ring-cyan-400",
          shadow: "shadow-cyan-600/30",
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

  const activeTheme = getThemeClasses(appTheme);

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

  useEffect(() => {
    async function fetchDetailsWithCache() {
      if (!mediaId) return;

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

        if ((!data || data.success === false) && activeFetchType === "movie") {
          activeFetchType = "tv";
          res = await fetch(
            `https://api.themoviedb.org/3/tv/${mediaId}?api_key=${apiKey}&append_to_response=credits`
          );
          data = await res.json();
        }

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

  const getMediaWatchStatus = () => {
    if (!mediaId) return "none";
    try {
      const rawHistory = localStorage.getItem(WATCH_HISTORY_STORAGE_KEY);
      if (!rawHistory) return "none";
      const history = JSON.parse(rawHistory);

      const match = history.find((h: any) => {
        const cleanId = String(h.mediaId ?? h.id).replace(/^(movie|tv)-/, "");
        return cleanId === String(mediaId);
      });

      if (!match) return "none";

      if (match.confirmedCompleted || (match.progressPercent ?? 0) >= 100) {
        return "completed";
      }

      return "in_progress";
    } catch (err) {
      console.error("Error reading watch status", err);
    }
    return "none";
  };

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

  const watchStatus = getMediaWatchStatus();

  return (
    <div className={`min-h-screen w-full ${getPageBackground(appTheme)} p-6 text-white md:p-12 overflow-y-auto scroll-smooth transition-colors duration-300 pb-20`}>
      <a
        href="/"
        onClick={handleBackHome}
        className={`mb-6 inline-flex items-center gap-2 text-sm font-semibold ${activeTheme.text} transition hover:opacity-80 hover:underline focus:outline-none focus:ring-4 ${activeTheme.ring} focus:rounded-lg px-2 py-1 cursor-pointer`}
      >
        ← Back to Home
      </a>

      {isPlaying ? (
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          {inferredMediaType === "tv" && (
            <div className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border ${getCardBackground(appTheme)} p-4 backdrop-blur transition-colors duration-300`}>
              <div className="flex flex-wrap items-center gap-4 text-sm font-semibold relative">

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

          {/* HARDWARE-ACCELERATED ISOLATED IFRAME CONTAINER */}
          <div 
            className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl shadow-black/50 border border-white/10"
            style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
          >
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

          <div className={`flex flex-col gap-4 rounded-2xl border ${getCardBackground(appTheme)} p-6 backdrop-blur transition-colors duration-300`}>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="text-sm leading-relaxed text-slate-300">{overview}</p>
          </div>
        </div>
      ) : (
        <div className="mx-auto flex max-w-5xl flex-col gap-8">

          <div className="flex flex-col gap-8 md:flex-row md:items-start">
            <div className="relative h-[450px] w-[300px] self-center md:self-start shrink-0">
              {watchStatus === "completed" && (
                <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-md border border-emerald-400/30">
                  <span>✓</span>
                  <span>Watched</span>
                </div>
              )}
              {watchStatus === "in_progress" && (
                <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-full bg-cyan-500/90 px-3 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-md border border-cyan-400/30">
                  <span>⏳</span>
                  <span>In Progress</span>
                </div>
              )}
              <img
                src={poster}
                alt={title}
                className="h-full w-full rounded-2xl object-cover shadow-2xl shadow-black/40 border border-white/10"
              />
            </div>

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

              {inferredMediaType === "tv" && mediaDetails?.seasons && (
                <div className={`flex flex-wrap items-center gap-4 rounded-2xl border ${getCardBackground(appTheme)} p-4 backdrop-blur my-2 transition-colors duration-300`}>

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
                      ? `${activeTheme.border} bg-white/10 ${activeTheme.text}`
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

          {similarItems.length > 0 && (
            <div className="mt-10 pt-8 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>✨ Similar Titles You May Like</span>
                </h3>
                <span className={`text-xs font-medium ${activeTheme.text}`}>
                  {similarItems.length} recommendations available
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {similarItems.map((item) => (
                  <Link
                    key={item.id}
                    to={item.href}
                    className={`group relative flex flex-col overflow-hidden rounded-xl border ${getCardBackground(appTheme)} shadow-xl transition hover:-translate-y-1 hover:brightness-110`}
                  >
                    <div className="aspect-[2/3] w-full overflow-hidden bg-slate-950 relative">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="absolute inset-0 h-full w-full object-cover object-center transition group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-2.5 bg-black/80 flex flex-col justify-between flex-1">
                      <h4 className="font-bold text-white text-xs truncate" title={item.title}>
                        {item.title}
                      </h4>
                      {item.rating && (
                        <p className="mt-0.5 text-[10px] text-yellow-300 font-semibold">⭐ {item.rating}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {canScrollDown && (
            <div className="fixed bottom-4 left-0 right-0 z-50 flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-0.5 bg-black/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-2xl">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white opacity-100">
                  More Details Below
                </span>
                <span className={`text-xl font-black animate-slow-glow ${getThemeArrowColor(appTheme)} opacity-100`}>
                  ⌄
                </span>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
