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
  const [profileNameInput, setProfileNameInput] = useState<string>("Rabbit");
  const [savedProfileName, setSavedProfileName] = useState<string>("Rabbit");
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

  useEffect(() => {
    const handleWindowScroll = () => {
      if (showSettings || showProfileMenu) {
        if (Math.abs(window.scrollY - lastScrollYRef.current) > 60) {
          handleCloseAll();
        }
      }
    };

    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, [showSettings, showProfileMenu]);

  const handleModalScrollCheck = (node: HTMLDivElement | null) => {
    if (!node) return;
    const { scrollTop, scrollHeight, clientHeight } = node;
    setCanModalScrollDown(scrollTop + clientHeight < scrollHeight - 30);
  };

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

    const existingName = localStorage.getItem("rabtv_profile_name") || "Rabbit";
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

      const updatedName = localStorage.getItem("rabtv_profile_name") || "Rabbit";
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

      const finalName = profileNameInput.trim() || "Rabbit";
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

  const handleSizeChange = (newSize: CardSize) => {
    saveCardSize(newSize);
    setCardSize(newSize);
    window.dispatchEvent(new Event("rabtv_settings_updated"));
  };

  const handleThemeChange = (newTheme: AppTheme) => {
    saveTheme(newTheme);
    setAppTheme(newTheme);
    void updateNativeStatusBar(newTheme);
    window.dispatchEvent(new Event("rabtv_settings_updated"));
  };

  const handleMouseToggle = (enabled: boolean) => {
    setHelpfulMouse(enabled);
    setHelpfulMouseState(enabled);
  };

  const handleHistoryOverscaleChange = (scale: HistoryScale) => {
    setHistoryOverscale(scale);
    setHistoryOverscaleState(scale);
  };

  const handleLargeButtonsToggle = (enabled: boolean) => {
    setLargeButtons(enabled);
    setLargeButtonsState(enabled);
  };

  const handleUpdateAgeInSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (settingsAgeCodeInput.trim() === AUTHORIZATION_CODE) {
      const parsedAge = parseInt(userAgeInput, 10);
      if (isNaN(parsedAge)) {
        setSettingsAgeError(true);
        return;
      }
      saveUserAge(parsedAge);
      setSettingsAgeError(false);
      setSettingsAgeSuccess(true);
      setSettingsAgeCodeInput("");
      setTimeout(() => setSettingsAgeSuccess(false), 3000);
      window.dispatchEvent(new Event("rabtv_settings_updated"));
    } else {
      setSettingsAgeError(true);
      setSettingsAgeCodeInput("");
    }
  };

  const handleSaveBackup = () => {
    const backupData = {
      cardSize,
      streamQuality,
      appTheme,
      helpfulMouse,
      historyOverscale,
      largeButtons,
      userAge: getSavedUserAge(),
      profileName: savedProfileName,
      myList: localStorage.getItem("rabtv_my_list"),
      favorites: localStorage.getItem("rabtv_favorites"),
      backedUpAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rabtv_profile_backup.json";
    a.click();
    URL.revokeObjectURL(url);
    setBackupStatus("Profile settings backup saved!");
    setTimeout(() => setBackupStatus(null), 3000);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.cardSize) saveCardSize(data.cardSize);
        if (data.streamQuality) saveStreamQuality(data.streamQuality);
        if (data.appTheme) {
          saveTheme(data.appTheme);
          setAppTheme(data.appTheme);
          void updateNativeStatusBar(data.appTheme);
        }
        if (typeof data.helpfulMouse === "boolean") setHelpfulMouse(data.helpfulMouse);
        if (data.historyOverscale) setHistoryOverscale(data.historyOverscale);
        if (typeof data.largeButtons === "boolean") setLargeButtons(data.largeButtons);
        if (data.userAge) saveUserAge(data.userAge);
        if (data.profileName) {
          localStorage.setItem("rabtv_profile_name", data.profileName);
          setSavedProfileName(data.profileName);
        }
        if (data.myList) localStorage.setItem("rabtv_my_list", data.myList);
        if (data.favorites) localStorage.setItem("rabtv_favorites", data.favorites);

        localStorage.removeItem(DISCLAIMER_ACCEPTED_KEY);
        setShowFirstStartModal(true);
        handleCloseAll();
        setBackupStatus("Settings restored. Please reinstate your passcode agreement.");
      } catch {
        setBackupStatus("Failed to restore backup file.");
      }
    };
    reader.readAsText(file);
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

  const getSubtlePillBg = (theme: AppTheme) => {
    switch (theme) {
      case "red": return "bg-red-950/50 border-red-500/30 text-red-200 hover:bg-red-900/60";
      case "midnight": return "bg-blue-950/50 border-blue-500/30 text-blue-200 hover:bg-blue-900/60";
      case "emerald": return "bg-emerald-950/50 border-emerald-500/30 text-emerald-200 hover:bg-emerald-900/60";
      case "amber": return "bg-yellow-950/50 border-amber-500/30 text-amber-200 hover:bg-yellow-900/60";
      case "cyan": return "bg-cyan-950/50 border-cyan-500/30 text-cyan-200 hover:bg-cyan-900/60";
      case "violet":
      default: return "bg-purple-950/50 border-violet-500/30 text-purple-200 hover:bg-purple-900/60";
    }
  };

  const allThemesList: { id: AppTheme; label: string }[] = [
    { id: "violet", label: "🟣 Violet / Neon" },
    { id: "red", label: "🔴 Red & Black" },
    { id: "midnight", label: "🔵 Midnight & Black" },
    { id: "emerald", label: "🟢 Emerald / Teal" },
    { id: "amber", label: "🟠 Amber / Gold" },
    { id: "cyan", label: "🔷 Cyan / Sky" },
  ];

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

          {/* FIRST START / DISCLAIMER MODAL */}
          {showFirstStartModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
              <div className={`w-full max-w-lg rounded-2xl border ${getCardBackground(appTheme)} p-6 shadow-2xl space-y-5 my-auto max-h-[90vh] flex flex-col`}>
                <div className="text-center space-y-2">
                  <h2 className={`text-xl font-black uppercase tracking-wider ${getPrimaryAccentColor(appTheme)}`}>
                    Welcome to RABBiT TV
                  </h2>
                  <p className="text-xs text-slate-300">
                    Please configure your preferences and enter your authorization passcode to begin streaming.
                  </p>
                </div>

                <div 
                  ref={handleModalScrollCheck}
                  onScroll={(e) => handleModalScrollCheck(e.currentTarget)}
                  className="space-y-4 overflow-y-auto max-h-[50vh] pr-2 scrollbar-thin"
                >
                  <form onSubmit={handleFirstTimeAuthorize} id="auth-form" className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">Your Name:</label>
                      <input
                        type="text"
                        maxLength={20}
                        value={profileNameInput}
                        onChange={(e) => setProfileNameInput(e.target.value)}
                        placeholder="Enter name (e.g. Rabbit)"
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">Your Age:</label>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={userAgeInput}
                        onChange={(e) => setUserAgeInput(e.target.value)}
                        placeholder="Enter age (e.g. 18)"
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none"
                      />
                      {ageErrorNotice && (
                        <p className="text-xs text-red-400 font-semibold">⚠️ Please enter a valid age before proceeding.</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">Authorization Passcode:</label>
                      <input
                        type="password"
                        maxLength={10}
                        value={passcodeInput}
                        onChange={(e) => setPasscodeInput(e.target.value)}
                        placeholder="Enter passcode"
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-center text-xs font-bold text-white focus:outline-none"
                      />
                      {passcodeError && (
                        <p className="text-xs text-red-400 font-semibold text-center">⚠️ Invalid Passcode. Please try again.</p>
                      )}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <span className="text-xs font-semibold text-slate-300 block">Select App Theme:</span>
                      <div className="grid grid-cols-2 gap-2">
                        {allThemesList.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleThemeChange(t.id)}
                            className={`rounded-xl px-3 py-2 text-xs font-bold text-left transition ${
                              appTheme === t.id ? `${getPrimaryBgColor(appTheme)} text-white shadow-md` : "bg-white/5 text-slate-300 hover:bg-white/10"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </form>
                </div>

                {canModalScrollDown && (
                  <div className="text-center text-[10px] uppercase font-bold text-violet-400 animate-pulse">
                    ↓ Scroll down for more options ↓
                  </div>
                )}

                <button
                  type="submit"
                  form="auth-form"
                  className={`w-full rounded-xl ${getPrimaryBgColor(appTheme)} py-3 text-xs font-black uppercase tracking-widest shadow-xl`}
                >
                  Authorize & Start Streaming
                </button>
              </div>
            </div>
          )}

          {/* FIXED VIEWPORT PROFILE DROPDOWN MENU */}
          {showProfileMenu && !showFirstStartModal && (
            <div className={`fixed top-16 right-3 sm:right-6 z-50 w-80 max-w-[92vw] rounded-2xl border ${getCardBackground(appTheme)} px-4 py-4 backdrop-blur-xl shadow-2xl max-h-[80vh] overflow-y-auto`}>
              <div className="mx-auto flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h3 className={`text-sm font-black uppercase tracking-wider ${getPrimaryAccentColor(appTheme)}`}>
                    👤 Personal Profile & Accessibility
                  </h3>
                  <button
                    type="button"
                    onClick={handleCloseAll}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5"
                  >
                    ✕ Close
                  </button>
                </div>

                <div className="space-y-3 bg-black/30 p-3.5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300 w-16 shrink-0">Name:</span>
                    <input
                      type="text"
                      maxLength={20}
                      value={profileNameInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProfileNameInput(val);
                        localStorage.setItem("rabtv_profile_name", val.trim());
                        setSavedProfileName(val.trim());
                      }}
                      placeholder="Your Name"
                      className="flex-1 rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-xs font-bold text-white focus:outline-none"
                    />
                  </div>

                  <form onSubmit={handleUpdateAgeInSettings} className="flex flex-col gap-2 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-300 w-16 shrink-0">Age:</span>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={userAgeInput}
                        onChange={(e) => setUserAgeInput(e.target.value)}
                        className="w-20 rounded-lg border border-white/10 bg-slate-800 px-2 py-1.5 text-center text-xs font-bold text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        maxLength={10}
                        placeholder="Passcode"
                        value={settingsAgeCodeInput}
                        onChange={(e) => setSettingsAgeCodeInput(e.target.value)}
                        className="flex-1 rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-center text-xs font-bold text-white focus:outline-none"
                      />
                      <button
                        type="submit"
                        className={`rounded-lg ${getPrimaryBgColor(appTheme)} px-4 py-1.5 text-xs font-bold whitespace-nowrap shadow`}
                      >
                        Update Age
                      </button>
                    </div>
                  </form>

                  {settingsAgeError && (
                    <span className="text-xs font-semibold text-red-400 text-center block">⚠️ Invalid Code or Age</span>
                  )}
                  {settingsAgeSuccess && (
                    <span className="text-xs font-semibold text-emerald-400 text-center block">✓ Profile Updated!</span>
                  )}
                </div>

                <div className="space-y-3 bg-black/30 p-3.5 rounded-xl border border-white/10">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Accessibility</span>

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-white">XL Mouse Pointer (3x)</p>
                      <p className="text-[10px] text-slate-400">Enlarges cursor for TVs/projectors.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMouseToggle(!helpfulMouse)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                        helpfulMouse ? `${getPrimaryBgColor(appTheme).split(" ")[0]} bg-opacity-100` : "bg-slate-700"
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${helpfulMouse ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-white">History Page Overscale</p>
                        <p className="text-[10px] text-slate-400">Choose card size increase on history page.</p>
                      </div>
                      <span className="text-xs font-bold text-violet-400">
                        {historyOverscale === "off" ? "Off" : `+${historyOverscale}`}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {(["off", "20%", "50%", "80%"] as HistoryScale[]).map((scale) => (
                        <button
                          key={scale}
                          type="button"
                          onClick={() => handleHistoryOverscaleChange(scale)}
                          className={`rounded-lg py-1.5 text-xs font-bold capitalize transition ${
                            historyOverscale === scale
                              ? `${getPrimaryBgColor(appTheme)} text-white shadow-md`
                              : `${getSubtlePillBg(appTheme)}`
                          }`}
                        >
                          {scale === "off" ? "Off" : `+${scale}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
                    <div>
                      <p className="text-xs font-bold text-white">Enlarged Action Buttons (+5%)</p>
                      <p className="text-[10px] text-slate-400">Makes eye, thumb, and X buttons bigger.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLargeButtonsToggle(!largeButtons)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                        largeButtons ? `${getPrimaryBgColor(appTheme).split(" ")[0]} bg-opacity-100` : "bg-slate-700"
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${largeButtons ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS MODAL / PANEL */}
          {showSettings && !showFirstStartModal && (
            <div className={`fixed top-16 right-3 sm:right-6 z-50 w-80 max-w-[92vw] rounded-2xl border ${getCardBackground(appTheme)} px-4 py-4 backdrop-blur-xl shadow-2xl max-h-[80vh] overflow-y-auto`}>
              <div className="mx-auto flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h3 className={`text-sm font-black uppercase tracking-wider ${getPrimaryAccentColor(appTheme)}`}>
                    ⚙️ Application Settings
                  </h3>
                  <button
                    type="button"
                    onClick={handleCloseAll}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5"
                  >
                    ✕ Close
                  </button>
                </div>

                <div className="space-y-3 bg-black/30 p-3.5 rounded-xl border border-white/10">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Theme Selection</span>
                  <div className="grid grid-cols-2 gap-2">
                    {allThemesList.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleThemeChange(t.id)}
                        className={`rounded-xl px-3 py-2 text-xs font-bold text-left transition ${
                          appTheme === t.id ? `${getPrimaryBgColor(appTheme)} text-white shadow-md` : "bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 bg-black/30 p-3.5 rounded-xl border border-white/10">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Card Size</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(["small", "medium", "large"] as CardSize[]).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleSizeChange(size)}
                        className={`rounded-xl py-2 text-xs font-bold capitalize transition ${
                          cardSize === size ? `${getPrimaryBgColor(appTheme)} text-white shadow-md` : `${getSubtlePillBg(appTheme)}`
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 bg-black/30 p-3.5 rounded-xl border border-white/10">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Backup & Restore</span>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleSaveBackup}
                      className={`w-full rounded-xl py-2 text-xs font-bold ${getPrimaryBgColor(appTheme)} text-white shadow`}
                    >
                      💾 Export Settings & List JSON
                    </button>
                    <label className={`w-full rounded-xl py-2 text-xs font-bold text-center cursor-pointer ${getSubtlePillBg(appTheme)} block`}>
                      📂 Import Backup JSON
                      <input type="file" accept=".json" onChange={handleRestoreBackup} className="hidden" />
                    </label>
                    {backupStatus && (
                      <span className="text-[11px] font-semibold text-emerald-400 text-center block">{backupStatus}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <Outlet />
          <Scripts />
        </AuthProvider>
      </body>
    </html>
  );
}
