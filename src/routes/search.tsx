import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import type { MediaItem } from "@/lib/tmdb-scraper";
import {
  CardSize,
  AppTheme,
  getSavedCardSize,
  getSavedTheme,
  getSavedUserAge,
  isAllowedForAge,
} from "@/lib/settings";
import { MediaCard } from "@/routes/index";
import { ScrollPillBar } from "@/components/scroll-pill-bar";
import React from "react";

const TMDB_API_KEY =
  (import.meta.env.VITE_TMDB_API_KEY as string) || "9619884fc9c0e58b374a661ab2a692cd";
const TMDB_BASE_URL = "https://api.themoviedb.org/3/";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

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

const languageFilters = [
  { label: "🌐 All Languages", lang: "", country: "" },
  { label: "🇬🇧 British / English", lang: "en", country: "GB" },
  { label: "🇺🇸 English (US/Global)", lang: "en", country: "" },
  { label: "🇷🇺 Russian", lang: "ru", country: "RU" },
  { label: "🇭🇺 Hungarian", lang: "hu", country: "HU" },
  { label: "🇩🇪 German", lang: "de", country: "DE" },
];

export const Route = createFileRoute("/search")({
  component: SearchPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: (search.q as string) || "",
    };
  },
});

function SearchPage() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  
  const [queryInput, setQueryInput] = useState(searchParams.q || "");
  const [mediaType, setMediaType] = useState<"all" | "movie" | "tv">("all");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedLangIndex, setSelectedLangIndex] = useState<number>(0);
  const [sortBy] = useState<string>("popularity.desc");

  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [appTheme, setAppTheme] = useState<AppTheme>("violet");
  const [cardSize, setCardSize] = useState<CardSize>("large");
  const [userAge, setUserAge] = useState<number>(18);
  const [canScrollDown, setCanScrollDown] = useState<boolean>(false);

  useEffect(() => {
    setAppTheme(getSavedTheme());
    setCardSize(getSavedCardSize());
    setUserAge(getSavedUserAge());
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
  }, [results, loading]);

  useEffect(() => {
    let active = true;

    async function fetchFilteredCatalog() {
      setLoading(true);
      setError(null);

      try {
        let endpoint = "";
        const urlParams = new URLSearchParams();
        urlParams.set("api_key", TMDB_API_KEY);
        urlParams.set("sort_by", sortBy);

        const activeQuery = searchParams.q?.trim();
        const activeLangConfig = languageFilters[selectedLangIndex];

        if (activeQuery) {
          endpoint = mediaType === "movie" ? "search/movie" : mediaType === "tv" ? "search/tv" : "search/multi";
          urlParams.set("query", activeQuery);
          if (activeLangConfig.lang) {
            urlParams.set("with_original_language", activeLangConfig.lang);
          }
        } else {
          endpoint = mediaType === "tv" ? "discover/tv" : "discover/movie";
          
          if (selectedGenre !== "All" && genreMap[selectedGenre]) {
            urlParams.set("with_genres", genreMap[selectedGenre].toString());
          }
          if (selectedYear) {
            if (mediaType === "tv") {
              urlParams.set("first_air_date_year", selectedYear);
            } else {
              urlParams.set("primary_release_year", selectedYear);
            }
          }
          if (minRating > 0) {
            urlParams.set("vote_average.gte", minRating.toString());
          }
          if (activeLangConfig.lang) {
            urlParams.set("with_original_language", activeLangConfig.lang);
          }
          if (activeLangConfig.country) {
            urlParams.set("with_origin_country", activeLangConfig.country);
          }
        }

        const res = await fetch(`${TMDB_BASE_URL}${endpoint}?${urlParams.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch catalog results");
        const data = await res.json();

        if (!active) return;

        const rawItems = (data.results || []) as Record<string, unknown>[];
        const mapped: MediaItem[] = [];

        for (const item of rawItems) {
          const type = (item.media_type as string) || (mediaType === "tv" ? "tv" : mediaType === "movie" ? "movie" : item.first_air_date ? "tv" : "movie");
          const title = (item.title || item.name) as string | undefined;
          if (!title) continue;

          const releaseDate = (item.release_date || item.first_air_date || "") as string;
          const year = releaseDate.split("-")[0];
          const voteAverage = item.vote_average as number | undefined;
          const rating = voteAverage ? voteAverage.toFixed(1) : "N/A";
          const posterPath = item.poster_path as string | undefined;
          const imagePath = posterPath ? `${TMDB_IMAGE_BASE}${posterPath}` : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80";

          if (activeQuery && minRating > 0 && (!voteAverage || voteAverage < minRating)) continue;
          if (activeQuery && selectedYear && year !== selectedYear) continue;

          mapped.push({
            id: `${type}-${item.id}`,
            title,
            description: (item.overview as string) || "No description available.",
            image: imagePath,
            href: `/details?id=${item.id}&type=${type}`,
            genre: type.toUpperCase(),
            year: year || undefined,
            rating: rating !== "N/A" ? rating : undefined,
            mediaType: type as "movie" | "tv",
          });
        }

        setResults(mapped);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchFilteredCatalog();
    return () => {
      active = false;
    };
  }, [searchParams.q, mediaType, selectedGenre, selectedYear, minRating, selectedLangIndex, sortBy]);

  const filteredResults = useMemo(() => {
    return results.filter((item) => isAllowedForAge((item as any).certification, item.genre, userAge));
  }, [results, userAge]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/search", search: { q: queryInput.trim() } });
  };

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
    return [{ id: "All", label: "All" }, ...Object.keys(genreMap).map((g) => ({ id: g, label: g }))];
  }, []);

  return (
    <main className={`min-h-screen ${themeStyles.bg} text-slate-100 px-4 py-6 pb-12`}>
      <div className="mx-auto max-w-7xl space-y-6">
        
        <div className={`rounded-2xl border ${themeStyles.border} bg-black/40 backdrop-blur-md p-4 sm:p-6 shadow-xl`}>
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Optional keyword (e.g. Matrix) or leave blank for pure filters..."
                className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <button
              type="submit"
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs text-white shadow-lg transition ${themeStyles.btn}`}
            >
              APPLY FILTERS
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
            <div className="flex rounded-xl bg-slate-900 border border-white/10 p-1">
              {(["all", "movie", "tv"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMediaType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${mediaType === t ? `${themeStyles.btn} text-white` : "text-slate-400 hover:text-white"}`}
                >
                  {t === "all" ? "All Media" : t === "movie" ? "Movies" : "TV Shows"}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5">
              <span className="text-xs text-slate-400 font-semibold">Language:</span>
              <select
                value={selectedLangIndex}
                onChange={(e) => setSelectedLangIndex(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                {languageFilters.map((lf, idx) => (
                  <option key={lf.label} value={idx} className="bg-slate-900">
                    {lf.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5">
              <span className="text-xs text-slate-400 font-semibold">Year:</span>
              <input
                type="number"
                min={1900}
                max={2030}
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                placeholder="Any (e.g. 2016)"
                className="w-24 bg-transparent text-xs font-bold text-white focus:outline-none placeholder-slate-500"
              />
              {selectedYear && (
                <button type="button" onClick={() => setSelectedYear("")} className="text-xs text-slate-400 hover:text-white">✕</button>
              )}
            </div>

            <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5">
              <span className="text-xs text-slate-400 font-semibold">Min Rating:</span>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value={0} className="bg-slate-900">Any Rating</option>
                <option value={6} className="bg-slate-900">⭐ 6.0 & Above</option>
                <option value={7} className="bg-slate-900">⭐ 7.0 & Above</option>
                <option value={8} className="bg-slate-900">⭐ 8.0 & Above</option>
                <option value={9} className="bg-slate-900">⭐ 9.0 & Above</option>
              </select>
            </div>
          </div>

          <div className="mt-4 space-y-1">
            <span className="text-xs text-slate-400 font-semibold block px-1">Genre:</span>
            <ScrollPillBar
              options={allGenreOptions}
              activeId={selectedGenre}
              onSelect={(id) => setSelectedGenre(id)}
              appTheme={appTheme}
              getPrimaryBgColor={getPrimaryBgColor}
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-white">
            {searchParams.q ? `Search Results for "${searchParams.q}"` : "Filtered Catalog Results"}
          </h2>
          <span className={`text-xs font-semibold ${themeStyles.accent}`}>
            {filteredResults.length} titles found
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading titles matching your filters...</div>
        ) : error ? (
          <div className="py-20 text-center text-red-400">Error: {error}</div>
        ) : filteredResults.length > 0 ? (
          <div className={gridColsClass}>
            {filteredResults.map((item) => (
              <MediaCard item={item} key={item.id} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-12 text-center text-slate-400">
            No titles found matching that exact combination of filters. Try relaxing your language, year, or rating filters!
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
