import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, memo } from "react";
import type { MediaItem } from "@/lib/tmdb-scraper";
import { scrapeCategoryContent } from "@/lib/tmdb-scraper";
import {
  CardSize,
  AppTheme,
  getSavedCardSize,
  getSavedTheme,
  getSavedUserAge,
  isAllowedForAge,
  getPosterDimensions,
} from "@/lib/settings";
import { getRawWatchHistory, isTitleDisliked } from "@/lib/watch-history";
import { ScrollPillBar } from "@/components/scroll-pill-bar";
import React from "react";

const navTabs = ["Home", "TV Shows", "Movies", "In Theaters", "My List"] as const;
type NavTab = (typeof navTabs)[number];

const genreCategories = [
  "Trending",
  "Action",
  "Drama",
  "Comedy",
  "Sci-Fi",
  "Horror",
];

const providerCategories = [
  "All (Default)",
  "Netflix",
  "Prime",
  "Disney+",
];

const MY_LIST_STORAGE_KEY = "rabtv_my_list";
const FAVORITES_STORAGE_KEY = "rabtv_favorites";
const TMDB_API_KEY = (import.meta.env.VITE_TMDB_API_KEY as string) || "9619884fc9c0e58b374a661ab2a692cd";
const TMDB_BASE_URL = "https://api.themoviedb.org/3/";

