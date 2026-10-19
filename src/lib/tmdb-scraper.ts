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

async function fetchTmdb(endpoint: string, page = 1, extraParams: Record<string, string> = {}): Promise<Record<string, unknown>> {
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
  return scrapeCategoryContent("Home", page);
}

export async function scrapeCategoryContent(
  category: "Home" | "Series" | "Movies" | "Live" | "My List",
  page = 1,
  genreFilter?: string
): Promise<ScrapeResult> {
  try {
    const ITEMS_PER_PAGE = 20;
    const globalSeenIds = new Set<string>();
    const allUniqueCollectedItems: MediaItem[] = [];

    let maxApiPages = 5; // Fetch deep enough to guarantee clean 20-item chunks per UI page
    let currentApiPage = 1;
    let totalApiPagesAvailable = 1;

    // Loop through API pages to aggregate a robust pool of unique items
    while (currentApiPage <= maxApiPages) {
      let data: Record<string, unknown>;
      const batchItems: MediaItem[] = [];

      if (category === "Movies") {
        if (genreFilter && genreFilter !== "Trending") {
          const genreId = genreNameToId[genreFilter.toLowerCase()];
          data = await fetchTmdb("discover/movie", currentApiPage, genreId ? { with_genres: genreId.toString() } : {});
        } else {
          data = await fetchTmdb("movie/popular", currentApiPage);
        }
        totalApiPagesAvailable = (data.total_pages as number) || 1;
        const results = (data.results as Record<string, unknown>[]) || [];
        results.forEach((item) => {
          const mapped = mapTmdbItemToMediaItem(item, "movie");
          if (mapped) batchItems.push(mapped);
        });
      } else if (category === "Series") {
        if (genreFilter && genreFilter !== "Trending") {
          const genreId = genreNameToId[genreFilter.toLowerCase()];
          data = await fetchTmdb("discover/tv", currentApiPage, genreId ? { with_genres: genreId.toString() } : {});
        } else {
          data = await fetchTmdb("tv/popular", currentApiPage);
        }
        totalApiPagesAvailable = (data.total_pages as number) || 1;
        const results = (data.results as Record<string, unknown>[]) || [];
        results.forEach((item) => {
          const mapped = mapTmdbItemToMediaItem(item, "tv");
          if (mapped) batchItems.push(mapped);
        });
      } else if (category === "Live") {
        data = await fetchTmdb("tv/on_the_air", currentApiPage);
        totalApiPagesAvailable = (data.total_pages as number) || 1;
        const results = (data.results as Record<string, unknown>[]) || [];
        results.forEach((item) => {
          const mapped = mapTmdbItemToMediaItem(item, "tv");
          if (mapped) batchItems.push(mapped);
        });
      } else {
        const movieData = await fetchTmdb("trending/movie/week", currentApiPage);
        const tvData = await fetchTmdb("trending/tv/week", currentApiPage);
        
        totalApiPagesAvailable = Math.max(
          (movieData.total_pages as number) || 1,
          (tvData.total_pages as number) || 1
        );

        const movieResults = (movieData.results as Record<string, unknown>[]) || [];
        movieResults.forEach((item) => {
          const mapped = mapTmdbItemToMediaItem(item, "movie");
          if (mapped) batchItems.push(mapped);
        });

        const tvResults = (tvData.results as Record<string, unknown>[]) || [];
        tvResults.forEach((item) => {
          const mapped = mapTmdbItemToMediaItem(item, "tv");
          if (mapped) batchItems.push(mapped);
        });
      }

      // Deduplicate on the fly into our master collection pool
      for (const item of batchItems) {
        if (!globalSeenIds.has(item.id)) {
          globalSeenIds.add(item.id);
          allUniqueCollectedItems.push(item);
        }
      }

      if (currentApiPage >= totalApiPagesAvailable || allUniqueCollectedItems.length >= page * ITEMS_PER_PAGE + 40) {
        break;
      }
      currentApiPage++;
    }

    // Slice out the exact 20 items requested for the current UI page index
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageSlice = allUniqueCollectedItems.slice(startIndex, endIndex);

    // Calculate realistic total pages based on our master collected unique pool size
    const estimatedTotalPages = Math.max(1, Math.ceil(allUniqueCollectedItems.length / ITEMS_PER_PAGE), Math.min(totalApiPagesAvailable, 50));

    return {
      source: "TMDB API",
      items: pageSlice,
      fetchedAt: new Date().toISOString(),
      message: `Fetched ${pageSlice.length} titles for ${category} (Page ${page}).`,
      page,
      totalPages: estimatedTotalPages,
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
