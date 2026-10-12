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
} from "@/lib/settings";

const AUTHORIZATION_CODE = "34688643";

// Embedded logo asset (Guarantees rendering inside Android APKs/WebViews without file path errors)
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
  const [activeSettingsTab, setActiveSettingsTab] = useState<"theme" | "scale" | "quality" | "backup">("theme");

  const [cardSize, setCardSize] = useState<CardSize>("large");
  const [streamQuality, setStreamQuality] = useState<StreamQuality>("1080p");
  const [appTheme, setAppTheme] = useState<AppTheme>("violet");
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  useEffect(() => {
    const authorized = localStorage.getItem(DISCLAIMER_ACCEPTED_KEY);
    if (!authorized) {
      setShowFirstStartModal(true);
    }

    setCardSize(getSavedCardSize());
    setStreamQuality(getSavedStreamQuality());
    setAppTheme(getSavedTheme());
  }, []);

  const handleFirstTimeAuthorize = (e: React.FormEvent) => {
    e.preventDefault();

    if (passcodeInput.trim() === AUTHORIZATION_CODE) {
      localStorage.setItem(DISCLAIMER_ACCEPTED_KEY, "true");
      saveCardSize(cardSize);
      saveStreamQuality(streamQuality);
      saveTheme(appTheme);
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

  const handleSaveBackup = () => {
    const backupData = {
      cardSize,
      streamQuality,
      appTheme,
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

  const toggleSettingsSection = (section: "theme" | "scale" | "quality" | "backup") => {
    if (showSettings && activeSettingsTab === section) {
      setShowSettings(false);
    } else {
      setActiveSettingsTab(section);
      setShowSettings(true);
    }
  };

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen max-w-full overflow-x-hidden bg-[#050b16] text-slate-100 antialiased">
        <PreviewHostBridge />
        <AuthProvider>
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050b16]/95 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-3 py-2.5 sm:px-6">
              {/* Brand Logo */}
              <Link
                to="/"
                className="flex items-center gap-2 text-base sm:text-xl font-black tracking-wider text-white focus:outline-none shrink-0"
              >
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-900/80">
                  <img
                    src={RABBIT_LOGO_DATA_URL}
                    alt="RABBiT TV"
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="whitespace-nowrap">RABBiT TV</span>
              </Link>

              {/* Header Option Pills */}
              {!showFirstStartModal && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  <button
                    type="button"
                    onClick={() => toggleSettingsSection("theme")}
                    className={`rounded-xl border px-2.5 py-1 text-xs font-semibold transition shrink-0 ${
                      showSettings && activeSettingsTab === "theme"
                        ? "border-violet-500 bg-violet-600 text-white"
                        : "border-white/10 bg-slate-800 text-slate-200 hover:bg-slate-700"
                    }`}
                  >
                    🎨 Color Theme
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSettingsSection("scale")}
                    className={`rounded-xl border px-2.5 py-1 text-xs font-semibold transition shrink-0 ${
                      showSettings && activeSettingsTab === "scale"
                        ? "border-violet-500 bg-violet-600 text-white"
                        : "border-white/10 bg-slate-800 text-slate-200 hover:bg-slate-700"
                    }`}
                  >
                    📐 Poster Scale
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSettingsSection("quality")}
                    className={`rounded-xl border px-2.5 py-1 text-xs font-semibold transition shrink-0 ${
                      showSettings && activeSettingsTab === "quality"
                        ? "border-violet-500 bg-violet-600 text-white"
                        : "border-white/10 bg-slate-800 text-slate-200 hover:bg-slate-700"
                    }`}
                  >
                    ⚙️ Stream Quality
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSettingsSection("backup")}
                    className={`rounded-xl border px-2.5 py-1 text-xs font-semibold transition shrink-0 ${
                      showSettings && activeSettingsTab === "backup"
                        ? "border-violet-500 bg-violet-600 text-white"
                        : "border-white/10 bg-slate-800 text-slate-200 hover:bg-slate-700"
                    }`}
                  >
                    💾 Backup Profile
                  </button>
                </div>
              )}
            </div>

            {/* Dropdown Options */}
            {showSettings && !showFirstStartModal && (
              <div className="border-t border-white/10 bg-slate-900/95 px-4 py-3 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-center">
                  {activeSettingsTab === "theme" && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-300">Choose Theme:</span>
                      {[
                        { id: "violet", label: "🟣 Violet / Neon" },
                        { id: "red", label: "🔴 Red & Black" },
                        { id: "midnight", label: "🔵 Midnight & Black" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleThemeChange(t.id as AppTheme)}
                          className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                            appTheme === t.id
                              ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeSettingsTab === "scale" && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-300">Choose Scale:</span>
                      {(["small", "medium", "large"] as CardSize[]).map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handleSizeChange(size)}
                          className={`rounded-lg px-3 py-1 text-xs font-bold capitalize transition ${
                            cardSize === size
                              ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {size} {size === "small" ? "(25%)" : size === "medium" ? "(60%)" : "(100%)"}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeSettingsTab === "quality" && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-300">Choose Cap:</span>
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
                          className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                            streamQuality === item.key
                              ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeSettingsTab === "backup" && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveBackup}
                        className="rounded-lg bg-slate-800 border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                      >
                        💾 Export Backup File
                      </button>

                      <label className="cursor-pointer rounded-lg bg-slate-800 border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700">
                        🔄 Restore Profile File
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleRestoreBackup}
                          className="hidden"
                        />
                      </label>

                      {backupStatus && (
                        <span className="text-xs text-violet-400 font-semibold">
                          {backupStatus}
                        </span>
                      )}
                    </div>
                  )}
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
                className="my-auto w-full max-w-xl space-y-6 rounded-2xl border border-violet-500/30 bg-slate-900 p-6 text-white shadow-2xl md:p-8"
              >
                <div className="text-center space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-violet-500/40 bg-slate-900">
                    <img
                      src={RABBIT_LOGO_DATA_URL}
                      alt="RABBiT TV"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-violet-400">
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

                <div className="space-y-2 border-t border-white/10 pt-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Select Display Size (Adjustable anytime in settings):
                  </label>

                  <div className="grid grid-cols-3 gap-3">
                    {(["small", "medium", "large"] as CardSize[]).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setCardSize(size)}
                        className={`rounded-xl border py-3 text-xs font-bold transition focus:outline-none focus:ring-4 focus:ring-violet-400 ${
                          cardSize === size
                            ? "border-violet-400 bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                            : "border-white/10 bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {size === "small" ? "Small (25%)" : size === "medium" ? "Medium (60%)" : "Large (100%)"}
                      </button>
                    ))}
                  </div>
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
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-center text-lg font-bold tracking-widest text-white placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-violet-400"
                  />

                  {passcodeError && (
                    <p className="text-xs font-semibold text-red-400 text-center">
                      ⚠️ Invalid Authorization Code. Agreement Not Accepted.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-violet-600 py-4 text-base font-bold text-white shadow-lg shadow-violet-600/40 transition hover:bg-violet-500 active:scale-95 focus:outline-none focus:ring-4 focus:ring-violet-400"
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
