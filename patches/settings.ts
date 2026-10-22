export type CardSize = "small" | "medium" | "large";
export type AppTheme = "violet" | "red" | "midnight" | "emerald" | "amber" | "cyan";
export type StreamQuality = "1080p" | "720p" | "480p" | "auto";
export type HistoryScale = "off" | "20%" | "50%" | "80%";

export const DISCLAIMER_ACCEPTED_KEY = "rabtv_disclaimer_accepted";
export const CARD_SIZE_KEY = "rabtv_card_size";
export const THEME_KEY = "rabtv_app_theme";
export const HELPFUL_MOUSE_KEY = "rabtv_helpful_mouse";
export const STREAM_QUALITY_KEY = "rabtv_stream_quality";
export const USER_AGE_KEY = "rabtv_user_age";
export const HISTORY_OVERSCALE_KEY = "rabtv_history_overscale";
export const LARGE_BUTTONS_KEY = "rabtv_large_buttons";

export function getSavedCardSize(): CardSize {
  if (typeof window === "undefined") return "large";
  return (localStorage.getItem(CARD_SIZE_KEY) as CardSize) || "large";
}

export function saveCardSize(size: CardSize) {
  if (typeof window !== "undefined") {
    localStorage.setItem(CARD_SIZE_KEY, size);
  }
}

export function getSavedTheme(): AppTheme {
  if (typeof window === "undefined") return "violet";
  return (localStorage.getItem(THEME_KEY) as AppTheme) || "violet";
}

export function saveTheme(theme: AppTheme) {
  if (typeof window !== "undefined") {
    localStorage.setItem(THEME_KEY, theme);
  }
}

export function getSavedStreamQuality(): StreamQuality {
  if (typeof window === "undefined") return "1080p";
  const val = localStorage.getItem(STREAM_QUALITY_KEY);
  return (val as StreamQuality) || "1080p";
}

export function saveStreamQuality(quality: StreamQuality) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STREAM_QUALITY_KEY, quality);
  }
}

export function getHelpfulMouse(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(HELPFUL_MOUSE_KEY) === "true";
}

export function setHelpfulMouse(enabled: boolean) {
  if (typeof window !== "undefined") {
    localStorage.setItem(HELPFUL_MOUSE_KEY, String(enabled));
    window.dispatchEvent(new Event("rabtv_settings_updated"));
  }
}

export function getHistoryOverscale(): HistoryScale {
  if (typeof window === "undefined") return "off";
  return (localStorage.getItem(HISTORY_OVERSCALE_KEY) as HistoryScale) || "off"; // default off
}

export function setHistoryOverscale(scale: HistoryScale): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(HISTORY_OVERSCALE_KEY, scale);
  window.dispatchEvent(new Event("rabtv_settings_updated"));
}

export function getLargeButtons(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LARGE_BUTTONS_KEY) === "true"; // default off
}

export function setLargeButtons(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LARGE_BUTTONS_KEY, enabled ? "true" : "false");
  window.dispatchEvent(new Event("rabtv_settings_updated"));
}

/** AGE TIER & RATING VERIFICATION HELPERS */

export function getSavedUserAge(): number {
  if (typeof window === "undefined") return 18;
  const saved = localStorage.getItem(USER_AGE_KEY);
  if (!saved) return 18;
  const parsed = parseInt(saved, 10);
  return isNaN(parsed) ? 18 : parsed;
}

export function saveUserAge(age: number): void {
  if (typeof window !== "undefined") {
    const validAge = Math.max(1, Math.min(120, age));
    localStorage.setItem(USER_AGE_KEY, String(validAge));
    window.dispatchEvent(new Event("rabtv_settings_updated"));
  }
}

export function sanitizeTMDBId(rawId: string | number): string {
  if (!rawId) return "";
  return String(rawId).replace(/^(movie|tv)-/, "").trim();
}

export function isAllowedForAge(rating?: string | null, genre?: string | null, userAge: number = getSavedUserAge()): boolean {
  // Ages 16+ have full unlocked access to all media including Rated R
  if (userAge >= 16) return true;

  const cleanRating = (rating || "").trim().toUpperCase();
  const cleanGenre = (genre || "").trim().toLowerCase();

  // Explicit adult ratings are strictly blocked for under 16
  if (["R", "NC-17", "TV-MA", "UNRATED", "NR"].includes(cleanRating)) {
    return false;
  }

  // If list summary lacks explicit MPAA rating, fallback to safe genre checks for kids
  if (!cleanRating) {
    if (userAge < 9) {
      return cleanGenre.includes("animation") || cleanGenre.includes("family") || cleanGenre.includes("kids");
    }
    if (userAge < 13) {
      return !cleanGenre.includes("horror") && !cleanGenre.includes("thriller") && !cleanGenre.includes("crime");
    }
  }

  // Tier 1: Ages 0 - 8 (G, TV-Y, TV-G)
  if (userAge < 9) {
    return ["G", "TV-Y", "TV-G"].includes(cleanRating);
  }

  // Tier 2: Ages 9 - 12 (G, PG, TV-Y, TV-Y7, TV-G, TV-PG)
  if (userAge < 13) {
    return ["G", "PG", "TV-Y", "TV-Y7", "TV-G", "TV-PG"].includes(cleanRating);
  }

  // Tier 3: Ages 13 - 15 (G, PG, PG-13, TV-Y, TV-Y7, TV-G, TV-PG, TV-14)
  if (userAge < 16) {
    return ["G", "PG", "PG-13", "TV-Y", "TV-Y7", "TV-G", "TV-PG", "TV-14"].includes(cleanRating);
  }

  return false;
}

// Helper to get Tailwind CSS width/height classes + responsive container constraints
export function getPosterDimensions(size: CardSize) {
  switch (size) {
    case "small":
      return {
        card: "w-[85px] min-w-[85px] h-[125px]",
        image: "w-full h-full object-cover",
        isSmall: true,
      };
    case "medium":
      return {
        card: "w-[160px] min-w-[160px] h-[240px]",
        image: "w-full h-[160px] object-cover",
        text: "text-xs",
        isSmall: false,
      };
    case "large":
    default:
      return {
        card: "w-[280px] min-w-[280px] h-[420px]",
        image: "w-full h-[300px] object-cover",
        text: "text-sm",
        isSmall: false,
      };
  }
}
