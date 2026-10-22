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
const STORAGE_PREFIX = "rabtv_catalog_cache_v16_"; // Incremented cache version
const ITEMS_PER_PAGE = 20;

let lastRequestTimestamp = 0;
const MIN_REQUEST_INTERVAL_MS = 250;

async function throttleRequest() {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTimestamp;
  if (timeSinceLast < MIN_REQUEST_INTERVAL_MS) {
    const delay = MIN_REQUEST_INTERVAL_MS - timeSinceLast;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  lastRequestTimestamp = Date.now();
}

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

const genreNameToId: Record<string, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  "sci-fi": 878,
  "sci-fi & fantasy": 10765,
  thriller: 53,
  war: 10752,
  western: 37,
};

const providerIdMap: Record<string, string> = {
  Netflix: "8",
  Prime: "119",
  "Disney+": "337",
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

  const releaseDate = (item.release_date || item.first_air_date || "") as string;

  // 🛑 UNIVERSAL RELEASE DATE SCRUBBER (Applies globally to Home, Netflix, Prime, Disney+, Search, etc.)
  // If a release date is slated more than 30 days into the future, return null so it is discarded everywhere.
  if (releaseDate) {
    const releaseTime = new Date(releaseDate).getTime();
    const maxAllowedTime = Date.now() + 30 * 24 * 60 * 60 * 1000;
    if (releaseTime > maxAllowedTime) {
      return null;
    }
  }

  const tmdbId = item.id;
  const uniqueId = `${mediaType}-${tmdbId}`;

  const year = releaseDate.split("-")[0];
  const voteAverage = item.vote_average as number | undefined;
  const rating = voteAverage ? voteAverage.toFixed(1) : "N/A";
  const posterPath = item.poster_path as string | undefined;
  const imagePath = posterPath
    ? `${TMDB_IMAGE_BASE}${posterPath}`
    : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80";
  const genre = getGenreName((item.genre_ids as number[]) || []);
  const description =
    (item.overview as string) || "Discover this amazing content on RABBiT TV";

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

async function fetchTmdb(endpoint: string, page = 1, extraParams: Record<string, string> = {}): Promise<Record<string, unknown>> {
  await throttleRequest();

  const url = new URL(endpoint, TMDB_BASE_URL);
  if (TMDB_API_KEY) {
    url.searchParams.set("api_key", TMDB_API_KEY);
  }
  url.searchParams.set("page", page.toString());

  for (const [key, value] of Object.entries(extraParams)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<Record<string, unknown>>;
}

export async function scrapeTrendingContent(page = 1): Promise<ScrapeResult> {
  return scrapeCategoryContent("Home", page, "Trending");
}

export async function scrapeCategoryContent(
  category: string,
  page = 1,
  genreFilter = "Trending",
  subFeed?: string
): Promise<ScrapeResult> {
  try {
    const cleanSubFeed = subFeed && subFeed !== "All (Default)" ? subFeed : undefined;
    const feedKey = cleanSubFeed ? `_${cleanSubFeed}` : "";
    const storageKey = `${STORAGE_PREFIX}_${category}${feedKey}_${genreFilter}`;
    const requiredItemsCount = page * ITEMS_PER_PAGE;

    let catalogItems: MediaItem[] = [];
    let maxApiPageReached = 0;
    let totalAvailablePages = 50;
    let isFullyLoaded = false;

    if (typeof window !== "undefined") {
      try {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          catalogItems = parsed.items || [];
          maxApiPageReached = parsed.maxApiPageReached || 0;
          totalAvailablePages = parsed.totalAvailablePages || 50;
          isFullyLoaded = parsed.isFullyLoaded || false;
        }
      } catch (e) {
        console.error("Failed to read local catalog cache", e);
      }
    }

    const seenIds = new Set(catalogItems.map((i) => i.id));

    if (catalogItems.length < requiredItemsCount && !isFullyLoaded) {
      while (catalogItems.length < requiredItemsCount && maxApiPageReached < totalAvailablePages) {
        const nextApiPage = maxApiPageReached + 1;
        const batch: MediaItem[] = [];

        const providerId = providerIdMap[category];
        const genreId = genreFilter && genreFilter !== "Trending" ? genreNameToId[genreFilter.toLowerCase()] : null;
        const isTvTab = category === "Series" || category === "TV Shows";
        const isInTheaters = category === "In Theaters";

        const discoverParams: Record<string, string> = {
          sort_by: "popularity.desc",
        };

        if (cleanSubFeed) {
          if (cleanSubFeed === "Russian") {
            discoverParams.with_original_language = "ru";
          } else if (cleanSubFeed === "British") {
            discoverParams.with_original_language = "en";
            discoverParams.with_origin_country = "GB";
          } else if (cleanSubFeed === "Hungarian") {
            discoverParams.with_original_language = "hu";
          } else if (cleanSubFeed === "German") {
            discoverParams.with_original_language = "de";
            discoverParams.with_origin_country = "DE";
          }
        }

        if (genreId) {
          discoverParams.with_genres = genreId.toString();
        }

        if (providerId) {
          discoverParams.with_watch_providers = providerId;
          discoverParams.watch_region = "CA";
        }

        let endpoint = isTvTab ? "discover/tv" : "discover/movie";

        if (isInTheaters) {
          endpoint = "movie/now_playing";
        }

        if (providerId || cleanSubFeed || isInTheaters) {
          let data = await fetchTmdb(endpoint, nextApiPage, discoverParams);
          let results = (data.results as Record<string, unknown>[]) || [];

          if (results.length === 0 && genreId && cleanSubFeed && !isInTheaters) {
            delete discoverParams.with_genres;
            data = await fetchTmdb(endpoint, nextApiPage, discoverParams);
            results = (data.results as Record<string, unknown>[]) || [];
          }

          totalAvailablePages = Math.min((data.total_pages as number) || 50, 50);
          results.forEach((item) => {
            const mapped = mapTmdbItemToMediaItem(item, isTvTab ? "tv" : "movie");
            if (mapped) batch.push(mapped);
          });

          if (category === "Home" && !isTvTab && !isInTheaters) {
            const tvData = await fetchTmdb("discover/tv", nextApiPage, discoverParams);
            const tvResults = (tvData.results as Record<string, unknown>[]) || [];
            tvResults.forEach((item) => {
              const mapped = mapTmdbItemToMediaItem(item, "tv");
              if (mapped) batch.push(mapped);
            });
          }
        } else if (category === "Home" && (!genreFilter || genreFilter === "Trending")) {
          const movieData = await fetchTmdb("trending/movie/week", nextApiPage);
          const tvData = await fetchTmdb("trending/tv/week", nextApiPage);

          totalAvailablePages = Math.min(
            Math.max((movieData.total_pages as number) || 1, (tvData.total_pages as number) || 1),
            50
          );

          const movieResults = (movieData.results as Record<string, unknown>[]) || [];
          movieResults.forEach((item) => {
            const mapped = mapTmdbItemToMediaItem(item, "movie");
            if (mapped) batch.push(mapped);
          });

          const tvResults = (tvData.results as Record<string, unknown>[]) || [];
          tvResults.forEach((item) => {
            const mapped = mapTmdbItemToMediaItem(item, "tv");
            if (mapped) batch.push(mapped);
          });
        } else {
          let standardEndpoint = isTvTab ? "tv/popular" : "movie/popular";
          let data = await fetchTmdb(standardEndpoint, nextApiPage, genreId ? { with_genres: genreId.toString() } : {});
          let results = (data.results as Record<string, unknown>[]) || [];

          if (results.length === 0 && genreId) {
            data = await fetchTmdb(standardEndpoint, nextApiPage);
            results = (data.results as Record<string, unknown>[]) || [];
          }

          totalAvailablePages = Math.min((data.total_pages as number) || 50, 50);
          results.forEach((item) => {
            const mapped = mapTmdbItemToMediaItem(item, isTvTab ? "tv" : "movie");
            if (mapped) batch.push(mapped);
          });
        }

        maxApiPageReached = nextApiPage;

        if (batch.length === 0 || nextApiPage >= totalAvailablePages) {
          isFullyLoaded = true;
        }

        for (const item of batch) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            catalogItems.push(item);
          }
        }
      }

      if (catalogItems.length < requiredItemsCount) {
        try {
          const fallbackEndpoint = isTvTab ? "tv/popular" : "movie/popular";
          const fallbackData = await fetchTmdb(fallbackEndpoint, 1);
          const fallbackResults = (fallbackData.results as Record<string, unknown>[]) || [];
          fallbackResults.forEach((item) => {
            const mapped = mapTmdbItemToMediaItem(item, isTvTab ? "tv" : "movie");
            if (mapped && !seenIds.has(mapped.id)) {
              seenIds.add(mapped.id);
              catalogItems.push(mapped);
            }
          });
        } catch (e) {
          console.error("Failed to load fallback buffer", e);
        }
      }

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              items: catalogItems,
              maxApiPageReached,
              totalAvailablePages,
              isFullyLoaded,
            })
          );
        } catch (e) {
          console.error("Failed to save expanded catalog cache", e);
        }
      }
    }

    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageSlice = catalogItems.slice(startIndex, endIndex);

    const totalPages = Math.max(1, Math.ceil(catalogItems.length / ITEMS_PER_PAGE));

    return {
      source: "TMDB API",
      items: pageSlice,
      fetchedAt: new Date().toISOString(),
      message: `Loaded ${pageSlice.length} titles for ${category}${cleanSubFeed ? ` (${cleanSubFeed})` : ""} / ${genreFilter} (Page ${page}).`,
      page,
      totalPages: isFullyLoaded ? totalPages : Math.max(totalPages, page + 1),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      source: "TMDB API",
      items: [],
      fetchedAt: new Date().toISOString(),
      message: `Could not load catalog: ${message}`,
      page: 1,
      totalPages: 1,
    };
  }
}
