export type CardSize = "small" | "medium" | "large";
export type StreamQuality = "1080p" | "720p" | "480p" | "auto";
export type AppTheme = "violet" | "red" | "midnight";

export const DISCLAIMER_ACCEPTED_KEY = "rabtv_disclaimer_accepted";
export const CARD_SIZE_KEY = "rabtv_card_size";
export const STREAM_QUALITY_KEY = "rabtv_stream_quality";
export const THEME_KEY = "rabtv_app_theme";
export const HELPFUL_MOUSE_KEY = "rabtv_helpful_mouse";

export function getSavedCardSize(): CardSize {
  if (typeof window === "undefined") return "large";
  return (localStorage.getItem(CARD_SIZE_KEY) as CardSize) || "large";
}

export function saveCardSize(size: CardSize) {
  if (typeof window !== "undefined") {
    localStorage.setItem(CARD_SIZE_KEY, size);
  }
}

export function getSavedStreamQuality(): StreamQuality {
  if (typeof window === "undefined") return "1080p";
  // Defaults to 1080p if nothing is explicitly set
  return (localStorage.getItem(STREAM_QUALITY_KEY) as StreamQuality) || "1080p";
}

export function saveStreamQuality(quality: StreamQuality) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STREAM_QUALITY_KEY, quality);
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

// Helper to get Tailwind CSS width/height classes + responsive container constraints
export function getPosterDimensions(size: CardSize) {
  switch (size) {
    case "small":
      return {
        card: "w-[85px] min-w-[85px] h-[125px]",
        image: "w-full h-full object-cover",
        isSmall: true, // Hides inline text/badges for clean poster view
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