export function MediaCard({ item }: { item: MediaItem }) {
  const [cardSize, setCardSize] = useState<CardSize>("large");
  const [appTheme, setAppTheme] = useState<AppTheme>("violet");

  useEffect(() => {
    setCardSize(getSavedCardSize());
    setAppTheme(getSavedTheme());

    const handleSettingsUpdate = () => {
      setCardSize(getSavedCardSize());
      setAppTheme(getSavedTheme());
    };

    window.addEventListener("rabtv_settings_updated", handleSettingsUpdate);
    return () =>
      window.removeEventListener("rabtv_settings_updated", handleSettingsUpdate);
  }, []);

  const cardThemeStyles = useMemo(() => {
    switch (appTheme) {
      case "red":
        return {
          bg: "bg-gradient-to-b from-red-950/70 via-zinc-900 to-black",
          border: "border-red-500/30",
          ring: "focus-within:ring-red-400 focus:ring-red-400",
        };
      case "midnight":
        return {
          bg: "bg-gradient-to-b from-blue-950/70 via-slate-900 to-slate-950",
          border: "border-blue-500/30",
          ring: "focus-within:ring-blue-400 focus:ring-blue-400",
        };
      case "emerald":
        return {
          bg: "bg-gradient-to-b from-emerald-950/70 via-slate-900 to-slate-950",
          border: "border-emerald-500/30",
          ring: "focus-within:ring-emerald-400 focus:ring-emerald-400",
        };
      case "amber":
        return {
          bg: "bg-gradient-to-b from-yellow-950/70 via-stone-900 to-stone-950",
          border: "border-amber-500/30",
          ring: "focus-within:ring-amber-400 focus:ring-amber-400",
        };
      case "cyan":
        return {
          bg: "bg-gradient-to-b from-cyan-950/70 via-slate-900 to-slate-950",
          border: "border-cyan-500/30",
          ring: "focus-within:ring-cyan-400 focus:ring-cyan-400",
        };
      case "violet":
      default:
        return {
          bg: "bg-gradient-to-b from-purple-950/70 via-slate-900 to-slate-950",
          border: "border-violet-500/30",
          ring: "focus-within:ring-violet-400 focus:ring-violet-400",
        };
    }
  }, [appTheme]);

  const dimensions = getPosterDimensions(cardSize);

  if (cardSize === "small") {
    return (
      <Link
        to={item.href}
        className={`group flex ${dimensions.card} ${cardThemeStyles.bg} border ${cardThemeStyles.border} focus:outline-none focus:ring-4 ${cardThemeStyles.ring} hover:scale-105 overflow-hidden relative rounded-xl transition w-full shadow-lg bg-transparent`}
      >
        <img
          src={item.image}
          alt={item.title}
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="lazy"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-1.5 text-center z-10">
          <p className="text-[10px] font-bold text-white truncate px-1 rounded bg-black/60 backdrop-blur-sm border border-white/10">
            {item.title}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <div
      className={`group relative flex w-full flex-col overflow-hidden rounded-2xl ${cardThemeStyles.bg} border ${cardThemeStyles.border} shadow-xl transition hover:-translate-y-1 ${cardThemeStyles.ring} ${dimensions.card}`}
    >
      <Link className="block relative overflow-hidden flex-1 focus:outline-none w-full h-full bg-transparent flex items-center justify-center" to={item.href}>
        <img
          src={item.image}
          alt={item.title}
          className="absolute inset-0 h-full w-full object-cover object-center transition group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-2.5 z-10">
          <div className="flex items-center justify-between mb-1">
            <span className="rounded-full bg-black/60 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-slate-200 truncate max-w-[70%] backdrop-blur-sm border border-white/10">
              {item.genre ?? "TV"}
            </span>
            {item.year ? (
              <span className="text-[10px] text-slate-300 font-medium">{item.year}</span>
            ) : null}
          </div>
          <h4 className={`font-bold text-white drop-shadow truncate ${dimensions.text}`}>
            {item.title}
          </h4>
          {item.rating && (
            <p className="mt-0.5 text-xs text-yellow-300 font-semibold drop-shadow">⭐ {item.rating}</p>
          )}
        </div>
      </Link>

      <div className="p-2 bg-black/90 border-t border-white/10 flex items-center justify-between z-20">
        <Link
          to={item.href}
          className={`w-full text-center rounded-full bg-gradient-to-r from-black/80 via-black to-black/80 border border-white/10 py-1 text-[10px] font-bold text-white shadow-inner hover:bg-white/20 transition focus:outline-none focus:ring-2 ${cardThemeStyles.ring}`}
        >
          WATCH →
        </Link>
      </div>
    </div>
  );
}

const MemoizedMediaCard = memo(
  function MemoizedMediaCard({ item }: { item: MediaItem }) {
    return <MediaCard item={item} />;
  },
  (prevProps, nextProps) => prevProps.item.id === nextProps.item.id
);

MemoizedMediaCard.displayName = "MemoizedMediaCard";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>("Home");
  const [selectedGenre, setSelectedGenre] = useState<string>("Trending");
  const [globalFeedOverride, setGlobalFeedOverride] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("rabtv_global_feed") || "All (Default)";
    }
    return "All (Default)";
  });

  const handleProviderSelect = (provider: string) => {
    setGlobalFeedOverride(provider);
    if (typeof window !== "undefined") {
      localStorage.setItem("rabtv_global_feed", provider);
      window.dispatchEvent(new CustomEvent("rabtv_global_feed_updated", { detail: provider }));
    }
  };

  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [appTheme, setAppTheme] = useState<AppTheme>("violet");
  const [userAge, setUserAge] = useState<number>(18);
  const [myListSubTab, setMyListSubTab] = useState<"all" | "in_progress" | "mylist" | "favorites">("all");
  const [savedMyList, setSavedMyList] = useState<MediaItem[]>([]);
  const [savedFavorites, setSavedFavorites] = useState<MediaItem[]>([]);
  const [historyItems, setHistoryItems] = useState<MediaItem[]>([]);
  const [suggestedItems, setSuggestedItems] = useState<MediaItem[]>([]);

  const [heroItems, setHeroItems] = useState<MediaItem[]>([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cardSize, setCardSize] = useState<CardSize>("large");
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    const checkVerticalScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      setCanScrollDown(scrollTop + clientHeight < scrollHeight - 100);
    };

    checkVerticalScroll();
    window.addEventListener("scroll", checkVerticalScroll, { passive: true });
    window.addEventListener("resize", checkVerticalScroll);

    return () => {
      window.removeEventListener("scroll", checkVerticalScroll);
      window.removeEventListener("resize", checkVerticalScroll);
    };
  }, [items, loading]);

  const loadSavedListsAndTheme = () => {
    try {
      const listData = JSON.parse(localStorage.getItem(MY_LIST_STORAGE_KEY) || "[]");
      const favData = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]");
      
      const rawHistory = getRawWatchHistory();
      const mappedHistory: MediaItem[] = rawHistory.map((h) => {
        const type = h.mediaType ?? h.media_type ?? (h.id?.startsWith("tv-") ? "tv" : "movie");
        const cleanId = String(h.mediaId ?? h.id).replace(/^(movie|tv)-/, "");
        const imagePath = h.posterPath ?? h.poster_path ?? h.image;
        const imageUrl = imagePath?.startsWith("http")
          ? imagePath
          : imagePath
          ? `https://image.tmdb.org/t/p/w500${imagePath}`
          : "/placeholder.png";

        return {
          id: String(h.id),
          title: h.title ?? "Unknown Title",
          image: imageUrl,
          href: `/details?id=${cleanId}&type=${type}`,
          genre: type.toUpperCase(),
          mediaType: type as "movie" | "tv",
          progressPercent: h.progressPercent ?? (h.confirmedCompleted ? 100 : 0),
          confirmedCompleted: h.confirmedCompleted ?? false,
        } as MediaItem & { progressPercent?: number; confirmedCompleted?: boolean; mediaType?: "movie" | "tv" };
      });

      setSavedMyList(listData);
      setSavedFavorites(favData);
      setHistoryItems(mappedHistory);
      setAppTheme(getSavedTheme());
      setCardSize(getSavedCardSize());
      setUserAge(getSavedUserAge());
    } catch (err) {
      console.error("Error reading saved lists/theme/age", err);
    }
  };

  useEffect(() => {
    loadSavedListsAndTheme();
    const handleSettingsUpdate = () => {
      loadSavedListsAndTheme();
    };

    const handleGlobalFeedUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setGlobalFeedOverride(customEvent.detail);
      }
    };

    window.addEventListener("rabtv_catalog_updated", loadSavedListsAndTheme);
    window.addEventListener("rabtv_watch_history_updated", loadSavedListsAndTheme);
    window.addEventListener("rabtv_settings_updated", handleSettingsUpdate);
    window.addEventListener("rabtv_global_feed_updated", handleGlobalFeedUpdate as EventListener);

    return () => {
      window.removeEventListener("rabtv_catalog_updated", loadSavedListsAndTheme);
      window.removeEventListener("rabtv_watch_history_updated", loadSavedListsAndTheme);
      window.removeEventListener("rabtv_settings_updated", handleSettingsUpdate);
      window.removeEventListener("rabtv_global_feed_updated", handleGlobalFeedUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeTab, selectedGenre, globalFeedOverride]);

  useEffect(() => {
    let active = true;

    async function fetchSmartHeroBanner() {
      try {
        const currentYear = String(new Date().getFullYear());
        const apiKey = TMDB_API_KEY;
        const watchHistoryMap = getRawWatchHistory().reduce((acc: Record<string, any>, h) => {
          const key = String(h.mediaId ?? h.id).replace(/^(movie|tv)-/, "");
          acc[key] = h;
          return acc;
        }, {});

        const freshCandidates: MediaItem[] = [];
        const inProgressCandidates: MediaItem[] = [];

        const discoverParams = new URLSearchParams({
          api_key: apiKey,
          sort_by: "popularity.desc",
          "vote_average.gte": "7.0",
          "vote_count.gte": "50",
        });

        if (activeTab === "Home") {
          const inTheaterRes = await fetch(`${TMDB_BASE_URL}movie/now_playing?api_key=${apiKey}&language=en-US&page=1`);
          const inTheaterData = await inTheaterRes.json();

          for (const item of (inTheaterData.results || [])) {
            if (!item.title || !item.backdrop_path) continue;
            const voteAvg = item.vote_average || 0;
            if (voteAvg < 7.0) continue;

            const tmdbId = String(item.id);
            if (isTitleDisliked(tmdbId) || isTitleDisliked(`movie-${tmdbId}`)) continue;

            const historyEntry = watchHistoryMap[tmdbId];
            const isCompleted = historyEntry && (
              historyEntry.confirmedCompleted || 
              (historyEntry.progressPercent ?? 0) >= 100 ||
              Object.values(historyEntry.episodes || {}).some((e: any) => e.confirmedCompleted)
            );
            if (isCompleted) continue;

            const mediaObj: MediaItem = {
              id: `movie-${tmdbId}`,
              title: item.title,
              description: item.overview || "No description available.",
              image: `https://image.tmdb.org/t/p/original${item.backdrop_path}`,
              href: `/details?id=${tmdbId}&type=movie`,
              genre: "🎬 IN THEATER",
              year: currentYear,
              rating: voteAvg.toFixed(1),
              mediaType: "movie",
            };

            if (historyEntry && !isCompleted) {
              inProgressCandidates.push(mediaObj);
            } else {
              freshCandidates.push(mediaObj);
            }
          }

          const movieParams = new URLSearchParams(discoverParams);
          movieParams.set("primary_release_year", currentYear);
          const tvParams = new URLSearchParams(discoverParams);
          tvParams.set("first_air_date_year", currentYear);

          const [mRes, tRes] = await Promise.all([
            fetch(`${TMDB_BASE_URL}discover/movie?${movieParams.toString()}`),
            fetch(`${TMDB_BASE_URL}discover/tv?${tvParams.toString()}`),
          ]);
          const mData = await mRes.json();
          const tData = await tRes.json();

          if (!active) return;

          for (const item of [...(mData.results || []), ...(tData.results || [])]) {
            const isTv = !!item.name;
            const title = item.title || item.name;
            const tmdbId = String(item.id);
            const voteAvg = item.vote_average || 0;
            if (!title || !item.backdrop_path || voteAvg < 7.0) continue;

            if (isTitleDisliked(tmdbId) || isTitleDisliked(`${isTv ? "tv" : "movie"}-${tmdbId}`)) continue;

            const historyEntry = watchHistoryMap[tmdbId];
            const isCompleted = historyEntry && (
              historyEntry.confirmedCompleted || 
              (historyEntry.progressPercent ?? 0) >= 100 ||
              Object.values(historyEntry.episodes || {}).some((e: any) => e.confirmedCompleted)
            );
            if (isCompleted) continue;

            const mediaObj: MediaItem = {
              id: `${isTv ? "tv" : "movie"}-${tmdbId}`,
              title,
              description: item.overview || "No description available.",
              image: `https://image.tmdb.org/t/p/original${item.backdrop_path}`,
              href: `/details?id=${tmdbId}&type=${isTv ? "tv" : "movie"}`,
              genre: isTv ? `TV SHOW (${currentYear})` : `MOVIE (${currentYear})`,
              year: currentYear,
              rating: voteAvg.toFixed(1),
              mediaType: isTv ? "tv" : "movie",
            };

            if (historyEntry && !isCompleted) {
              inProgressCandidates.push(mediaObj);
            } else {
              freshCandidates.push(mediaObj);
            }
          }

        } else if (activeTab === "TV Shows") {
          const tvParams = new URLSearchParams(discoverParams);
          tvParams.set("first_air_date_year", currentYear);

          const res = await fetch(`${TMDB_BASE_URL}discover/tv?${tvParams.toString()}`);
          const data = await res.json();

          if (!active) return;

          for (const item of (data.results || [])) {
            const tmdbId = String(item.id);
            const voteAvg = item.vote_average || 0;
            if (!item.name || !item.backdrop_path || voteAvg < 7.0) continue;

            if (isTitleDisliked(tmdbId) || isTitleDisliked(`tv-${tmdbId}`)) continue;

            const historyEntry = watchHistoryMap[tmdbId];
            const isCompleted = historyEntry && (
              historyEntry.confirmedCompleted || 
              (historyEntry.progressPercent ?? 0) >= 100 ||
              Object.values(historyEntry.episodes || {}).some((e: any) => e.confirmedCompleted)
            );
            if (isCompleted) continue;

            const mediaObj: MediaItem = {
              id: `tv-${tmdbId}`,
              title: item.name,
              description: item.overview || "No description available.",
              image: `https://image.tmdb.org/t/p/original${item.backdrop_path}`,
              href: `/details?id=${tmdbId}&type=tv`,
              genre: `TOP TV (${currentYear})`,
              year: currentYear,
              rating: voteAvg.toFixed(1),
              mediaType: "tv",
            };

            if (historyEntry && !isCompleted) {
              inProgressCandidates.push(mediaObj);
            } else {
              freshCandidates.push(mediaObj);
            }
          }
        } else {
          const res = await scrapeCategoryContent(activeTab === "TV Shows" ? "Series" : activeTab, 1);
          if (res?.items && active) {
            for (const item of res.items) {
              const tmdbId = String(item.id).replace(/^(movie|tv)-/, "");
              const voteAvg = Number(item.rating ?? 7.0);
              if (voteAvg < 7.0) continue;

              if (isTitleDisliked(item.id) || isTitleDisliked(tmdbId)) continue;

              const historyEntry = watchHistoryMap[tmdbId];
              const isCompleted = historyEntry && (
                historyEntry.confirmedCompleted || 
                (historyEntry.progressPercent ?? 0) >= 100
              );
              if (isCompleted) continue;

              if (historyEntry) {
                inProgressCandidates.push(item);
              } else {
                freshCandidates.push(item);
              }
            }
          }
        }

        const combinedQueue = [...freshCandidates, ...inProgressCandidates];
        const uniqueMap = new Map<string, MediaItem>();
        for (const item of combinedQueue) {
          if (!uniqueMap.has(item.id)) {
            uniqueMap.set(item.id, item);
          }
        }

        const finalHeroList = Array.from(uniqueMap.values()).slice(0, 10);
        if (active) {
          setHeroItems(finalHeroList);
          setCurrentHeroIndex(0);
        }
      } catch (err) {
        console.error("Failed to load smart hero banner queue:", err);
      }
    }

    void fetchSmartHeroBanner();
    return () => {
      active = false;
    };
  }, [activeTab, userAge, historyItems]);

  useEffect(() => {
    if (heroItems.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentHeroIndex((prevIndex) => (prevIndex + 1) % heroItems.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [heroItems.length]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      if (activeTab === "My List") {
        if (active) {
          setTotalPages(1);
          setLoading(false);
        }
        return;
      }

      const scraperCategory = activeTab === "TV Shows" ? "Series" : activeTab;
      const activeSubFeed = globalFeedOverride && globalFeedOverride !== "All (Default)" ? globalFeedOverride : undefined;

      try {
        const result = await scrapeCategoryContent(scraperCategory, page, selectedGenre, activeSubFeed);
        if (!active) return;

        if (result?.items?.length) {
          setItems(result.items);
          setTotalPages(result.totalPages || 1);
        } else {
          setItems([]);
          if (result?.message) setError(result.message);
        }
      } catch (caught) {
        if (!active) return;
        setError(
          caught instanceof Error ? caught.message : "Failed to load media"
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [activeTab, page, selectedGenre, globalFeedOverride]);

  useEffect(() => {
    let active = true;
    async function fetchSuggestions() {
      if (activeTab !== "My List") return;
      try {
        const seedItems = [...savedFavorites, ...historyItems.filter((h: any) => h.confirmedCompleted || (h.progressPercent ?? 0) > 50)];
        const fetchedPool: MediaItem[] = [];

        const trendingRes = await scrapeCategoryContent("Movies", 1);
        if (trendingRes?.items) {
          fetchedPool.push(...trendingRes.items);
        }
        const popularRes = await scrapeCategoryContent("Series", 1);
        if (popularRes?.items) {
          fetchedPool.push(...popularRes.items);
        }

        if (!active) return;

        const watchedIds = new Set([
          ...historyItems.map((h) => String(h.id).replace(/^(movie|tv)-/, "")),
          ...savedFavorites.map((f) => String(f.id).replace(/^(movie|tv)-/, "")),
          ...savedMyList.map((m) => String(m.id).replace(/^(movie|tv)-/, ""))
        ]);

        const uniqueSuggestions = new Map<string, MediaItem>();
        for (const candidate of fetchedPool) {
          const cleanId = String(candidate.id).replace(/^(movie|tv)-/, "");
          if (watchedIds.has(cleanId) || isTitleDisliked(candidate.id)) continue;
          
          if (!isAllowedForAge((candidate as any).certification, candidate.genre, userAge)) continue;

          const matchesGenre = seedCountHasGenre(seedItems, candidate.genre);
          if (matchesGenre || Number(candidate.rating ?? 0) >= 6.5) {
            uniqueSuggestions.set(cleanId, candidate);
          }
        }

        const finalSuggestions = Array.from(uniqueSuggestions.values()).slice(0, 12);
        setSuggestedItems(finalSuggestions);
      } catch (e) {
        console.error("Failed to load suggestions", e);
      }
    }

    void fetchSuggestions();
    return () => {
      active = false;
    };
  }, [activeTab, savedFavorites, savedMyList, historyItems, userAge]);

  function seedCountHasGenre(seeds: MediaItem[], candidateGenre?: string) {
    if (!candidateGenre) return true;
    if (seeds.length === 0) return true;
    return seeds.some((s) => s.genre && candidateGenre.toLowerCase().includes(s.genre.toLowerCase()));
  }

  const inProgressHistory = useMemo(
    () => historyItems.filter((i: any) => !i.confirmedCompleted && (i.progressPercent ?? 0) < 100),
    [historyItems]
  );

  const savedCatalogItems = useMemo(() => {
    let rawList: MediaItem[] = [];
    if (myListSubTab === "mylist") rawList = savedMyList;
    else if (myListSubTab === "favorites") rawList = savedFavorites;
    else if (myListSubTab === "in_progress") rawList = inProgressHistory;
    else {
      rawList = [...savedFavorites, ...savedMyList, ...inProgressHistory];
    }

    const map = new Map<string, MediaItem>();
    for (const item of rawList) {
      if (isTitleDisliked(item.id)) continue;
      if (!isAllowedForAge((item as any).certification, item.genre, userAge)) continue;

      const normalizedTitle = (item.title ?? "").trim().toLowerCase();
      const uniqueKey = normalizedTitle || String(item.id);
      
      if (!map.has(uniqueKey)) {
        map.set(uniqueKey, item);
      }
    }
    return Array.from(map.values());
  }, [myListSubTab, savedMyList, savedFavorites, inProgressHistory, userAge]);

  const filteredItems = useMemo(() => {
    const baseList = activeTab === "My List" ? savedCatalogItems : items;
    
    return baseList.filter((item) => {
      if (isTitleDisliked(item.id)) return false;
      return isAllowedForAge((item as any).certification, item.genre, userAge);
    });
  }, [items, activeTab, savedCatalogItems, userAge]);

  const gridColsClass = useMemo(() => {
    if (cardSize === "small") {
      return "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3";
    }
    if (cardSize === "medium") {
      return "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4";
    }
    return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4";
  }, [cardSize]);

  const themeStyles = {
    violet: {
      bg: "bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950",
      cardGradient: "from-purple-950/80 via-slate-900 to-indigo-950/80",
      btnActive: "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30",
      accentText: "text-violet-300",
      borderGlow: "border-violet-500/30",
    },
    red: {
      bg: "bg-gradient-to-br from-zinc-950 via-red-950/40 to-black",
      cardGradient: "from-red-950/80 via-zinc-900 to-neutral-950",
      btnActive: "bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 text-white shadow-lg shadow-red-600/30",
      accentText: "text-red-400",
      borderGlow: "border-red-500/30",
    },
    midnight: {
      bg: "bg-gradient-to-br from-slate-950 via-blue-950/40 to-slate-950",
      cardGradient: "from-blue-950/80 via-slate-900 to-sky-950/80",
      btnActive: "bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 text-white shadow-lg shadow-blue-600/30",
      accentText: "text-sky-300",
      borderGlow: "border-sky-500/30",
    },
    emerald: {
      bg: "bg-gradient-to-br from-slate-950 via-emerald-950/40 to-slate-950",
      cardGradient: "from-emerald-950/80 via-slate-900 to-teal-950/80",
      btnActive: "bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white shadow-lg shadow-emerald-600/30",
      accentText: "text-emerald-300",
      borderGlow: "border-emerald-500/30",
    },
    amber: {
      bg: "bg-gradient-to-br from-stone-950 via-yellow-950/40 to-neutral-950",
      cardGradient: "from-yellow-950/80 via-stone-900 to-amber-950/80",
      btnActive: "bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white shadow-lg shadow-amber-600/30",
      accentText: "text-amber-300",
      borderGlow: "border-amber-500/30",
    },
    cyan: {
      bg: "bg-gradient-to-br from-slate-950 via-cyan-950/40 to-slate-950",
      cardGradient: "from-cyan-950/80 via-slate-900 to-blue-950/80",
      btnActive: "bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30",
      accentText: "text-cyan-300",
      borderGlow: "border-cyan-500/30",
    },
  }[appTheme] ?? {
    bg: "bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950",
    cardGradient: "from-purple-950/80 via-slate-900 to-indigo-950/80",
    btnActive: "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30",
    accentText: "text-violet-300",
    borderGlow: "border-violet-500/30",
  };

  const getPrimaryBgColor = (theme: AppTheme) => {
    switch (theme) {
      case "red": return "bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 text-white shadow-lg shadow-red-600/30";
      case "midnight": return "bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 text-white shadow-lg shadow-blue-600/30";
      case "emerald": return "bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white shadow-lg shadow-emerald-600/30";
      case "amber": return "bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white shadow-lg shadow-amber-600/30";
      case "cyan": return "bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30";
      case "violet":
      default: return "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30";
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

  const activeHeroItem = heroItems[currentHeroIndex] || filteredItems[0] || null;

  return (
    <main className={`min-h-screen ${themeStyles.bg} text-slate-100 transition-colors duration-300 pb-20`}>
      {/* 1. SEPARATE STICKY TOP WRAPPER FOR MAIN NAVIGATION BAR */}
      <div className="sticky top-0 z-30 mb-4 mt-2 px-3 py-2.5 bg-black/70 backdrop-blur-xl border-b border-white/10 shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-center">
          <div className="w-full">
            <ScrollPillBar
              options={navTabs.map((tab) => ({ id: tab, label: tab }))}
              activeId={activeTab}
              onSelect={(id) => setActiveTab(id as NavTab)}
              appTheme={appTheme}
              getPrimaryBgColor={getPrimaryBgColor}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 overflow-x-hidden">
        <section className={`mb-4 w-full overflow-hidden rounded-[24px] border ${themeStyles.borderGlow} bg-gradient-to-br ${themeStyles.cardGradient} shadow-2xl relative h-[420px] flex flex-col group`}>
          {activeHeroItem ? (
            <>
              {/* Header Dots Indicator positioned safely in top right overlay */}
              {heroItems.length > 1 && (
                <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                  {heroItems.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentHeroIndex(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === currentHeroIndex ? "w-5 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Fully filled hero wrapper snap */}
              <div className="absolute inset-0 w-full h-full overflow-hidden bg-black flex items-center justify-center">
                <img
                  src={activeHeroItem.image}
                  alt={activeHeroItem.title}
                  className="absolute inset-0 h-full w-full object-cover object-center opacity-90 transition-opacity duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050b16] via-black/20 to-transparent"></div>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5 flex flex-col justify-end z-10">
                <div className="bg-black/80 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0 w-full">
                    <div className={`flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] ${themeStyles.accentText}`}>
                      <span className="rounded-full border border-white/20 bg-white/5 px-2 py-0.5 shrink-0">
                        ⭐ 7.0+ Spotlight ({currentHeroIndex + 1}/{heroItems.length || 1})
                      </span>
                      <span className="truncate max-w-[140px]">
                        {activeHeroItem.genre ?? "Entertainment"}
                      </span>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 min-w-0">
                      <h2 className="text-lg sm:text-xl font-black text-white leading-snug truncate max-w-full">
                        {activeHeroItem.title}
                      </h2>
                      {activeHeroItem.rating && (
                        <span className="rounded-full border border-yellow-400/40 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 px-2 py-0.5 uppercase tracking-[0.2em] text-yellow-200 text-[10px] font-semibold shrink-0">
                          ⭐ {activeHeroItem.rating}
                        </span>
                      )}
                      {activeHeroItem.year && (
                        <span className="text-[11px] text-slate-300 font-medium shrink-0">
                          {activeHeroItem.year}
                        </span>
                      )}
                    </div>

                    <p className="text-xs leading-relaxed text-slate-300 line-clamp-2">
                      {activeHeroItem.description}
                    </p>
                  </div>

                  <div className="shrink-0 w-full sm:w-auto flex items-center gap-3">
                    <Link
                      to={activeHeroItem.href}
                      className={`w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-full shadow-lg text-xs font-bold transition whitespace-nowrap border border-white/10 ${themeStyles.btnActive}`}
                    >
                      WATCH NOW
                    </Link>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300 z-10">
              {loading
                ? `Loading ${activeTab}...`
                : error ?? "No media found in this section."}
            </div>
          )}
        </section>

        {/* 2. SEPARATE WRAPPER FOR GENRES & PROVIDER SLIDERS */}
        {activeTab !== "My List" && (
          <section className="mb-4 space-y-2.5">
            {/* Genre Filter Pill Bar */}
            <div className="flex justify-center">
              <div className="w-full max-w-3xl">
                <ScrollPillBar
                  options={genreCategories.map((genre) => ({ id: genre, label: genre }))}
                  activeId={selectedGenre}
                  onSelect={(id) => setSelectedGenre(id)}
                  appTheme={appTheme}
                  getPrimaryBgColor={getPrimaryBgColor}
                />
              </div>
            </div>

            {/* Provider Filter Pill Bar */}
            <div className="flex justify-center">
              <div className="w-full max-w-3xl">
                <ScrollPillBar
                  options={providerCategories.map((prov) => ({ id: prov, label: prov }))}
                  activeId={globalFeedOverride}
                  onSelect={(id) => handleProviderSelect(id)}
                  appTheme={appTheme}
                  getPrimaryBgColor={getPrimaryBgColor}
                />
              </div>
            </div>
          </section>
        )}

        {activeTab === "My List" && (
          <section className="mb-4 flex flex-wrap items-center gap-2 border-b border-white/10 pb-3 px-2">
            <button
              type="button"
              onClick={() => setMyListSubTab("all")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition border ${
                myListSubTab === "all"
                  ? themeStyles.btnActive
                  : `bg-gradient-to-r ${themeStyles.cardGradient} text-slate-200${themeStyles.borderGlow} hover:brightness-125`
              }`}
            >
              All Saved ({savedMyList.length + savedFavorites.length + inProgressHistory.length})
            </button>

            <button
              type="button"
              onClick={() => setMyListSubTab("in_progress")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition border ${
                myListSubTab === "in_progress"
                  ? "bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-600/30 border-cyan-400/30"
                  : `bg-gradient-to-r ${themeStyles.cardGradient} text-slate-200${themeStyles.borderGlow} hover:brightness-125`
              }`}
            >
              ⏳ In Progress ({inProgressHistory.length})
            </button>

            <button
              type="button"
              onClick={() => setMyListSubTab("mylist")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition border ${
                myListSubTab === "mylist"
                  ? themeStyles.btnActive
                  : `bg-gradient-to-r ${themeStyles.cardGradient} text-slate-200${themeStyles.borderGlow} hover:brightness-125`
              }`}
            >
              🔖 Watch Later ({savedMyList.length})
            </button>

            <button
              type="button"
              onClick={() => setMyListSubTab("favorites")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition border ${
                myListSubTab === "favorites"
                  ? "bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white shadow-lg shadow-amber-600/30 border-amber-400/30"
                  : `bg-gradient-to-r ${themeStyles.cardGradient} text-slate-200${themeStyles.borderGlow} hover:brightness-125`
              }`}
            >
              ⭐ Favorites ({savedFavorites.length})
            </button>
          </section>
        )}

        <section className="mb-6 px-1">
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-white">
              {activeTab === "My List" ? "Saved Catalog" : `${activeTab} Catalog`}
            </h3>
            <span className={`text-xs font-medium ${themeStyles.accentText}`}>
              {filteredItems.length} titles available
            </span>
          </div>

          {filteredItems.length > 0 ? (
            <div className={gridColsClass}>
              {filteredItems.map((item) => (
                <MemoizedMediaCard item={item} key={item.id} />
              ))}
            </div>
          ) : (
            <div className={`rounded-[20px] bg-gradient-to-r ${themeStyles.cardGradient} border ${themeStyles.borderGlow} p-6 text-center mx-2`}>
              <p className="text-sm text-slate-300">
                {activeTab === "My List"
                  ? "No saved titles in this section yet. Open any movie or show to save it!"
                  : loading
                  ? `Loading ${activeTab} content...`
                  : error ?? "No titles available in this view."}
              </p>
            </div>
          )}
        </section>

        {canScrollDown && (
          <div className="fixed bottom-4 left-0 right-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-0.5 bg-black/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-2xl">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white opacity-100">
                More Content Below
              </span>
              <span className={`text-xl font-black animate-slow-glow ${getThemeArrowColor(appTheme)} opacity-100`}>
                ⌄
              </span>
            </div>
          </div>
        )}

        {activeTab === "My List" && suggestedItems.length > 0 && (
          <section className="mb-8 px-1 pt-4 border-t border-white/10">
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>✨ Suggested For You</span>
              </h3>
              <span className={`text-xs font-medium ${themeStyles.accentText}`}>
                Curated based on your favorites & history
              </span>
            </div>
            <div className={gridColsClass}>
              {suggestedItems.map((item) => (
                <MemoizedMediaCard item={item} key={`suggested-${item.id}`} />
              ))}
            </div>
          </section>
        )}

        {activeTab !== "My List" && totalPages > 1 && (
          <div className={`mb-6 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r ${themeStyles.cardGradient} border ${themeStyles.borderGlow} p-3 mx-2`}>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1 || loading}
              className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-40 focus:outline-none focus:ring-4"
            >
              ◀ Previous
            </button>

            <span className={`text-xs font-bold ${themeStyles.accentText}`}>
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages || loading}
              className={`rounded-xl ${themeStyles.btnActive} px-3 py-2 text-xs font-semibold shadow transition disabled:opacity-40 focus:outline-none focus:ring-4`}
            >
              Next ▶
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
