import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useRef } from "react";
import type { MediaItem } from "@/lib/tmdb-scraper";
import {
  CardSize,
  StreamQuality,
  AppTheme,
  getSavedCardSize,
  getSavedStreamQuality,
  getSavedTheme,
  getSavedUserAge,
  isAllowedForAge,
  getLargeButtons,
} from "@/lib/settings";
import {
  getWatchHistory,
  getDislikedTitles,
  isTitleDisliked,
  dislikeTitle,
} from "@/lib/watch-history";
import { ScrollPillBar } from "@/components/scroll-pill-bar";
import React from "react";

const TMDB_API_KEY =
  (import.meta.env.VITE_TMDB_API_KEY as string) || "9619884fc9c0e58b374a661ab2a692cd";
const TMDB_BASE_URL = "https://api.themoviedb.org/3/";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

const MY_LIST_STORAGE_KEY = "rabtv_my_list";
const FAVORITES_STORAGE_KEY = "rabtv_favorites";
const HOME_STATE_STORAGE_KEY = "rabtv_home_state_snapshot";

const genreMap: Record<string, number> = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  History: 36,
  Horror: 27,
  Music: 10402,
  Mystery: 9648,
  Romance: 10749,
  "Sci-Fi": 878,
  Thriller: 53,
  War: 10752,
  Western: 37,
};

