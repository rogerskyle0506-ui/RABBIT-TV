import { Outlet, createRootRoute, HeadContent, Scripts, Link, useNavigate } from "@tanstack/react-router";
import { AuthProvider } from "@/components/auth-provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import "@/styles.css";
import { useState, useEffect, useRef } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import {
  CardSize,
  StreamQuality,
  AppTheme,
  HistoryScale,
  DISCLAIMER_ACCEPTED_KEY,
  getSavedCardSize,
  saveCardSize,
  getSavedStreamQuality,
  saveStreamQuality,
  getSavedTheme,
  saveTheme,
  getHelpfulMouse,
  setHelpfulMouse,
  getSavedUserAge,
  saveUserAge,
  getHistoryOverscale,
  setHistoryOverscale,
  getLargeButtons,
  setLargeButtons,
} from "@/lib/settings";

const AUTHORIZATION_CODE = "34688643";
const globalFeedOptions = ["All (Default)", "Russian", "British", "Hungarian", "German"] as const;
export type GlobalFeedOption = (typeof globalFeedOptions)[number];
const HOSTED_ICON_URL = "https://github.com/rogerskyle0506-ui/RABBIT-TV/blob/main/assets/icon.png?raw=true";

const themeStatusBarMap: Record<AppTheme, string> = {
  violet: "#0f0728",
  red: "#180505",
  midnight: "#050b1a",
  emerald: "#021a12",
  amber: "#1c1505",
  cyan: "#021820",
};

async function updateNativeStatusBar(theme: AppTheme) {
  if (typeof window === "undefined") return;
  try {
    const hex = themeStatusBarMap[theme] || "#050b1a";
    await StatusBar.setBackgroundColor({ color: hex });
    await StatusBar.setStyle({ style: Style.Dark });
  } catch (e) {
    // Gracefully fallback
  }
}

export const Route = createRootRoute({
  component: RootComponent,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ],
    title: "RABTV - Stream Your Favorite Shows",
  }),
});

