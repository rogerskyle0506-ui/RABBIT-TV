import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { MediaItem } from "@/lib/tmdb-scraper";
import { scrapeCategoryContent } from "@/lib/tmdb-scraper";
import {
  CardSize,
  AppTheme,
  getSavedCardSize,
  getSavedTheme,
  getPosterDimensions,
} from "@/lib/settings";

const navTabs = ["Home", "Series", "Movies", "Live", "My List"] as const;
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

  useEffect(() => {
    setCardSize(getSavedCardSize());

    const handleSettingsUpdate = () => {
      setCardSize(getSavedCardSize());
    };

    window.addEventListener("rabtv_settings_updated", handleSettingsUpdate);
    return () =>
      window.removeEventListener("rabtv_settings_updated", handleSettingsUpdate);
  }, []);

  const dimensions = getPosterDimensions(cardSize);

  if (cardSize === "small") {
    return (
      <Link
        to={item.href}
        className={`group relative flex w-full overflow-hidden rounded-xl bg-slate-900 transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-violet-400 ${dimensions.card}`}
      >
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1.5 text-center">
          <p className="text-[10px] font-bold text-white truncate px-1 rounded bg-black/40 backdrop-blur-sm">{item.title}</p>
        </div>
      </Link>
    );
  }

  return (
    <div
      className={`group relative flex w-full flex-col overflow-hidden rounded-2xl bg-slate-900/90 transition hover:-translate-y-1 focus-within:ring-4 focus-within:ring-violet-400 ${dimensions.card}`}
    >
      <Link to={item.href} className="block relative overflow-hidden flex-1 focus:outline-none">
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover transition group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="rounded-full bg-black/60 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-slate-200 truncate max-w-[70%] backdrop-blur-sm">
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

      <div className="p-2 bg-black/80 border-t border-white/10 flex items-center justify-between">
        <Link
          to={item.href}
          className="w-full text-center rounded-full bg-black/70 border border-white/10 py-1 text-[10px] font-bold text-white shadow-inner hover:bg-white/20 transition focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          WATCH →
        </Link>
      </div>
    </div>
  );
}

function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>("Home");
  const [selectedGenre, setSelectedGenre] = useState<string>("Trending");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [appTheme, setAppTheme] = useState<AppTheme>("violet");
  Here is the complete `index.tsx` file with the updated featured cover art dimensions (100% width, 75% height) already applied:

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { MediaItem } from "@/lib/tmdb-scraper";
import { scrapeCategoryContent } from "@/lib/tmdb-scraper";
import {
  CardSize,
  AppTheme,
  getSavedCardSize,
  getSavedTheme,
  getPosterDimensions,
} from "@/lib/settings";

const navTabs = ["Home", "Series", "Movies", "Live", "My List"] as const;
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

  useEffect(() => {
    setCardSize(getSavedCardSize());

    const handleSettingsUpdate = () => {
      setCardSize(getSavedCardSize());
    };

    window.addEventListener("rabtv_settings_updated", handleSettingsUpdate);
    return () =>
      window.removeEventListener("rabtv_settings_updated", handleSettingsUpdate);
  }, []);

  const dimensions = getPosterDimensions(cardSize);

  if (cardSize === "small") {
    return (
      <Link ${dimensions.card}`} bg-slate-900 className="{`group" flex focus:outline-none focus:ring-4 focus:ring-violet-400 hover:scale-105 overflow-hidden relative rounded-xl to="{item.href}" transition w-full>
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1.5 text-center">
          <p className="text-[10px] font-bold text-white truncate px-1 rounded bg-black/40 backdrop-blur-sm">{item.title}</p>
        </div>
      </Link>
    );
  }

  return (
    <div
      className={`group relative flex w-full flex-col overflow-hidden rounded-2xl bg-slate-900/90 transition hover:-translate-y-1 focus-within:ring-4 focus-within:ring-violet-400 ${dimensions.card}`}
    >
      <Link className="block relative overflow-hidden flex-1 focus:outline-none" to="{item.href}">
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover transition group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="rounded-full bg-black/60 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-slate-200 truncate max-w-[70%] backdrop-blur-sm">
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

      <div className="p-2 bg-black/80 border-t border-white/10 flex items-center justify-between">
        <Link className="w-full text-center rounded-full bg-black/70 border border-white/10 py-1 text-[10px] font-bold text-white shadow-inner hover:bg-white/20 transition focus:outline-none focus:ring-2 focus:ring-violet-400" to="{item.href}">
          WATCH →
        </Link>
      </div>
    </div>
  );
}

