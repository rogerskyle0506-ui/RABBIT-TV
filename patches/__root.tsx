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
  getSavedUserAge,
  saveUserAge,
} from "@/lib/settings";

const AUTHORIZATION_CODE = "34688643";

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
  const [ageErrorNotice, setAgeErrorNotice] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<"theme" | "scale" | "mouse" | "age" | "backup">("theme");

  const [cardSize, setCardSize] = useState<CardSize>("large");
  const [streamQuality, setStreamQuality] = useState<StreamQuality>("1080p");
  const [appTheme, setAppTheme] = useState<AppTheme>("violet");
  const [helpfulMouse, setHelpfulMouseState] = useState(false);
  const [userAgeInput, setUserAgeInput] = useState<string>("");
  const [settingsAgeCodeInput, setSettingsAgeCodeInput] = useState<string>("");
  const [settingsAgeError, setSettingsAgeError] = useState<boolean>(false);
  const [settingsAgeSuccess, setSettingsAgeSuccess] = useState<boolean>(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  useEffect(() => {
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
    
    const existingAge = localStorage.getItem("rabtv_user_age");
    if (existingAge) {
      setUserAgeInput(existingAge);
    }

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
    window.dispatchEvent(new Event("rabtv_settings_updated"));
  };

  const handleMouseToggle = (enabled: boolean) => {
    setHelpfulMouse(enabled);
    setHelpfulMouseState(enabled);
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
      userAge: getSavedUserAge(),
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
        if (data.userAge) saveUserAge(data.userAge);
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
        return "bg-zinc-900/90 border-red-500/20";
      case "midnight":
        return "bg-slate-900/90 border-blue-500/20";
      case "emerald":
        return "bg-slate-900/90 border-emerald-500/20";
      case "amber":
        return "bg-stone-900/90 border-amber-500/20";
      case "cyan":
        return "bg-slate-900/90 border-cyan-500/20";
      case "violet":
      default:
        return "bg-slate-900/90 border-violet-500/20";
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
            <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6">
              <Link
                to="/"
                className="flex items-center gap-2.5 text-base sm:text-xl font-black tracking-wider text-white focus:outline-none shrink-0 group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-950 via-red-900 to-black border border-red-500/30 shadow-lg text-lg transition-transform group-hover:scale-105 shrink-0">
                  🐰
                </div>
                <span className="whitespace-nowrap">RABBiT TV</span>
              </Link>

              {!showFirstStartModal && (
                <div className="flex items-center gap-2">
                  <Link
                    to="/watch-history"
                    className={`flex h-10 items-center justify-center rounded-xl border px-3 text-xs font-bold shadow-md transition focus:outline-none focus:ring-2 ${activeHeader.btnBg}`}
                  >
                    🕒 Watch History
                  </Link>

                  <button
                    type="button"
                    onClick={() => setShowSettings((prev) => !prev)}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg shadow-md transition focus:outline-none focus:ring-2 ${activeHeader.btnBg}`}
                    aria-label="Settings"
                  >
                    ⚙️
                  </button>
                </div>
              )}
            </div>

            {showSettings && !showFirstStartModal && (
              <div className={`border-t border-white/10 ${getCardBackground(appTheme)} px-4 py-4 backdrop-blur-md shadow-2xl`}>
                <div className="mx-auto flex max-w-7xl flex-col items-center gap-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10 w-full justify-center">
                    <button
                      type="button"
                      onClick={() => setActiveSettingsTab("theme")}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                        activeSettingsTab === "theme"
                          ? `${getPrimaryBgColor(appTheme)} text-white shadow-md`
                          : `${getSubtlePillBg(appTheme)}`
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
                          : `${getSubtlePillBg(appTheme)}`
                      }`}
                    >
                      Scale
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSettingsTab("mouse")}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                        activeSettingsTab === "mouse"
                          ? `${getPrimaryBgColor(appTheme)} text-white shadow-md`
                          : `${getSubtlePillBg(appTheme)}`
                      }`}
                    >
                      XL Mouse
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSettingsTab("age")}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                        activeSettingsTab === "age"
                          ? `${getPrimaryBgColor(appTheme)} text-white shadow-md`
                          : `${getSubtlePillBg(appTheme)}`
                      }`}
                    >
                      Profile Age
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSettingsTab("backup")}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                        activeSettingsTab === "backup"
                          ? `${getPrimaryBgColor(appTheme)} text-white shadow-md`
                          : `${getSubtlePillBg(appTheme)}`
                      }`}
                    >
                      Backup
                    </button>
                  </div>

                  <div className="w-full flex justify-center py-1">
                    {activeSettingsTab === "theme" && (
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <span className="text-xs font-semibold text-slate-300 mr-2">Choose Theme:</span>
                        {allThemesList.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleThemeChange(t.id)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                              appTheme === t.id
                                ? `${getPrimaryBgColor(t.id)} text-white shadow-md`
                                : `${getSubtlePillBg(appTheme)}`
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
                                : `${getSubtlePillBg(appTheme)}`
                            }`}
                          >
                            {size} {size === "small" ? "(25%)" : size === "medium" ? "(60%)" : "(100%)"}
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
                            helpfulMouse ? `${getPrimaryBgColor(appTheme).split(" ")[0]} bg-opacity-100` : "bg-slate-700"
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

                    {activeSettingsTab === "age" && (
                      <form onSubmit={handleUpdateAgeInSettings} className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-lg w-full">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <span className="text-xs font-semibold text-slate-300 shrink-0">Age:</span>
                          <input
                            type="number"
                            min={1}
                            max={120}
                            value={userAgeInput}
                            onChange={(e) => setUserAgeInput(e.target.value)}
                            className="w-16 rounded-lg border border-white/10 bg-slate-800 px-2 py-1 text-center text-xs font-bold text-white focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <input
                            type="password"
                            maxLength={10}
                            placeholder="Passcode Required"
                            value={settingsAgeCodeInput}
                            onChange={(e) => setSettingsAgeCodeInput(e.target.value)}
                            className="w-36 rounded-lg border border-white/10 bg-slate-800 px-3 py-1 text-center text-xs font-bold text-white focus:outline-none"
                          />
                          <button
                            type="submit"
                            className={`rounded-lg ${getPrimaryBgColor(appTheme)} px-3 py-1 text-xs font-bold whitespace-nowrap shadow`}
                          >
                            Update
                          </button>
                        </div>

                        {settingsAgeError && (
                          <span className="text-xs font-semibold text-red-400">⚠️ Invalid Code or Age</span>
                        )}
                        {settingsAgeSuccess && (
                          <span className="text-xs font-semibold text-emerald-400">✓ Age Updated!</span>
                        )}
                      </form>
                    )}

                    {activeSettingsTab === "backup" && (
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={handleSaveBackup}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${getSubtlePillBg(appTheme)}`}
                        >
                          💾 Export Backup File
                        </button>

                        <label className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${getSubtlePillBg(appTheme)}`}>
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

          {/* Startup Modal with Age Validation Check */}
          {showFirstStartModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md overflow-y-auto">
              <form
                onSubmit={handleFirstTimeAuthorize}
                className={`my-auto w-full max-w-xl space-y-5 rounded-2xl border p-6 text-white shadow-2xl md:p-8 ${getCardBackground(appTheme)}`}
              >
                <div className="text-center space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-red-950 via-red-900 to-black border border-red-500/30 text-xl shadow-lg">
                    🐰
                  </div>
                  <h2 className={`text-2xl font-bold ${getPrimaryAccentColor(appTheme)}`}>
                    Welcome to RABBiT TV
                  </h2>
                </div>

                <div className="space-y-3 text-sm leading-relaxed text-slate-300">
                  <p>
                    This app has been shared by <strong>Rabbit</strong> as a friendly gesture. By entering the personal agreement code below, you confirm strict authorization and agree not to share or distribute this app without consent.
                  </p>
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                    <strong>⚠️ Device Monitoring Notice:</strong> Unique device IDs running this application are logged for authorization tracking.
                  </div>
                </div>

                {/* Friendly Age Prompt (Blank by Default) */}
                <div className="space-y-2 border-t border-white/10 pt-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    How old are you? <span className="text-slate-400 font-normal lowercase">(So we can streamline your experience!)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={userAgeInput}
                    onChange={(e) => setUserAgeInput(e.target.value)}
                    placeholder="Enter Age"
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-center text-base font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-500"
                  />
                  {ageErrorNotice && (
                    <p className="text-xs font-semibold text-red-400 text-center">
                      ⚠️ Age was not entered! Please enter your age and passcode to proceed.
                    </p>
                  )}
                </div>

                <div className="space-y-2 border-t border-white/10 pt-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Select Startup Theme:
                  </label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {allThemesList.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleThemeChange(t.id)}
                        className={`rounded-xl border py-2.5 text-xs font-bold transition focus:outline-none focus:ring-4 ${
                          appTheme === t.id
                            ? `border-white/30 ${getPrimaryBgColor(t.id)} text-white shadow-lg`
                            : "border-white/10 bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 border-t border-white/10 pt-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Select Display Size (Adjustable anytime in settings):
                  </label>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {(["small", "medium", "large"] as CardSize[]).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleSizeChange(size)}
                        className={`rounded-xl border py-2.5 text-xs font-bold transition focus:outline-none focus:ring-4 ${
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

                <div className="flex items-center justify-between border-t border-white/10 pt-3">
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
                      helpfulMouse ? "bg-violet-600" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        helpfulMouse ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-2 border-t border-white/10 pt-3">
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
                  className={`w-full rounded-xl ${getPrimaryBgColor(appTheme)} py-3.5 text-base font-bold text-white shadow-lg transition active:scale-95 focus:outline-none focus:ring-4`}
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
