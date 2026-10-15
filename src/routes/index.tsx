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
        className={`group relative flex overflow-hidden rounded-xl bg-slate-900 transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-violet-400 ${dimensions.card}`}
      >
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-1 text-center opacity-0 group-hover:opacity-100 transition">
          <p className="text-[9px] font-bold text-white truncate">{item.title}</p>
        </div>
      </Link>
    );
  }

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-slate-900/80 transition hover:-translate-y-1 focus-within:ring-4 focus-within:ring-violet-400 ${dimensions.card}`}
    >
      <Link to={item.href} className="block overflow-hidden focus:outline-none">
        <img
          src={item.image}
          alt={item.title}
          className={`${dimensions.image} transition group-hover:scale-105`}
          loading="lazy"
        />
      </Link>

      <div className="flex flex-1 flex-col justify-between p-3">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-slate-200 truncate max-w-[70%]">
              {item.genre ?? "TV"}
            </span>
            {item.year ? (
              <span className="text-[10px] text-slate-400">{item.year}</span>
            ) : null}
          </div>
          <h4 className={`font-semibold text-white truncate ${dimensions.text}`}>
            {item.title}
          </h4>
          {item.rating && (
            <p className="mt-0.5 text-xs text-yellow-200">⭐ {item.rating}</p>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-1 border-t border-white/10 pt-2">
          <Link
            to={item.href}
            className="rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold text-white shadow-inner hover:underline focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            WATCH →
          </Link>
        </div>
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

  const loadSavedListsAndTheme = () => {
    try {
      const listData = JSON.parse(localStorage.getItem(MY_LIST_STORAGE_KEY) || "[]");
      const favData = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]");
      setSavedMyList(listData);
      setSavedFavorites(favData);
      setAppTheme(getSavedTheme());
    } catch (err) {
      console.error("Error reading saved lists/theme", err);
    }
  };

  useEffect(() => {
    loadSavedListsAndTheme();
    window.addEventListener("rabtv_catalog_updated", loadSavedListsAndTheme);
    window.addEventListener("rabtv_settings_updated", loadSavedListsAndTheme);
    return () => {
      window.removeEventListener("rabtv_catalog_updated", loadSavedListsAndTheme);
      window.removeEventListener("rabtv_settings_updated", loadSavedListsAndTheme);
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
    <main className={`min-h-screen ${themeStyles.bg} text-slate-100 transition-colors duration-300`}>
      {/* Navigation Bar Tabs (Centered & Scaling) */}
      <div className="border-b border-white/10 bg-slate-950/40 backdrop-blur-md px-4 py-2.5 sm:px-6 mb-6">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 overflow-x-auto w-full">
          {navTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition whitespace-nowrap focus:outline-none ${
                activeTab === tab
                  ? `${themeStyles.btnActive} shadow-md`
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8 overflow-x-hidden">
        {/* Featured Hero Banner (approx 50vh height restriction and scrollable) */}
        <section className={`mb-6 max-w-full overflow-hidden rounded-[28px] border ${themeStyles.borderGlow} bg-gradient-to-br ${themeStyles.cardGradient} p-4 sm:p-5 shadow-2xl h-[50vh] max-h-[420px] flex flex-col justify-center`}>
          {featured ? (
            <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr] items-center h-full">
              <div className="space-y-2 min-w-0 flex flex-col justify-center">
                <div className={`flex items-center gap-3 text-xs uppercase tracking-[0.28em] ${themeStyles.accentText}`}>
                  <span className="rounded-full border border-white/20 bg-white/5 px-2 py-0.5">
                    Featured
                  </span>
                  <span className="truncate max-w-[180px]">
                    {featured.genre ?? "Entertainment"}
                  </span>
                </div>

                <div className="min-w-0">
                  <h2 className="text-2xl font-black text-white md:text-4xl break-words leading-tight line-clamp-1">
                    {featured.title}
                  </h2>
                  <p className="mt-1 max-w-xl text-xs sm:text-xs leading-relaxed text-slate-300 line-clamp-2">
                    {featured.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
                  {featured.rating && (
                    <span className="rounded-full border border-yellow-400/40 bg-yellow-500/10 px-2 py-0.5 uppercase tracking-[0.2em] text-yellow-200">
                      ⭐ {featured.rating}
                    </span>
                  )}
                  {featured.year && (
                    <span className="text-xs text-slate-400">
                      {featured.year}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link
                    to={featured.href}
                    className={`rounded-full bg-black/70 border border-white/10 ${themeStyles.btnActive} px-5 py-2 text-xs font-semibold shadow-lg transition`}
                  >
                    WATCH NOW
                  </Link>
                </div>
              </div>

              <div className="overflow-hidden rounded-[16px] border border-white/10 bg-slate-950/70 h-full max-h-[180px] lg:max-h-[280px]">
                <img
                  src={featured.image}
                  alt={featured.title}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          ) : (
            <div className="flex min-h-[150px] items-center justify-center text-slate-300">
              {loading
                ? `Loading ${activeTab}...`
                : error ?? "No media found in this section."}
            </div>
          )}
        </section>

        {/* Genre Filters (Centered inside a decorative pillbox with theme gradient) */}
        {activeTab !== "My List" && (
          <section className="mb-6 flex justify-center">
            <div className={`flex flex-wrap items-center justify-center gap-2 p-2 rounded-full border border-white/10 bg-gradient-to-r ${themeStyles.cardGradient} shadow-lg backdrop-blur-md`}>
              {genreCategories.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => setSelectedGenre(genre)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-4 ${
                    selectedGenre === genre
                      ? "bg-white/20 text-white shadow"
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
          <section className="mb-6 flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
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
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">
              {activeTab === "My List" ? "Saved Catalog" : `${activeTab} Catalog`}
            </h3>
            <span className={`text-sm ${themeStyles.accentText}`}>
              {filteredItems.length} titles available
            </span>
          </div>

          {filteredItems.length > 0 ? (
            <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
              {filteredItems.slice(activeTab === "My List" ? 0 : 1).map((item) => (
                <MediaCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] bg-slate-900/80 p-8 text-center">
              <p className="text-slate-300">
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
          <div className="mb-8 flex items-center justify-center gap-4 rounded-2xl bg-slate-900/60 p-4">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1 || loading}
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-40 focus:outline-none focus:ring-4"
            >
              ◀ Previous Page
            </button>

            <span className={`text-sm font-bold ${themeStyles.accentText}`}>
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages || loading}
              className={`rounded-xl ${themeStyles.btnActive} px-4 py-2 text-sm font-semibold shadow transition disabled:opacity-40 focus:outline-none focus:ring-4`}
            >
              Next Page ▶
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
