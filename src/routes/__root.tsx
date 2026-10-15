import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { AuthProvider } from "@/components/auth-provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import "@/styles.css";
import { useState, useEffect } from "react";
import {
  CardSize,
  StreamQuality,
  AppTheme,
  DISCLAIMER_ACCEPTED_KEY,
  getSavedCardSize,
  saveCardSize,
  getSavedStreamQuality,
  saveStreamQuality,
  getSavedTheme,
  saveTheme,
  getHelpfulMouse,
  setHelpfulMouse,
} from "@/lib/settings";

const AUTHORIZATION_CODE = "34688643";

const RABBIT_LOGO_DATA_URL =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='25' fill='%236d28d9'/><text x='50%' y='55%' font-size='50' text-anchor='middle' dominant-baseline='middle'>🐇</text></svg>";

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
  const [showFirstStartModal, setShowFirstStartModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<"theme" | "scale" | "quality" | "mouse" | "backup">("theme");

  const [cardSize, setCardSize] = useState<CardSize>("large");
  const [streamQuality, setStreamQuality] = useState<StreamQuality>("1080p");
  const [appTheme, setAppTheme] = useState<AppTheme>("violet");
  const [helpfulMouse, setHelpfulMouseState] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  useEffect(() => {
    // Detect Fire OS / Silk WebView at runtime and tag root html element
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('silk') || ua.includes('firetv') || ua.includes('amazon')) {
        document.documentElement.classList.add('fire-os');
      }
    }

    const authorized = localStorage.getItem(DISCLAIMER_ACCEPTED_KEY);
    if (!authorized) {
      setShowFirstStartModal(true);
    }

    setCardSize(getSavedCardSize());
    setStreamQuality(getSavedStreamQuality());
    setAppTheme(getSavedTheme());
    setHelpfulMouseState(getHelpfulMouse());

    const handleSettingsUpdate = () => {
      setCardSize(getSavedCardSize());
      setStreamQuality(getSavedStreamQuality());
      setAppTheme(getSavedTheme());
      setHelpfulMouseState(getHelpfulMouse());
    };

    window.addEventListener("rabtv_settings_updated", handleSettingsUpdate);
    return () => {
      window.removeEventListener("rabtv_settings_updated", handleSettingsUpdate);
    };
  }, []);

  const handleFirstTimeAuthorize = (e: React.FormEvent) => {
    e.preventDefault();

    if (passcodeInput.trim() === AUTHORIZATION_CODE) {
      localStorage.setItem(DISCLAIMER_ACCEPTED_KEY, "true");
      saveCardSize(cardSize);
      saveStreamQuality(streamQuality);
      saveTheme(appTheme);
      setHelpfulMouse(helpfulMouse);
      setShowFirstStartModal(false);
      setPasscodeError(false);
      window.dispatchEvent(new Event("rabtv_settings_updated"));
    } else {
      setPasscodeError(true);
      setPasscodeInput("");
    }
  };

  const handleSizeChange = (newSize: CardSize) => {
    saveCardSize(newSize);
    setCardSize(newSize);
    window.dispatchEvent(new Event("rabtv_settings_updated"));
  };

  const handleQualityChange = (newQuality: StreamQuality) => {
    saveStreamQuality(newQuality);
    setStreamQuality(newQuality);
    window.dispatchEvent(new Event("rabtv_settings_updated"));
  };

  const handleThemeChange = (newTheme: AppTheme) => {
    saveTheme(newTheme);
    setAppTheme(newTheme);
    window.dispatchEvent(new Event("rabtv_settings_updated"));
  };

  const handleMouseToggle = (enabled: boolean) => {
    setHelpfulMouse(enabled);
    setHelpfulMouseState(enabled);
  };

  const handleSaveBackup = () => {
    const backupData = {
      cardSize,
      streamQuality,
      appTheme,
      helpfulMouse,
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
        if (data.appTheme) saveTheme(data.appTheme);
        if (typeof data.helpfulMouse === "boolean") setHelpfulMouse(data.helpfulMouse);
        if (data.myList) localStorage.setItem("rabtv_my_list", data.myList);
        if (data.favorites) localStorage.setItem("rabtv_favorites", data.favorites);

        localStorage.removeItem(DISCLAIMER_ACCEPTED_KEY);
        setShowFirstStartModal(true);
        setShowSettings(false);
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
        return "bg-[#120202]";
      case "midnight":
        return "bg-[#020617]";
      case "violet":
      default:
        return "bg-[#050b16]";
    }
  };

  const getCardBackground = (theme: AppTheme) => {
    switch (theme) {
      case "red":
        return "bg-[#160404] border-red-500/20";
      case "midnight":
        return "bg-[#03091e] border-blue-500/20";
      case "violet":
      default:
        return "bg-[#090e1f] border-violet-500/20";
    }
  };

  const getPrimaryAccentColor = (theme: AppTheme) => {
    switch (theme) {
      case "red":
        return "text-red-400";
      case "midnight":
        return "text-blue-400";
      case "violet":
      default:
        return "text-violet-400";
    }
  };

  const getPrimaryBgColor = (theme: AppTheme) => {
    switch (theme) {
      case "red":
        return "bg-red-600 hover:bg-red-500 shadow-red-600/40";
      case "midnight":
        return "bg-blue-600 hover:bg-blue-500 shadow-blue-600/40";
      case "violet":
      default:
        return "bg-violet-600 hover:bg-violet-500 shadow-violet-600/40";
    }
  };

  return (
    <html lang="en" data-theme={appTheme}>
      <head>
        <HeadContent />
        {/* 3x Scaled High-Visibility Cursor when Helpful Mouse / XL Mouse is enabled */}
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
          <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/95 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6">
              {/* Brand Logo */}
              <Link
                to="/"
                className="flex items-center gap-2 text-base sm:text-xl font-black tracking-wider text-white focus:outline-none shrink-0"
              >
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-900/80 shrink-0">
                  <img
                    src={RABBIT_LOGO_DATA_URL}
                    alt="RABBiT TV"
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="whitespace-nowrap">RABBiT TV</span>
              </Link>

              {/* Single Gear Settings Icon Button */}
              {!showFirstStartModal && (
                <button
                  type="button"
                  onClick={() => setShowSettings((prev) => !prev)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-800 text-white text-lg transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  aria-label="Settings"
                >
                  ⚙️
                </button>
              )}
            </div>

            {/* Popout Settings Menu */}
            {showSettings && !showFirstStartModal && (
              <div className={`border-t border-white/10 ${getCardBackground(appTheme)} px-4 py-4 backdrop-blur-md shadow-2xl`}>
                <div className="mx-auto flex max-w-7xl flex-col items-center gap-3">
                  {/* Settings Sub-tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10 w-full justify-center">
                    <button
                      type="button"
                      onClick={() => setActiveSettingsTab("theme")}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                        activeSettingsTab === "theme"
                          ? `${getPrimaryBgColor(appTheme)} text-white shadow-md`
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      Theme
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSettingsTab("scale")}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                        activeSettingsTab === "scale"
                          ? `${getPrimaryBgColor(appTheme)} text-white shadow-md`
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      Scale
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSettingsTab("quality")}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                        activeSettingsTab === "quality"
                          ? `${getPrimaryBgColor(appTheme)} text-white shadow-md`
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      Quality
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSettingsTab("mouse")}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                        activeSettingsTab === "mouse"
                          ? `${getPrimaryBgColor(appTheme)} text-white shadow-md`
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      XL Mouse
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSettingsTab("backup")}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                        activeSettingsTab === "backup"
                          ? `${getPrimaryBgColor(appTheme)} text-white shadow-md`
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      Backup
                    </button>
                  </div>

                  {/* Active Tab Content Panel */}
                  <div className="w-full flex justify-center py-1">
                    {activeSettingsTab === "theme" && (
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <span className="text-xs font-semibold text-slate-300 mr-2">Choose Theme:</span>
                        {[
                          { id: "violet", label: "🟣 Violet / Neon" },
                          { id: "red", label: "🔴 Red & Black" },
                          { id: "midnight", label: "🔵 Midnight & Black" },
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleThemeChange(t.id as AppTheme)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                              appTheme === t.id
                                ? `${getPrimaryBgColor(t.id as AppTheme)} text-white shadow-md`
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {activeSettingsTab === "scale" && (
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <span className="text-xs font-semibold text-slate-300 mr-2">Choose Scale:</span>
                        {(["small", "medium", "large"] as CardSize[]).map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => handleSizeChange(size)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition ${
                              cardSize === size
                                ? `${getPrimaryBgColor(appTheme)} text-white shadow-md`
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            {size} {size === "small" ? "(25%)" : size === "medium" ? "(60%)" : "(100%)"}
                          </button>
                        ))}
                      </div>
                    )}

                    {activeSettingsTab === "quality" && (
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <span className="text-xs font-semibold text-slate-300 mr-2">Choose Cap:</span>
                        {[
                          { key: "1080p", label: "FHD (1080p)" },
                          { key: "720p", label: "HD (720p)" },
                          { key: "480p", label: "SD (480p)" },
                          { key: "auto", label: "Auto Bandwidth" },
                        ].map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => handleQualityChange(item.key as StreamQuality)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                              streamQuality === item.key
                                ? `${getPrimaryBgColor(appTheme)} text-white shadow-md`
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {activeSettingsTab === "mouse" && (
                      <div className="flex items-center justify-center gap-4 py-1">
                        <div className="text-left">
                          <p className="text-xs font-bold text-white">XL Mouse Pointer (3x Scaled)</p>
                          <p className="text-[10px] text-slate-400">Enlarges the cursor for improved visibility on TVs and projectors.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleMouseToggle(!helpfulMouse)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            helpfulMouse ? getPrimaryBgColor(appTheme).split(" ")[0] : "bg-slate-700"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              helpfulMouse ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    )}

                    {activeSettingsTab === "backup" && (
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={handleSaveBackup}
                          className="rounded-lg bg-slate-800 border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                        >
                          💾 Export Backup File
                        </button>

                        <label className="cursor-pointer rounded-lg bg-slate-800 border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700">
                          🔄 Restore Profile File
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleRestoreBackup}
                            className="hidden"
                          />
                        </label>

                        {backupStatus && (
                          <span className={`text-xs ${getPrimaryAccentColor(appTheme)} font-semibold ml-2`}>
                            {backupStatus}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </header>

          <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 md:py-6 overflow-x-hidden">
            <Outlet />
          </main>

          {showFirstStartModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md overflow-y-auto">
              <form
                onSubmit={handleFirstTimeAuthorize}
                className={`my-auto w-full max-w-xl space-y-6 rounded-2xl border p-6 text-white shadow-2xl md:p-8 ${getCardBackground(appTheme)}`}
              >
                <div className="text-center space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-slate-900">
                    <img
                      src={RABBIT_LOGO_DATA_URL}
                      alt="RABBiT TV"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <h2 className={`text-2xl font-bold ${getPrimaryAccentColor(appTheme)}`}>
                    Welcome to RABBiT TV
                  </h2>
                </div>

                <div className="space-y-4 text-sm leading-relaxed text-slate-300">
                  <p>
                    This app has been shared by <strong>Rabbit</strong> as a friendly gesture. By entering the personal agreement code below, you confirm strict authorization and agree not to share or distribute this app without consent.
                  </p>
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
                    <strong>⚠️ Device Monitoring Notice:</strong> Unique device IDs running this application are logged for authorization tracking. Unauthorized installations or unapproved sharing can be detected immediately.
                  </div>
                </div>

                {/* Theme Selector on Splash Screen */}
                <div className="space-y-2 border-t border-white/10 pt-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Select Startup Theme:
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "violet", label: "🟣 Violet" },
                      { id: "red", label: "🔴 Red" },
                      { id: "midnight", label: "🔵 Midnight" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setAppTheme(t.id as AppTheme)}
                        className={`rounded-xl border py-3 text-xs font-bold transition focus:outline-none focus:ring-4 ${
                          appTheme === t.id
                            ? `border-white/30 ${getPrimaryBgColor(t.id as AppTheme)} text-white shadow-lg`
                            : "border-white/10 bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Display Size Selector on Splash Screen */}
                <div className="space-y-2 border-t border-white/10 pt-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Select Display Size (Adjustable anytime in settings):
                  </label>

                  <div className="grid grid-cols-3 gap-3">
                    {(["small", "medium", "large"] as CardSize[]).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleSizeChange(size)}
                        className={`rounded-xl border py-3 text-xs font-bold transition focus:outline-none focus:ring-4 ${
                          cardSize === size
                            ? `border-white/30 ${getPrimaryBgColor(appTheme)} text-white shadow-lg`
                            : "border-white/10 bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {size === "small" ? "Small (25%)" : size === "medium" ? "Medium (60%)" : "Large (100%)"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* XL Mouse Toggle on Splash Screen */}
                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      XL Mouse Pointer
                    </label>
                    <p className="text-[11px] text-slate-400">Enlarges cursor 3x for easy projector/TV navigation.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMouseToggle(!helpfulMouse)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      helpfulMouse ? getPrimaryBgColor(appTheme).split(" ")[0] : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        helpfulMouse ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-2 border-t border-white/10 pt-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Enter Personal Agreement Code:
                  </label>
                  <input
                    type="password"
                    maxLength={10}
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    placeholder="Enter Code"
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-center text-lg font-bold tracking-widest text-white placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-500"
                  />

                  {passcodeError && (
                    <p className="text-xs font-semibold text-red-400 text-center">
                      ⚠️ Invalid Authorization Code. Agreement Not Accepted.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className={`w-full rounded-xl ${getPrimaryBgColor(appTheme)} py-4 text-base font-bold text-white shadow-lg transition active:scale-95 focus:outline-none focus:ring-4`}
                >
                  Accept Agreement & Launch App
                </button>
              </form>
            </div>
          )}
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