function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>("Home");
  const [selectedGenre, setSelectedGenre] = useState<string>("Trending");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [appTheme, setAppTheme] = useState<AppTheme>("violet");
  const [myListSubTab, setMyListSubTab] = useState<"all" | "mylist" | "favorites">("all");
  const [savedMyList, setSavedMyList] = useState<MediaItem[]>([]);
  const [savedFavorites, setSavedFavorites] = useState<MediaItem[]>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cardSize, setCardSize] = useState<CardSize>("large");

  const loadSavedListsAndTheme = () => {
    try {
      const listData = JSON.parse(localStorage.getItem(MY_LIST_STORAGE_KEY) || "[]");
      const favData = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]");
      setSavedMyList(listData);
      setSavedFavorites(favData);
      setAppTheme(getSavedTheme());
      setCardSize(getSavedCardSize());
    } catch (err) {
      console.error("Error reading saved lists/theme", err);
    }
  };

  useEffect(() => {
    loadSavedListsAndTheme();
    const handleSettingsUpdate = () => {
      loadSavedListsAndTheme();
    };
    window.addEventListener("rabtv_catalog_updated", loadSavedListsAndTheme);
    window.addEventListener("rabtv_settings_updated", handleSettingsUpdate);
    return () => {
      window.removeEventListener("rabtv_catalog_updated", loadSavedListsAndTheme);
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

  const savedCatalogItems = useMemo(() => {
    if (myListSubTab === "mylist") return savedMyList;
    if (myListSubTab === "favorites") return savedFavorites;

    const map = new Map();
    [...savedFavorites, ...savedMyList].forEach((item) => map.set(item.id, item));
    return Array.from(map.values());
  }, [myListSubTab, savedMyList, savedFavorites]);

  const filteredItems = useMemo(() => {
    if (activeTab === "My List") return savedCatalogItems;
    if (selectedGenre === "Trending") return items;
    return items.filter((item) =>
      item.genre?.toLowerCase().includes(selectedGenre.toLowerCase())
    );
  }, [items, selectedGenre, activeTab, savedCatalogItems]);

  const featured = useMemo(() => filteredItems[0] ?? null, [filteredItems]);

  // Dynamic Grid Columns with comfortable spacing to prevent poster collision
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
      bg: "bg-[#050b16]",
      cardGradient: "from-slate-900 via-slate-950 to-violet-950",
      btnActive: "bg-violet-600 text-white shadow-violet-600/30",
      accentText: "text-violet-300",
      borderGlow: "border-violet-500/30",
    },
    red: {
      bg: "bg-black",
      cardGradient: "from-zinc-950 via-zinc-900 to-red-950",
      btnActive: "bg-red-600 text-white shadow-red-600/30",
      accentText: "text-red-400",
      borderGlow: "border-red-500/30",
    },
    midnight: {
      bg: "bg-[#020617]",
      cardGradient: "from-slate-950 via-blue-950 to-slate-900",
      btnActive: "bg-blue-600 text-white shadow-blue-600/30",
      accentText: "text-sky-300",
      borderGlow: "border-sky-500/30",
    },
  }[appTheme];

  return (
    <main className={`min-h-screen ${themeStyles.bg} text-slate-100 transition-colors duration-300 pb-12`}>
      {/* Navigation Bar Tabs */}
      <div className="border-b border-white/10 bg-slate-950/80 backdrop-blur-md px-2 py-3 mt-2 mb-4 sticky top-0 z-30 shadow-md">
        <div className="mx-auto flex max-w-full items-center justify-center gap-1.5 overflow-x-auto px-2">
          <div className={`flex items-center justify-center gap-1 p-1.5 rounded-full border border-white/10 bg-gradient-to-r ${themeStyles.cardGradient} shadow-lg backdrop-blur-md`}>
            {navTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition whitespace-nowrap focus:outline-none shrink-0 ${
                  activeTab === tab
                    ? "bg-white/25 text-white shadow"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-full px-2 sm:px-4 overflow-x-hidden">
        {/* Featured Hero Banner */}
        <section className={`mb-4 w-full overflow-hidden rounded-[24px] border ${themeStyles.borderGlow} bg-gradient-to-br ${themeStyles.cardGradient} shadow-2xl relative h-[420px] flex flex-col`}>
          {featured ? (
            <>
              {/* Cover art image set to 100% width and 75% box height */}
              <div className="absolute inset-x-0 top-0 h-[75%] w-full overflow-hidden bg-slate-950 flex items-center justify-center">
                <img
                  src={featured.image}
                  alt={featured.title}
                  className="h-full w-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050b16] via-black/30 to-transparent"></div>
              </div>

              {/* Content overlay adjusted below the 75% height banner */}
              <div className="absolute inset-x-0 bottom-0 top-[75%] p-3 sm:p-5 flex flex-col justify-end z-10">
                <div className="bg-black/80 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className={`flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] ${themeStyles.accentText}`}>
                      <span className="rounded-full border border-white/20 bg-white/5 px-2 py-0.5">
                        Featured
                      </span>
                      <span className="truncate max-w-[140px]">
                        {featured.genre ?? "Entertainment"}
                      </span>
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                      <h2 className="text-lg sm:text-xl font-black text-white leading-snug truncate">
                        {featured.title}
                      </h2>
                      {featured.rating && (
                        <span className="rounded-full border border-yellow-400/40 bg-yellow-500/10 px-2 py-0.5 uppercase tracking-[0.2em] text-yellow-200 text-[10px] font-semibold">
                          ⭐ {featured.rating}
                        </span>
                      )}
                      {featured.year && (
                        <span className="text-[11px] text-slate-300 font-medium">
                          {featured.year}
                        </span>
                      )}
                    </div>

                    <p className="text-xs leading-relaxed text-slate-300 line-clamp-2">
                      {featured.description}
                    </p>
                  </div>

                  <div className="shrink-0 w-full sm:w-auto">
                    <Link ${themeStyles.btnActive} border border-white/10 className="{`w-full" font-bold inline-flex items-center justify-center`} px-5 py-2.5 rounded-full shadow-lg sm:w-auto text-xs to="{featured.href}" transition whitespace-nowrap>
                      WATCH NOW
                    </Link>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300">
              {loading
                ? `Loading ${activeTab}...`
                : error ?? "No media found in this section."}
            </div>
          )}
        </section>

        {/* Genre Filters */}
        {activeTab !== "My List" && (
          <section className="mb-4 flex justify-center">
            <div className={`flex flex-wrap items-center justify-center gap-1.5 p-2 rounded-full border border-white/10 bg-gradient-to-r ${themeStyles.cardGradient} shadow-lg backdrop-blur-md max-w-full`}>
              {genreCategories.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => setSelectedGenre(genre)}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition focus:outline-none focus:ring-4 ${
                    selectedGenre === genre
                      ? "bg-white/25 text-white shadow"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* My List & Favorites Sub-category Selector */}
        {activeTab === "My List" && (
          <section className="mb-4 flex flex-wrap items-center gap-2 border-b border-white/10 pb-3 px-2">
            <button
              type="button"
              onClick={() => setMyListSubTab("all")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                myListSubTab === "all"
                  ? themeStyles.btnActive
                  : "bg-slate-900/60 text-slate-300"
              }`}
            >
              All Saved ({savedMyList.length + savedFavorites.length})
            </button>

            <button
              type="button"
              onClick={() => setMyListSubTab("mylist")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                myListSubTab === "mylist"
                  ? themeStyles.btnActive
                  : "bg-slate-900/60 text-slate-300"
              }`}
            >
              🔖 Watch Later ({savedMyList.length})
            </button>

            <button
              type="button"
              onClick={() => setMyListSubTab("favorites")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                myListSubTab === "favorites"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                  : "bg-slate-900/60 text-slate-300"
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
                <MediaCard item="{item}" key="{item.id}"/>
              ))}
            </div>
          ) : (
            <div className="rounded-[20px] bg-slate-900/80 p-6 text-center mx-2">
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

        {/* Pagination Controls */}
        {activeTab !== "My List" && totalPages > 1 && (
          <div className="mb-6 flex items-center justify-center gap-3 rounded-2xl bg-slate-900/60 p-3 mx-2">
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

export const Route = createFileRoute("/")({
  component: Home,
});
