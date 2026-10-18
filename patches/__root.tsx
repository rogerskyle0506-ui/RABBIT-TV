import { Outlet, createRootRoute, HeadContent, Link } from "@tanstack/react-router";
import { AuthProvider } from "@/components/auth-provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import "@/styles.css";
import { useState, useEffect } from "react";
import {
  CardSize,
  AppTheme,
  DISCLAIMER_ACCEPTED_KEY,
  getSavedCardSize,
  saveCardSize,
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
  const [activeSettingsTab, setActiveSettingsTab] = useState<"theme" | "scale" | "mouse">("theme");

  const [cardSize, setCardSize] = useState<CardSize>("large");
  const [appTheme, setAppTheme] = useState<AppTheme>("violet");
  const [helpfulMouse, setHelpfulMouseState] = useState(false);

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
    setAppTheme(getSavedTheme());
    setHelpfulMouseState(getHelpfulMouse());

    const handleSettingsUpdate = () => {
      setCardSize(getSavedCardSize());
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
      saveTheme(appTheme);
      setHelpfulMouse(helpfulMouse);
      setShowFirstStartModal(false);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
      setPasscodeInput("");
    }
  };

  const handleSizeChange = (newSize: CardSize) => {
    saveCardSize(newSize);
    setCardSize(newSize);
  };

  const handleThemeChange = (newTheme: AppTheme) => {
    saveTheme(newTheme);
    setAppTheme(newTheme);
  };

  const handleMouseToggle = (enabled: boolean) => {
    setHelpfulMouse(enabled);
    setHelpfulMouseState(enabled);
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
        return "bg-gradient-to-br from-red-950/80 via-zinc-900 to-neutral-950 border-red-500/30";
      case "midnight":
        return "bg-gradient-to-br from-blue-950/80 via-slate-900 to-sky-950/80 border-sky-500/30";
      case "emerald":
        return "bg-gradient-to-br from-emerald-950/80 via-slate-900 to-teal-950/80 border-emerald-500/30";
      case "amber":
        return "bg-gradient-to-br from-yellow-950/80 via-stone-900 to-amber-950/80 border-amber-500/30";
      case "cyan":
        return "bg-gradient-to-br from-cyan-950/80 via-slate-900 to-blue-950/80 border-cyan-500/30";
      case "violet":
      default:
        return "bg-gradient-to-br from-purple-950/80 via-slate-900 to-indigo-950/80 border-violet-500/30";
    }
  };

  const getPrimaryAccentColor = (theme: AppTheme) => {
    switch (theme) {
      case "red":
        return "text-red-400";
      case "midnight":
        return "text-sky-300";
      case "emerald":
        return "text-emerald-300";
      case "amber":
        return "text-amber-300";
      case "cyan":
        return "text-cyan-300";
      case "violet":
      default:
        return "text-violet-300";
    }
  };

  const getPrimaryBgColor = (theme: AppTheme) => {
    switch (theme) {
      case "red":
        return "bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 text-white shadow-lg shadow-red-600/30";
      case "midnight":
        return "bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 text-white shadow-lg shadow-blue-600/30";
      case "emerald":
        return "bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white shadow-lg shadow-emerald-600/30";
      case "amber":
        return "bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white shadow-lg shadow-amber-600/30";
      case "cyan":
        return "bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30";
      case "violet":
      default:
        return "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30";
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
          <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/95 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6">
              <div className="flex items-center gap-4 sm:gap-6">
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

                {!showFirstStartModal && (
                  <Link
                    to="/watch-history"
                    className="rounded-lg bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white border border-white/10 flex items-center gap-1.5"
                  >
                    <span>🕒</span> Watch History
                  </Link>
                )}
              </div>

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

            {showSettings && !showFirstStartModal && (
              <div className={`border-t border-white/10 ${getCardBackground(appTheme)} px-4 py-4 backdrop-blur-md shadow-2xl`}>
                <div className="mx-auto flex max-w-7xl flex-col items-center gap-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10 w-full justify-center">
                    <button
                      type="button"
                      onClick={() => setActiveSettingsTab("theme")}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                        activeSettingsTab === "theme"
                          ? `${getPrimaryBgColor(appTheme)}`
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
                          ? `${getPrimaryBgColor(appTheme)}`
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      Scale
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSettingsTab("mouse")}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                        activeSettingsTab === "mouse"
                          ? `${getPrimaryBgColor(appTheme)}`
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      XL Mouse
                    </button>
                  </div>

                  <div className="w-full flex justify-center py-1">
                    {activeSettingsTab === "theme" && (
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <span className="text-xs font-semibold text-slate-300 mr-2">Choose Theme:</span>
                        {[
                          { id: "violet", label: "🟣 Violet" },
                          { id: "red", label: "🔴 Red" },
                          { id: "midnight", label: "🔵 Midnight" },
                          { id: "emerald", label: "🟢 Emerald" },
                          { id: "amber", label: "🟠 Amber" },
                          { id: "cyan", label: "🩵 Cyan" },
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleThemeChange(t.id as AppTheme)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                              appTheme === t.id
                                ? `${getPrimaryBgColor(t.id as AppTheme)}`
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
                                ? `${getPrimaryBgColor(appTheme)}`
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
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

                <div className="space-y-2 border-t border-white/10 pt-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Select Startup Theme:
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { id: "violet", label: "🟣 Violet" },
                      { id: "red", label: "🔴 Red" },
                      { id: "midnight", label: "🔵 Midnight" },
                      { id: "emerald", label: "🟢 Emerald" },
                      { id: "amber", label: "🟠 Amber" },
                      { id: "cyan", label: "🩵 Cyan" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleThemeChange(t.id as AppTheme)}
                        className={`rounded-xl border py-2 text-xs font-bold transition focus:outline-none focus:ring-4 ${
                          appTheme === t.id
                            ? `border-white/30 ${getPrimaryBgColor(t.id as AppTheme)}`
                            : "border-white/10 bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
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
                        onClick={() => handleSizeChange(size)}
                        className={`rounded-xl border py-3 text-xs font-bold transition focus:outline-none focus:ring-4 ${
                          cardSize === size
                            ? `border-white/30 ${getPrimaryBgColor(appTheme)}`
                            : "border-white/10 bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {size === "small" ? "Small (25%)" : size === "medium" ? "Medium (60%)" : "Large (100%)"}
                      </button>
                    ))}
                  </div>
                </div>

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

                <div className="space-y-2 border-t border-white/10 pt-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Authorization Passcode
                  </label>
                  <input
                    type="password"
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    placeholder="Enter passcode..."
                    className="w-full rounded-xl border border-white/20 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                  {passcodeError && (
                    <p className="text-xs font-semibold text-red-400">
                      Invalid passcode. Please try again.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className={`w-full rounded-xl py-3 text-sm font-bold uppercase tracking-wider transition ${getPrimaryBgColor(appTheme)}`}
                >
                  Confirm & Enter
                </button>
              </form>
            </div>
          )}
        </AuthProvider>
      </body>
    </html>
  );
}