function RootComponent() {
  const navigate = useNavigate();
  const [showFirstStartModal, setShowFirstStartModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);
  const [ageErrorNotice, setAgeErrorNotice] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const lastScrollYRef = useRef(0);

  const [activeSettingsTab, setActiveSettingsTab] = useState<"theme" | "scale" | "backup" | null>(null);

  const [cardSize, setCardSize] = useState<CardSize>("large");
  const [streamQuality, setStreamQuality] = useState<StreamQuality>("1080p");
  const [appTheme, setAppTheme] = useState<AppTheme>("violet");
  const [helpfulMouse, setHelpfulMouseState] = useState(false);
  const [historyOverscale, setHistoryOverscaleState] = useState<HistoryScale>("off");
  const [largeButtons, setLargeButtonsState] = useState(false);
  const [userAgeInput, setUserAgeInput] = useState<string>("");
  const [profileNameInput, setProfileNameInput] = useState<string>("");
  const [savedProfileName, setSavedProfileName] = useState<string>("");
  const [settingsAgeCodeInput, setSettingsAgeCodeInput] = useState<string>("");
  const [settingsAgeError, setSettingsAgeError] = useState<boolean>(false);
  const [settingsAgeSuccess, setSettingsAgeSuccess] = useState<boolean>(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [canModalScrollDown, setCanModalScrollDown] = useState<boolean>(false);

  const [headerSearchInput, setHeaderSearchInput] = useState("");

  const [selectedGlobalFeed, setSelectedGlobalFeed] = useState<GlobalFeedOption>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("rabtv_global_feed") as GlobalFeedOption) || "All (Default)";
    }
    return "All (Default)";
  });

  const handleGlobalFeedChange = (feed: GlobalFeedOption) => {
    setSelectedGlobalFeed(feed);
    localStorage.setItem("rabtv_global_feed", feed);
    window.dispatchEvent(new CustomEvent("rabtv_global_feed_updated", { detail: feed }));
  };

  const handleHeaderSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/search", search: { q: headerSearchInput.trim() } });
    setHeaderSearchInput("");
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new Event("rabtv_restore_home_state"));
    navigate({ to: "/" });
  };

  const handleCloseAll = () => {
    setShowSettings(false);
    setShowProfileMenu(false);
    setActiveSettingsTab(null);
  };

  const handleToggleSettings = () => {
    if (showSettings) {
      handleCloseAll();
    } else {
      handleCloseAll();
      lastScrollYRef.current = window.scrollY;
      setShowSettings(true);
      setActiveSettingsTab(null);
    }
  };

  const handleToggleProfileMenu = () => {
    if (showProfileMenu) {
      handleCloseAll();
    } else {
      handleCloseAll();
      lastScrollYRef.current = window.scrollY;
      setShowProfileMenu(true);
    }
  };

  // Optimized scroll listener with { passive: true } for zero jank and memory leak prevention
  useEffect(() => {
    const handleWindowScroll = () => {
      if (showSettings || showProfileMenu) {
        if (Math.abs(window.scrollY - lastScrollYRef.current) > 60) {
          handleCloseAll();
        }
      }
    };

    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
    };
  }, [showSettings, showProfileMenu]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes("silk") || ua.includes("firetv") || ua.includes("amazon")) {
        document.documentElement.classList.add("fire-os");
      }
    }

    const authorized = localStorage.getItem(DISCLAIMER_ACCEPTED_KEY);
    if (!authorized) {
      setShowFirstStartModal(true);
    }

    const loadedTheme = getSavedTheme();
    setCardSize(getSavedCardSize());
    setStreamQuality(getSavedStreamQuality());
    setAppTheme(loadedTheme);
    setHelpfulMouseState(getHelpfulMouse());
    setHistoryOverscaleState(getHistoryOverscale());
    setLargeButtonsState(getLargeButtons());

    void updateNativeStatusBar(loadedTheme);

    const existingAge = localStorage.getItem("rabtv_user_age");
    if (existingAge) {
      setUserAgeInput(existingAge);
    }

    const existingName = localStorage.getItem("rabtv_profile_name");
    if (existingName) {
      setProfileNameInput(existingName);
      setSavedProfileName(existingName);
    }

    const handleSettingsUpdate = () => {
      const updatedTheme = getSavedTheme();
      setCardSize(getSavedCardSize());
      setStreamQuality(getSavedStreamQuality());
      setAppTheme(updatedTheme);
      setHelpfulMouseState(getHelpfulMouse());
      setHistoryOverscaleState(getHistoryOverscale());
      setLargeButtonsState(getLargeButtons());
      void updateNativeStatusBar(updatedTheme);

      const updatedName = localStorage.getItem("rabtv_profile_name");
      if (updatedName) setSavedProfileName(updatedName);
    };

    window.addEventListener("rabtv_settings_updated", handleSettingsUpdate);
    return () => {
      window.removeEventListener("rabtv_settings_updated", handleSettingsUpdate);
    };
  }, []);

  const handleFirstTimeAuthorize = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedAge = userAgeInput.trim();
    if (!trimmedAge || isNaN(parseInt(trimmedAge, 10))) {
      setAgeErrorNotice(true);
      setPasscodeError(false);
      return;
    }

    if (passcodeInput.trim() === AUTHORIZATION_CODE) {
      localStorage.setItem(DISCLAIMER_ACCEPTED_KEY, "true");
      saveCardSize(cardSize);
      saveStreamQuality(streamQuality);
      saveTheme(appTheme);
      setHelpfulMouse(helpfulMouse);

      const parsedAge = parseInt(trimmedAge, 10);
      saveUserAge(parsedAge);

      const finalName = profileNameInput.trim() || "Friend";
      localStorage.setItem("rabtv_profile_name", finalName);
      setSavedProfileName(finalName);

      setShowFirstStartModal(false);
      setPasscodeError(false);
      setAgeErrorNotice(false);
      window.dispatchEvent(new Event("rabtv_settings_updated"));
    } else {
      setPasscodeError(true);
      setAgeErrorNotice(false);
      setPasscodeInput("");
    }
  };

  const getBodyBackground = (theme: AppTheme) => {
    switch (theme) {
      case "red":
        return "bg-gradient-to-br from-zinc-950 via-red-950/40 to-black";
      case "midnight":
        return "bg-gradient-to-br from-slate-950 via-blue-950/40 to-slate-950";
      case "emerald":
        return "bg-gradient-to-br from-slate-950 via-emerald-950/40 to-slate-950";
      case "amber":
        return "bg-gradient-to-br from-stone-950 via-yellow-950/40 to-neutral-950";
      case "cyan":
        return "bg-gradient-to-br from-slate-950 via-cyan-950/40 to-slate-950";
      case "violet":
      default:
        return "bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950";
    }
  };

  const getCardBackground = (theme: AppTheme) => {
    switch (theme) {
      case "red":
        return "bg-zinc-900/95 border-red-500/30";
      case "midnight":
        return "bg-slate-900/95 border-blue-500/30";
      case "emerald":
        return "bg-slate-900/95 border-emerald-500/30";
      case "amber":
        return "bg-stone-900/95 border-amber-500/30";
      case "cyan":
        return "bg-slate-900/95 border-cyan-500/30";
      case "violet":
      default:
        return "bg-slate-900/95 border-violet-500/30";
    }
  };

  const getOuterPanelBackground = (theme: AppTheme) => {
    switch (theme) {
      case "red":
        return "bg-red-950/80 border-red-500/20 shadow-red-950/40";
      case "midnight":
        return "bg-blue-950/80 border-blue-500/20 shadow-blue-950/40";
      case "emerald":
        return "bg-emerald-950/80 border-emerald-500/20 shadow-emerald-950/40";
      case "amber":
        return "bg-yellow-950/80 border-amber-500/20 shadow-yellow-950/40";
      case "cyan":
        return "bg-cyan-950/80 border-cyan-500/20 shadow-cyan-950/40";
      case "violet":
      default:
        return "bg-purple-950/80 border-violet-500/20 shadow-purple-950/40";
    }
  };

  const getThemeHeaderStyles = (theme: AppTheme) => {
    switch (theme) {
      case "red":
        return { btnBg: "bg-red-950/70 border-red-500/30 text-red-200 hover:bg-red-900/80" };
      case "midnight":
        return { btnBg: "bg-blue-950/70 border-blue-500/30 text-blue-200 hover:bg-blue-900/80" };
      case "emerald":
        return { btnBg: "bg-emerald-950/70 border-emerald-500/30 text-emerald-200 hover:bg-emerald-900/80" };
      case "amber":
        return { btnBg: "bg-yellow-950/70 border-amber-500/30 text-amber-200 hover:bg-yellow-900/80" };
      case "cyan":
        return { btnBg: "bg-cyan-950/70 border-cyan-500/30 text-cyan-200 hover:bg-cyan-900/80" };
      case "violet":
      default:
        return { btnBg: "bg-purple-950/70 border-violet-500/30 text-purple-200 hover:bg-purple-900/80" };
    }
  };

  const activeHeader = getThemeHeaderStyles(appTheme);

  const getPrimaryAccentColor = (theme: AppTheme) => {
    switch (theme) {
      case "red": return "text-red-400";
      case "midnight": return "text-blue-400";
      case "emerald": return "text-emerald-300";
      case "amber": return "text-amber-300";
      case "cyan": return "text-cyan-300";
      case "violet":
      default: return "text-violet-400";
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

  return (
    <html lang="en" data-theme={appTheme}>
      <head>
        <HeadContent />
        {helpfulMouse && (
          <style>{`
            *, button, a, select, input, [role="button"] {
              cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 24 24' fill='%23ffffff' stroke='%23000000' stroke-width='2'%3E%3Cpath d='M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z'/%3E%3C/svg%3E"), auto !important;
            }
          `}</style>
        )}
      </head>
      <body className={`min-h-screen max-w-full overflow-x-hidden ${getBodyBackground(appTheme)} text-slate-100 antialiased transition-colors duration-300`}>
        <PreviewHostBridge />
        <AuthProvider>
          <header className={`sticky top-0 z-40 border-b border-white/10 ${getOuterPanelBackground(appTheme)} backdrop-blur-md transition-colors duration-300`}>
            <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-stretch sm:items-center justify-between px-3 py-2 sm:px-6 gap-2">
              
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <a
                  href="/"
                  onClick={handleLogoClick}
                  className="flex items-center gap-2 text-sm sm:text-xl font-black tracking-wider text-white focus:outline-none shrink-0 group cursor-pointer"
                >
                  <img
                    src={HOSTED_ICON_URL}
                    alt="RABBiT TV Icon"
                    className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl object-cover border border-red-500/30 shadow-lg transition-transform group-hover:scale-105 shrink-0"
                  />
                  <span className="whitespace-nowrap">RABBiT TV</span>
                </a>

                {savedProfileName && !showFirstStartModal && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={handleToggleProfileMenu}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold text-white shadow transition cursor-pointer"
                    >
                      <span>👋 Hi, <strong className="text-white">{savedProfileName}</strong></span>
                      <span className="text-[10px] ml-1 text-slate-300">▼</span>
                    </button>
                  </div>
                )}
              </div>

              {!showFirstStartModal && (
                <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  
                  <form onSubmit={handleHeaderSearchSubmit} className="flex items-center gap-1 shrink-0 flex-1 sm:flex-initial">
                    <input
                      type="text"
                      value={headerSearchInput}
                      onChange={(e) => setHeaderSearchInput(e.target.value)}
                      placeholder="Search..."
                      className="h-9 sm:h-10 w-full sm:w-32 lg:w-44 rounded-xl border border-white/10 bg-slate-900/80 px-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2"
                    />
                    <button
                      type="submit"
                      className={`flex h-9 sm:h-10 px-2.5 sm:px-3 items-center justify-center rounded-xl border text-xs font-bold shadow-md transition shrink-0 ${activeHeader.btnBg}`}
                      aria-label="Search"
                    >
                      🔍
                    </button>
                  </form>

                  <div className="relative shrink-0">
                    <div className={`flex h-9 sm:h-10 items-center justify-center rounded-xl border px-2 sm:px-3 text-[11px] sm:text-xs font-bold shadow-md transition focus-within:ring-2 ${activeHeader.btnBg} gap-1 relative pointer-events-auto`}>
                      <span className="whitespace-nowrap pointer-events-none truncate max-w-[90px] sm:max-w-none">
                        🌐 {selectedGlobalFeed === "All (Default)" ? "Global" : selectedGlobalFeed}
                      </span>
                      <span className="text-[9px] pointer-events-none">▼</span>

                      <select
                        value={selectedGlobalFeed}
                        onChange={(e) => handleGlobalFeedChange(e.target.value as GlobalFeedOption)}
                        className="absolute inset-0 w-full h-full opacity-0 bg-transparent text-white cursor-pointer z-50 appearance-none"
                      >
                        <option value="All (Default)" className="bg-slate-900 text-white p-2">🌐 All (Default)</option>
                        <option value="Russian" className="bg-slate-900 text-white p-2">🇷🇺 Russian</option>
                        <option value="British" className="bg-slate-900 text-white p-2">🇬🇧 British</option>
                        <option value="Hungarian" className="bg-slate-900 text-white p-2">🇭🇺 Hungarian</option>
                        <option value="German" className="bg-slate-900 text-white p-2">🇩🇪 German</option>
                      </select>
                    </div>
                  </div>

                  <Link
                    to="/watch-history"
                    className={`flex h-9 sm:h-10 items-center justify-center rounded-xl border px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold shadow-md transition focus:outline-none focus:ring-2 shrink-0 ${activeHeader.btnBg}`}
                  >
                    🕒 History
                  </Link>

                  <button
                    type="button"
                    onClick={handleToggleSettings}
                    className={`flex h-9 sm:h-10 w-9 sm:w-10 items-center justify-center rounded-xl border text-base sm:text-lg shadow-md transition focus:outline-none focus:ring-2 shrink-0 ${activeHeader.btnBg}`}
                    aria-label="Settings"
                  >
                    ⚙️
                  </button>
                </div>
              )}
            </div>
          </header>

          <Outlet />
          <Scripts />
        </AuthProvider>
      </body>
    </html>
  );
}