const providerMap: Record<string, number> = {
  Netflix: 8,
  "Prime Video": 9,
  Disney: 337,
  Hulu: 15,
  AppleTV: 350,
  Max: 1899,
  Paramount: 531,
  Peacock: 386,
};

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const [activeTab, setActiveTab] = useState<"catalog" | "my-list" | "favorites" | "disliked">("catalog");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [selectedProvider, setSelectedProvider] = useState<string>("All");
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");

  // Restore state snapshot on initial load if available
  useEffect(() => {
    const savedSnapshot = sessionStorage.getItem(HOME_STATE_STORAGE_KEY);
    if (savedSnapshot) {
      try {
        const parsed = JSON.parse(savedSnapshot);
        if (parsed.activeTab) setActiveTab(parsed.activeTab);
        if (parsed.selectedGenre) setSelectedGenre(parsed.selectedGenre);
        if (parsed.selectedProvider) setSelectedProvider(parsed.selectedProvider);
        if (parsed.mediaType) setMediaType(parsed.mediaType);
      } catch (e) {
        console.error("Failed to parse home state snapshot", e);
      }
    }
  }, []);

  // Snapshot state changes to sessionStorage whenever tab, genre, or provider changes
  useEffect(() => {
    const homeState = { activeTab, selectedGenre, selectedProvider, mediaType };
    sessionStorage.setItem(HOME_STATE_STORAGE_KEY, JSON.stringify(homeState));
  }, [activeTab, selectedGenre, selectedProvider, mediaType]);

  // Listen for restoration event triggered by the Rabbit logo or "Back to Home"
  useEffect(() => {
    const handleRestoreState = () => {
      const savedSnapshot = sessionStorage.getItem(HOME_STATE_STORAGE_KEY);
      if (savedSnapshot) {
        try {
          const parsed = JSON.parse(savedSnapshot);
          if (parsed.activeTab) setActiveTab(parsed.activeTab);
          if (parsed.selectedGenre) setSelectedGenre(parsed.selectedGenre);
          if (parsed.selectedProvider) setSelectedProvider(parsed.selectedProvider);
          if (parsed.mediaType) setMediaType(parsed.mediaType);
        } catch (e) {
          console.error("Failed to restore home state snapshot", e);
        }
      }
    };

    window.addEventListener("rabtv_restore_home_state", handleRestoreState);
    return () => {
      window.removeEventListener("rabtv_restore_home_state", handleRestoreState);
    };
  }, []);

  const [items, setItems] = useState<MediaItem[]>([]);
  const [myListItems, setMyListItems] = useState<MediaItem[]>([]);
  const [favoritesItems, setFavoritesItems] = useState<MediaItem[]>([]);
  const [dislikedItems, setDislikedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [cardSize, setCardSize] = useState<CardSize>("large");
  const [streamQuality, setStreamQuality] = useState<StreamQuality>("1080p");
  const [appTheme, setAppTheme] = useState<AppTheme>("violet");
  const [userAge, setUserAge] = useState<number>(18);
  const [largeButtons, setLargeButtons] = useState<boolean>(true);
  const [canScrollDown, setCanScrollDown] = useState<boolean>(false);

  const heroScrollRef = useRef<HTMLDivElement>(null);

  const refreshSettings = () => {
    setCardSize(getSavedCardSize());
    setStreamQuality(getSavedStreamQuality());
    setAppTheme(getSavedTheme());
    setUserAge(getSavedUserAge());
    setLargeButtons(getLargeButtons());
  };

  const loadLocalLists = () => {
    try {
      const savedMyList = JSON.parse(localStorage.getItem(MY_LIST_STORAGE_KEY) || "[]");
      setMyListItems(savedMyList);

      const savedFavs = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]");
      setFavoritesItems(savedFavs);

      setDislikedItems(getDislikedTitles());
    } catch (e) {
      console.error("Failed to load local storage lists", e);
    }
  };

  useEffect(() => {
    refreshSettings();
    loadLocalLists();

    window.addEventListener("rabtv_settings_updated", refreshSettings);
    window.addEventListener("rabtv_catalog_updated", loadLocalLists);
    window.addEventListener("rabtv_disliked_updated", loadLocalLists);

    return () => {
      window.removeEventListener("rabtv_settings_updated", refreshSettings);
      window.removeEventListener("rabtv_catalog_updated", loadLocalLists);
      window.removeEventListener("rabtv_disliked_updated", loadLocalLists);
    };
  }, []);

  useEffect(() => {
    const handleScrollCheck = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      setCanScrollDown(scrollTop + clientHeight < scrollHeight - 40);
    };

    handleScrollCheck();
    window.addEventListener("scroll", handleScrollCheck, { passive: true });
    window.addEventListener("resize", handleScrollCheck);
    return () => {
      window.removeEventListener("scroll", handleScrollCheck);
      window.removeEventListener("resize", handleScrollCheck);
    };
  }, [items, myListItems, favoritesItems, activeTab]);

  useEffect(() => {
    let active = true;

    async function fetchCatalog() {
      setLoading(true);
      setError(null);

      try {
        const urlParams = new URLSearchParams();
        urlParams.set("api_key", TMDB_API_KEY);
        urlParams.set("sort_by", "popularity.desc");
        urlParams.set("include_adult", "false");

        if (selectedGenre !== "All" && genreMap[selectedGenre]) {
          urlParams.set("with_genres", genreMap[selectedGenre].toString());
        }

        if (selectedProvider !== "All" && providerMap[selectedProvider]) {
          urlParams.set("with_watch_providers", providerMap[selectedProvider].toString());
          urlParams.set("watch_region", "US");
        }

        const endpoint = mediaType === "tv" ? "discover/tv" : "discover/movie";
        const res = await fetch(`${TMDB_BASE_URL}${endpoint}?${urlParams.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch catalog stream");
        const data = await res.json();

        if (!active) return;

        const rawResults = (data.results || []) as Record<string, unknown>[];
        const mapped: MediaItem[] = [];

        for (const item of rawResults) {
          const title = (item.title || item.name) as string | undefined;
          if (!title) continue;

          const releaseDate = (item.release_date || item.first_air_date || "") as string;
          const year = releaseDate.split("-")[0];
          const voteAverage = item.vote_average as number | undefined;
          const rating = voteAverage ? voteAverage.toFixed(1) : undefined;
          const posterPath = item.poster_path as string | undefined;
          const imagePath = posterPath ? `${TMDB_IMAGE_BASE}${posterPath}` : "";

          mapped.push({
            id: `${mediaType}-${item.id}`,
            mediaId: String(item.id),
            title,
            description: (item.overview as string) || "No description available.",
            image: imagePath,
            href: `/details?id=${item.id}&type=${mediaType}`,
            genre: mediaType.toUpperCase(),
            year: year || undefined,
            rating,
            mediaType,
            genreIds: (item.genre_ids as number[]) || [],
          });
        }

        setItems(mapped);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchCatalog();
    return () => {
      active = false;
    };
  }, [mediaType, selectedGenre, selectedProvider]);

  // Intelligent Recommendation Engine for My List
  useEffect(() => {
    async function fetchRecommendedForMyList() {
      if (activeTab !== "my-list" || myListItems.length === 0) return;
      
      try {
        const seedItem = myListItems[0];
        const seedId = seedItem.mediaId || seedItem.id.replace(/^(movie|tv)-/, "");
        const seedType = seedItem.mediaType || "movie";

        const res = await fetch(
          `${TMDB_BASE_URL}/${seedType}/${seedId}/recommendations?api_key=${TMDB_API_KEY}`
        );
        const data = await res.json();

        if (data?.results && data.results.length > 0) {
          const recMapped: MediaItem[] = data.results
            .filter((item: any) => !isTitleDisliked(item.id))
            .slice(0, 10)
            .map((item: any) => {
              const type = item.media_type || seedType;
              const title = item.title || item.name || "Untitled";
              return {
                id: `${type}-${item.id}`,
                mediaId: String(item.id),
                title,
                description: item.overview || "",
                image: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : "",
                href: `/details?id=${item.id}&type=${type}`,
                year: (item.release_date || item.first_air_date || "").split("-")[0],
                rating: item.vote_average ? item.vote_average.toFixed(1) : undefined,
                mediaType: type as "movie" | "tv",
              };
            });
          
          // Append recommended items below saved list items without duplicates
          setMyListItems((prev) => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueRecs = recMapped.filter(r => !existingIds.has(r.id));
            return [...prev, ...uniqueRecs];
          });
        }
      } catch (err) {
        console.error("Failed to load My List recommendations", err);
      }
    }

    fetchRecommendedForMyList();
  }, [activeTab]);

  const filteredItems = useMemo(() => {
    let source = items;
    if (activeTab === "my-list") source = myListItems;
    if (activeTab === "favorites") source = favoritesItems;

    return source.filter((item) => {
      if (isTitleDisliked(item.id.replace(/^(movie|tv)-/, ""))) return false;
      return isAllowedForAge((item as any).certification, item.genre, userAge);
    });
  }, [items, myListItems, favoritesItems, activeTab, userAge]);

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
    violet: { bg: "bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950", accent: "text-violet-300", border: "border-violet-500/30", btn: "bg-violet-600 hover:bg-violet-500" },
    red: { bg: "bg-gradient-to-br from-zinc-950 via-red-950/40 to-black", accent: "text-red-400", border: "border-red-500/30", btn: "bg-red-600 hover:bg-red-500" },
    midnight: { bg: "bg-gradient-to-br from-slate-950 via-blue-950/40 to-slate-950", accent: "text-sky-300", border: "border-sky-500/30", btn: "bg-blue-600 hover:bg-blue-500" },
    emerald: { bg: "bg-gradient-to-br from-slate-950 via-emerald-950/40 to-slate-950", accent: "text-emerald-300", border: "border-emerald-500/30", btn: "bg-emerald-600 hover:bg-emerald-500" },
    amber: { bg: "bg-gradient-to-br from-stone-950 via-yellow-950/40 to-neutral-950", accent: "text-amber-300", border: "border-amber-500/30", btn: "bg-amber-600 hover:bg-amber-500" },
    cyan: { bg: "bg-gradient-to-br from-slate-950 via-cyan-950/40 to-slate-950", accent: "text-cyan-300", border: "border-cyan-500/30", btn: "bg-cyan-600 hover:bg-cyan-500" },
  }[appTheme] || { bg: "bg-slate-950", accent: "text-violet-300", border: "border-violet-500/30", btn: "bg-violet-600" };

  const getThemeArrowColor = (theme: AppTheme) => {
    switch (theme) {
      case "red": return "text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]";
      case "midnight": return "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]";
      case "emerald": return "text-emerald-300 drop-shadow-[0_0_8px_rgba(110,231,183,0.8)]";
      case "amber": return "text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.8)]";
      case "cyan": return "text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]";
      case "violet":
      default: return "text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]";
    }
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

  const allGenreOptions = useMemo(() => {
    return [{ id: "All", label: "All Genres" }, ...Object.keys(genreMap).map((g) => ({ id: g, label: g }))];
  }, []);

  const allProviderOptions = useMemo(() => {
    return [{ id: "All", label: "All Providers" }, ...Object.keys(providerMap).map((p) => ({ id: p, label: p }))];
  }, []);

  return (
    <main className={`min-h-screen ${themeStyles.bg} text-slate-100 px-4 py-6 pb-12`}>
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Navigation & Feed Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            {(["catalog", "my-list", "favorites", "disliked"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition ${
                  activeTab === tab ? `${themeStyles.btn} text-white shadow-lg` : "bg-black/40 text-slate-400 hover:text-white border border-white/10"
                }`}
              >
                {tab === "catalog" ? "🎬 Discover" : tab === "my-list" ? "🔖 My List" : tab === "favorites" ? "⭐ Favorites" : "👎 Disliked"}
              </button>
            ))}
          </div>

          {activeTab === "catalog" && (
            <div className="flex rounded-xl bg-slate-900 border border-white/10 p-1">
              {(["movie", "tv"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMediaType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${mediaType === type ? `${themeStyles.btn} text-white` : "text-slate-400 hover:text-white"}`}
                >
                  {type === "movie" ? "Movies" : "TV Shows"}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter Scroll Bars (Catalog Only) */}
        {activeTab === "catalog" && (
          <div className={`rounded-2xl border ${themeStyles.border} bg-black/40 backdrop-blur-md p-4 shadow-xl space-y-3`}>
            <div>
              <span className="text-xs text-slate-400 font-semibold block px-1 mb-1">Categories:</span>
              <ScrollPillBar
                options={allGenreOptions}
                activeId={selectedGenre}
                onSelect={(id) => setSelectedGenre(id)}
                appTheme={appTheme}
                getPrimaryBgColor={getPrimaryBgColor}
              />
            </div>

            <div>
              <span className="text-xs text-slate-400 font-semibold block px-1 mb-1">Streaming Providers:</span>
              <ScrollPillBar
                options={allProviderOptions}
                activeId={selectedProvider}
                onSelect={(id) => setSelectedProvider(id)}
                appTheme={appTheme}
                getPrimaryBgColor={getPrimaryBgColor}
              />
            </div>
          </div>
        )}

        {/* Header Title & Count */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-white capitalize">
            {activeTab === "catalog" ? `${selectedGenre === "All" ? "Trending" : selectedGenre} ${mediaType === "movie" ? "Movies" : "TV Shows"}` : activeTab.replace("-", " ")}
          </h2>
          <span className={`text-xs font-semibold ${themeStyles.accent}`}>
            {filteredItems.length} titles available
          </span>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading catalog stream...</div>
        ) : error ? (
          <div className="py-20 text-center text-red-400">Error: {error}</div>
        ) : activeTab === "disliked" ? (
          dislikedItems.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-12 text-center text-slate-400">
              No disliked titles. Titles you dislike will appear here and remain hidden across catalogs.
            </div>
          ) : (
            <div className={gridColsClass}>
              {dislikedItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-red-500/30 bg-black/60 p-3 flex flex-col justify-between">
                  <h3 className="text-xs font-bold text-white truncate">{item.title}</h3>
                  <button
                    type="button"
                    onClick={() => {
                      // Remove from disliked list
                      const updated = dislikedItems.filter((d) => d.id !== item.id);
                      localStorage.setItem("rabtv_disliked_titles", JSON.stringify(updated));
                      window.dispatchEvent(new Event("rabtv_disliked_updated"));
                    }}
                    className="mt-3 rounded-lg bg-slate-800 hover:bg-slate-700 py-1.5 text-xs font-bold text-slate-300 transition"
                  >
                    Restore Title
                  </button>
                </div>
              ))}
            </div>
          )
        ) : filteredItems.length > 0 ? (
          <div className={gridColsClass}>
            {filteredItems.map((item) => (
              <MediaCard item={item} key={item.id} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-12 text-center text-slate-400">
            No items found in this section.
          </div>
        )}

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

      </div>
    </main>
  );
}

export function MediaCard({ item }: { item: MediaItem }) {
  return (
    <Link
      to={item.href}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-900/90 shadow-xl transition hover:-translate-y-1 hover:brightness-110"
    >
      <div className="aspect-[2/3] w-full overflow-hidden bg-slate-950 relative">
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-center transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-2 text-center text-slate-500 text-xs font-bold">
            {item.title}
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const cleanId = item.id.replace(/^(movie|tv)-/, "");
            dislikeTitle({
              id: cleanId,
              title: item.title,
              mediaType: item.mediaType || "movie",
              posterPath: item.image.replace(TMDB_IMAGE_BASE, ""),
            });
          }}
          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-red-950/80 text-red-300 backdrop-blur-md border border-red-500/30 opacity-0 group-hover:opacity-100 transition hover:bg-red-600 hover:text-white"
          title="Dislike & Hide Globally"
        >
          👎
        </button>
      </div>

      <div className="p-2.5 bg-black/80 flex flex-col justify-between flex-1">
        <h3 className="font-bold text-white text-xs truncate" title={item.title}>
          {item.title}
        </h3>
        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
          <span>{item.year || "N/A"}</span>
          {item.rating && <span className="text-yellow-300 font-bold">⭐ {item.rating}</span>}
        </div>
      </div>
    </Link>
  );
}
