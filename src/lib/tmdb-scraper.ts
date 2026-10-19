export type MediaItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
  genre?: string;
  year?: string;
  rating?: string;
  mediaType?: "movie" | "tv";
};

export type ScrapeResult = {
  source: string;
  items: MediaItem[];
  fetchedAt: string;
  message?: string;
  page?: number;
  totalPages?: number;
};

const TMDB_API_KEY =
  (import.meta.env.VITE_TMDB_API_KEY as string) || "9619884fc9c0e58b374a661ab2a692cd";

const TMDB_BASE_URL = "https://api.themoviedb.org/3/";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

// Global cache to track rendered item IDs across pagination sessions to prevent duplicates
const globalSeenIds = new Set<string>();

const genreMap: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
};

function getGenreName(genreIds: number[]): string {
  if (!genreIds || genreIds.length === 0) return "Entertainment";
  const mappedGenres = genreIds.map((id) => genreMap[id]).filter(Boolean);
  return mappedGenres.length > 0 ? mappedGenres.join(", ") : "Entertainment";
}

function mapTmdbItemToMediaItem(
  item: Record<string, unknown>,
  mediaType: "movie" | "tv"
): MediaItem | null {
  const title = (item.title || item.name) as string | undefined;
  if (!title) return null;

  const tmdbId = item.id;
  const uniqueId = `${mediaType}-${tmdbId}`;

  const releaseDate = (item.release_date || item.first_air_date || "") as string;
  const year = releaseDate.split("-")[0];
  const voteAverage = item.vote_average as number | undefined;
  const rating = voteAverage ? voteAverage.toFixed(1) : "N/A";
  const posterPath = item.poster_path as string | undefined;
  const imagePath = posterPath
    ? `${TMDB_IMAGE_BASE}${posterPath}`
    : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80";
  const genre = getGenreName((item.genre_ids as number[]) || []);
  const description =
    (item.overview as string) || "Discover this amazing content on RABBITs TV";

  return {
    id: uniqueId,
    title,
    description,
    image: imagePath,
    href: `/details?id=${tmdbId}&type=${mediaType}`,
    genre,
    year: year || undefined,
    rating: rating !== "N/A" ? rating : undefined,
    mediaType,
  };
}

async function fetchTmdb(endpoint: string, page = 1): Promise<Record<string, unknown>> {
  const url = new URL(endpoint, TMDB_BASE_URL);

  if (TMDB_API_KEY) {
    url.searchParams.set("api_key", TMDB_API_KEY);
  }
  url.searchParams.set("page", page.toString());

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<Record<string, unknown>>;
}

export async function scrapeTrendingContent(page = 1): Promise<ScrapeResult> {
  return scrapeCategoryContent("Home", page);
}

export async function scrapeCategoryContent(
  category: "Home" | "Series" | "Movies" | "Live" | "My List",
  page = 1
): Promise<ScrapeResult> {
  try {
    const rawItems: MediaItem[] = [];
    let totalPages = 1;

    // Reset global cache if user loops back to page 1 to ensure a fresh session sequence
    if (page === 1) {
      globalSeenIds.clear();
    }

    if (category === "Movies") {
      const data = await fetchTmdb("movie/popular", page);
      totalPages = (data.total_pages as number) || 1;
      const results = (data.results as Record<string, unknown>[]) || [];
      results.forEach((item) => {
        const mapped = mapTmdbItemToMediaItem(item, "movie");
        if (mapped) rawItems.push(mapped);
      });
    } else if (category === "Series") {
      const data = await fetchTmdb("tv/popular", page);
      totalPages = (data.total_pages as number) || 1;
      const results = (data.results as Record<string, unknown>[]) || [];
      results.forEach((item) => {
        const mapped = mapTmdbItemToMediaItem(item, "tv");
        if (mapped) rawItems.push(mapped);
      });
    } else if (category === "Live") {
      const data = await fetchTmdb("tv/on_the_air", page);
      totalPages = (data.total_pages as number) || 1;
      const results = (data.results as Record<string, unknown>[]) || [];
      results.forEach((item) => {
        const mapped = mapTmdbItemToMediaItem(item, "tv");
        if (mapped) rawItems.push(mapped);
      });
    } else {
      // For "Home" / Trending, blend movies and TV weekly trends
      const movieData = await fetchTmdb("trending/movie/week", page);
      const movieResults = (movieData.results as Record<string, unknown>[]) || [];
      movieResults.forEach((item) => {
        const mapped = mapTmdbItemToMediaItem(item, "movie");
        if (mapped) rawItems.push(mapped);
      });

      const tvData = await fetchTmdb("trending/tv/week", page);
      const tvResults = (tvData.results as Record<string, unknown>[]) || [];
      tvResults.forEach((item) => {
        const mapped = mapTmdbItemToMediaItem(item, "tv");
        if (mapped) rawItems.push(mapped);
      });

      totalPages = Math.max(
        (movieData.total_pages as number) || 1,
        (tvData.total_pages as number) || 1
      );
    }

    // Strict cross-page deduplication filter: filter out anything already encountered in past pages
    const uniquePageItems: MediaItem[] = [];
    for (const item of rawItems) {
      if (!globalSeenIds.has(item.id)) {
        globalSeenIds.add(item.id);
        uniquePageItems.push(item);
      }
    }

    return {
      source: "TMDB API",
      items: uniquePageItems,
      fetchedAt: new Date().toISOString(),
      message: `Fetched ${uniquePageItems.length} unique titles for ${category} (Page ${page}).`,
      page,
      totalPages,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      source: "TMDB API",
      items: [],
      fetchedAt: new Date().toISOString(),
      message: `Could not fetch live data: ${message}`,
      page: 1,
      totalPages: 1,
    };
  }
}
