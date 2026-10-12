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

// Hardcoded fallback ensures Vite builds always have valid API access
const TMDB_API_KEY =
  (import.meta.env.VITE_TMDB_API_KEY as string) || "YOUR_ACTUAL_TMDB_API_KEY_HERE";

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
    id: `${mediaType}-${item.id}`,
    title,
    description,
    image: imagePath,
    href: `/details?id=${item.id}&type=${mediaType}`,
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
    if (!TMDB_API_KEY) {
      return {
        source: "TMDB API",
        items: [
          {
            id: "demo-1",
            title: "Demo: Add Your TMDB API Key",
            description: "Set VITE_TMDB_API_KEY in your environment variables.",
            image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80",
            href: "/details?id=demo-1&type=movie",
            genre: "Demo",
          },
        ],
        fetchedAt: new Date().toISOString(),
        message: "No TMDB API Key found.",
      };
    }

    const items: MediaItem[] = [];
    let totalPages = 1;

    if (category === "Movies") {
      const data = await fetchTmdb("movie/popular", page);
      totalPages = (data.total_pages as number) || 1;
      const results = (data.results as Record<string, unknown>[]) || [];
      results.forEach((item) => {
        const mapped = mapTmdbItemToMediaItem(item, "movie");
        if (mapped) items.push(mapped);
      });
    } else if (category === "Series") {
      const data = await fetchTmdb("tv/popular", page);
      totalPages = (data.total_pages as number) || 1;
      const results = (data.results as Record<string, unknown>[]) || [];
      results.forEach((item) => {
        const mapped = mapTmdbItemToMediaItem(item, "tv");
        if (mapped) items.push(mapped);
      });
    } else if (category === "Live") {
      const data = await fetchTmdb("tv/on_the_air", page);
      totalPages = (data.total_pages as number) || 1;
      const results = (data.results as Record<string, unknown>[]) || [];
      results.forEach((item) => {
        const mapped = mapTmdbItemToMediaItem(item, "tv");
        if (mapped) items.push(mapped);
      });
    } else {
      // Home tab: Combine movies and TV shows for the selected page
      const movieData = await fetchTmdb("trending/movie/week", page);
      const movieResults = (movieData.results as Record<string, unknown>[]) || [];
      movieResults.forEach((item) => {
        const mapped = mapTmdbItemToMediaItem(item, "movie");
        if (mapped) items.push(mapped);
      });

      const tvData = await fetchTmdb("trending/tv/week", page);
      const tvResults = (tvData.results as Record<string, unknown>[]) || [];
      tvResults.forEach((itemThat explains everything! 

In line 25 of `tmdb-scraper.ts`, the scraper checks for `TMDB_API_KEY`:

```typescript
const TMDB_API_KEY = (import.meta.env.VITE_TMDB_API_KEY as string) || "";
