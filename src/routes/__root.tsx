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

  const [cardSize, setCardSize] = useState<CardSize>("large");
  const [streamQuality, setStreamQuality] = useState<StreamQuality>("1080p");
  const [appTheme, setAppTheme] = useState<AppTheme>("violet");

  useEffect(() => {
    const authorized = localStorage.getItem(DISCLAIMER_ACCEPTED_KEY);
    if (!authorized) {
      setShowFirstStartModal(true);
    }

    setCardSize(getSavedCardSize());
    setStreamQuality(getSavedStreamQuality());
    setAppTheme(getSavedTheme());

    const handleSettingsUpdate = () => {
      setCardSize(getSavedCardSize());
      setStreamQuality(getSavedStreamQuality());
      setAppTheme(getSavedTheme());
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
      setShowFirstStartModal(false);
      setPasscodeError(false);
      window.dispatchEvent(new Event("rabtv_settings_updated"));
    } else {
      setPasscodeError(true);
      setPasscodeInput("");
    }
  };

  // Dynamic theme background mapping for the entire app body
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
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 md:py-6 overflow-x-hidden">
            <Outlet />
          </main>

          {showFirstStartModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md overflow-y-auto">
              <form
                onSubmit={handleFirstTimeAuthorize}
                className="my-auto w-full max-w-xl space-y-6 rounded-2xl border border-white/10 bg-slate-900 p-6 text-white shadow-2xl md:p-8"
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
                    Select Display Size (Adjustable anytime in settings):
                  </label>

                  <div className="grid grid-cols-3 gap-3">
                    {(["small", "medium", "large"] as CardSize[]).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setCardSize(size)}
                        className={`rounded-xl border py-3 text-xs font-bold transition focus:outline-none focus:ring-4 ${
                          cardSize === size
                            ? `border-white/30 ${getPrimaryBgColor(appTheme)} text-white shadow-lg`
                            : "border-white/10 bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {size === "small" ? "Small (25%" : size === "medium" ? "Medium (60%)" : "Large (100%)"}
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
