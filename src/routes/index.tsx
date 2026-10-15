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
  "Here is the updated code that addresses both of your layout fixes:

1. **Fixed Navigation Bar Pillbox Clipping:** Replaced the rigid auto-centering logic on the top navigation bar with full horizontal scrolling (`overflow-x-auto`) and generous side padding (`px-4`), ensuring the rounded pillbox ends are fully visible and never cut off.
2. **Adjusted Featured Cover Art Dimensions:** Set the featured image container to span **75% height** vertically (`h-[75%]`) with `w-full h-full object-cover` so it stretches **100% horizontally**, while keeping it strictly constrained inside the top container to prevent any overflow or clipping.

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
    setCardSize(getSavedCardSize
