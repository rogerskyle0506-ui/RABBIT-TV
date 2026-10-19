import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import React from "react";

const navTabs = ["Home", "Series", "Movies", "My List"] as const;
type NavTab = (typeof navTabs)[number];

const genreCategories = [
  "Trending",
  "Action",
  "Drama",
  "Comedy",
  "Sci-Fi",
  "Horror",
];

const MY_LIST_STORAGE_KEY = "rabtv_my_list";
const FAVORITES_STORAGE_KEY = "rabtv_favorites";

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
        className={`group flex ${dimensions.card} ${cardThemeStyles.bg} border ${cardThemeStyles.border} focus:outline-none focus:ring-4 ${cardThemeStyles.ring} hover:scale-105 overflow-hidden relative rounded-xl transition w-full shadow-lg`}
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
      <Link className="block relative overflow-hidden flex-1 focus:outline-none w-full h-full" to={item.href}>
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

/** MEMOIZED WRAPPER FOR 2GB DEVICE PERFORMANCE */
const MemoizedMediaCard = React.memo(
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

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cardSize, setCardSize] = useState<CardSize>("large");

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
    window.addEventListener("rabtv_catalog_updated", loadSavedListsAndTheme);
    window.addEventListener("rabtv_watch_history_updated", loadSavedListsAndTheme);
    window.addEventListener("rabtv_settings_updated", handleSettingsUpdate);
    return () => {
      window.removeEventListener("rabtv_catalog_updated", loadSavedListsAndTheme);
      window.removeEventListener("rabtv_watch_history_updated", loadSavedListsAndTheme);
      window.removeEventListener("rabtv_settings_updated", handleSettingsUpdate);
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

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

      try {
        const result = await scrapeCategoryContent(activeTab, page);
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
  }, [activeTab, page]);

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
    
    const catalogFiltered = baseList.filter((item) => {
      if (isTitleDisliked(item.id)) return false;
      return isAllowedForAge((item as any).certification, item.genre, userAge);
    });

    if (activeTab === "My List") return catalogFiltered;
    if (selectedGenre === "Trending") return catalogFiltered;
    return catalogFiltered.filter((item) =>
      item.genre?.toLowerCase().includes(selectedGenre.toLowerCase())
    );
  }, [items, selectedGenre, activeTab, savedCatalogItems, userAge]);

  const completedIdsOrTitles = useMemo(() => {
    const set = new Set<string>();
    const raw = getRawWatchHistory();
    for (const h of raw) {
      if (h.confirmedCompleted || (h.progressPercent ?? 0) >= 100) {
        if (h.mediaId) set.add(String(h.mediaId).replace(/^(movie|tv)-/, ""));
        if (h.id) set.add(String(h.id).replace(/^(movie|tv)-/, ""));
        if (h.title) set.add(h.title.trim().toLowerCase());
      }
    }
    return set;
  }, [historyItems]);

  const featured = useMemo(() => {
    for (const item of filteredItems) {
      const cleanId = String(item.id).replace(/^(movie|tv)-/, "");
      const cleanTitle = (item.title ?? "").trim().toLowerCase();
      if (!completedIdsOrTitles.has(cleanId) && !completedIdsOrTitles.has(cleanTitle)) {
        return item;
      }
    }
    return filteredItems[0] ?? null;
  }, [filteredItems, completedIdsOrTitles]);

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

  return (
    <main className={`min-h-screen ${themeStyles.bg} text-slate-100 transition-colors duration-300 pb-12`}>
      {/* Navigation Bar Tabs Sticky Wrapper */}
      <div className={`sticky top-0 z-30 mb-4 mt-2 border-b border-white/10 px-3 sm:px-4 py-2.5 backdrop-blur-md shadow-md transition-colors duration-300 ${
        appTheme === "red" ? "bg-red-950/80" :
        appTheme === "midnight" ? "bg-blue-950/80" :
        appTheme === "emerald" ? "bg-emerald-950/80" :
        appTheme === "amber" ? "bg-yellow-950/80" :
        appTheme === "cyan" ? "bg-cyan-950/80" :
        "bg-purple-950/80"
      }`}>
        <div className="mx-auto flex max-w-7xl items-center justify-center">
          <div className={`flex w-full flex-wrap items-center justify-center gap-1.5 rounded-2xl border p-2 shadow-lg backdrop-blur-md transition-colors duration-300 ${
            appTheme === "red" ? "bg-red-950/60 border-red-500/30 shadow-red-950/50" :
            appTheme === "midnight" ? "bg-blue-950/60 border-blue-500/30 shadow-blue-950/50" :
            appTheme === "emerald" ? "bg-emerald-950/60 border-emerald-500/30 shadow-emerald-950/50" :
            appTheme === "amber" ? "bg-yellow-950/60 border-amber-500/30 shadow-yellow-950/50" :
            appTheme === "cyan" ? "bg-cyan-950/60 border-cyan-500/30 shadow-cyan-950/50" :
            "bg-purple-950/60 border-violet-500/30 shadow-purple-950/50"
          }`}>
            {navTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-4 py-1.5 text-xs font-semibold transition focus:outline-none ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-white/30 via-white/20 to-white/10 text-white shadow"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 overflow-x-hidden">
        {/* Featured Hero Banner with Strict Text Constraints */}
        <section className={`mb-4 w-full overflow-hidden rounded-[24px] border ${themeStyles.borderGlow} bg-gradient-to-br ${themeStyles.cardGradient} shadow-2xl relative h-[420px] flex flex-col`}>
          {featured ? (
            <>
              <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950 flex items-center justify-center">
                <img
                  src={featured.image}
                  alt={featured.title}
                  className="absolute inset-0 h-full w-full object-cover object-center opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050b16] via-black/30 to-transparent"></div>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5 flex flex-col justify-end z-10">
                <div className="bg-black/80 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0 w-full">
                    <div className={`flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] ${themeStyles.accentText}`}>
                      <span className="rounded-full border border-white/20 bg-white/5 px-2 py-0.5 shrink-0">
                        Featured
                      </span>
                      <span className="truncate max-w-[140px]">
                        {featured.genre ?? "Entertainment"}
                      </span>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 min-w-0">
                      <h2 className="text-lg sm:text-xl font-black text-white leading-snug truncate max-w-full">
                        {featured.title}
                      </h2>
                      {featured.rating && (
                        <span className="rounded-full border border-yellow-400/40 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 px-2 py-0.5 uppercase tracking-[0.2em] text-yellow-200 text-[10px] font-semibold shrink-0">
                          ⭐ {featured.rating}
                        </span>
                      )}
                      {featured.year && (
                        <span className="text-[11px] text-slate-300 font-medium shrink-0">
                          {featured.year}
                        </span>
                      )}
                    </div>

                    <p className="text-xs leading-relaxed text-slate-300 line-clamp-2">
                      {featured.description}
                    </p>
                  </div>

                  <div className="shrink-0 w-full sm:w-auto">
                    <Link
                      to={featured.href}
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

        {/* Genre Filters */}
        {activeTab !== "My List" && (
          <section className="mb-4 flex justify-center">
            <div className={`flex flex-wrap items-center justify-center gap-1.5 p-2 rounded-full border shadow-lg backdrop-blur-md max-w-full transition-colors duration-300 ${
              appTheme === "red" ? "bg-red-950/60 border-red-500/30 shadow-red-950/50" :
              appTheme === "midnight" ? "bg-blue-950/60 border-blue-500/30 shadow-blue-950/50" :
              appTheme === "emerald" ? "bg-emerald-950/60 border-emerald-500/30 shadow-emerald-950/50" :
              appTheme === "amber" ? "bg-yellow-950/60 border-amber-500/30 shadow-yellow-950/50" :
              appTheme === "cyan" ? "bg-cyan-950/60 border-cyan-500/30 shadow-cyan-950/50" :
              "bg-purple-950/60 border-violet-500/30 shadow-purple-950/50"
            }`}>
              {genreCategories.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => setSelectedGenre(genre)}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition focus:outline-none focus:ring-4 ${
                    selectedGenre === genre
                      ? "bg-gradient-to-r from-white/30 via-white/20 to-white/10 text-white shadow"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* My List Sub-category Selector */}
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

        {/* Content Grid */}
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
              {filteredItems.slice(activeTab === "My List" ? 0 : 1).map((item) => (
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

        {/* Suggested For You Section */}
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

        {/* Pagination Controls */}
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
