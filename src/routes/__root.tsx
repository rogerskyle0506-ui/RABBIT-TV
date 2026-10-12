import { createRootRoute, Outlet, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";

const RABBIT_LOGO_BASE64 =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTEgM2ExIDEgMCAwMSAxIDF2NWExIDEgMCAwMS0xIDFIM2ExIDEgMCAwMS0xLTFWNGExIDEgMCAwMTEtMWg4eiIvPjxwYXRoIGQ9Ik0yMSAzYTEgMSAwIDAxMSAxdjVhMSAxIDAgMDEtMSAxaC04YTEgMSAwIDAxLTEtMVY0YTEgMSAwIDAxMS0xaDh6Ii8+PHBhdGggZD0iTTExIDEzYTEgMSAwIDAxMSAxdjVhMSAxIDAgMDEtMSAxSDNhMSAxIDAgMDEtMS0xdi01YTEgMSAwIDAxMS0xaDh6Ii8+PHBhdGggZD0iTTIxIDEzYTEgMSAwIDAxMSAxdjVhMSAxIDAgMDEtMSAxaC04YTEgMSAwIDAxLTEtMXYtNWExIDEgMCAwMTEtMWg4eiIvPjwvc3ZnPg==";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const [showSettings, setShowSettings] = useState(false);
  const [activeTheme, setActiveTheme] = useState("dark");

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("rabtv_theme") || "dark";
        setActiveTheme(saved);
        document.documentElement.setAttribute("data-theme", saved);
      }
    } catch (err) {
      console.error("Error reading theme", err);
    }
  }, []);

  const handleThemeSelect = (themeName: string) => {
    setActiveTheme(themeName);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("rabtv_theme", themeName);
        document.documentElement.setAttribute("data-theme", themeName);
      }
    } catch (err) {
      console.error("Error saving theme", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#050b16] text-white selection:bg-violet-500/30">
      {/* Sticky Global Top Navigation Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#050b16]/90 px-4 py-3 backdrop-blur-md md:px-8">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:rounded-lg">
            <img
              src={RABBIT_LOGO_BASE64}
              alt="Rabbit TV"
              className="h-8 w-8 text-violet-400"
            />
            <span className="text-xl font-black tracking-wider text-violet-400">
              RABBIT TV
            </span>
          </Link>

          {/* Navigation Category Pills */}
          <nav className="ml-6 hidden items-center gap-2 md:flex">
            <Link
              to="/"
              className="rounded-xl px-3 py-1.5 text-xs font-bold transition hover:bg-white/10 [&.active]:bg-violet-600 [&.active]:text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              Home
            </Link>
          </nav>
        </div>

        {/* Right Side Settings Trigger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-xl border border-white/10 bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            ⚙ Settings
          </button>
        </div>
      </header>

      {/* Settings Modal Overlay */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg font-bold text-white">App Settings</h2>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-400">
                  Color Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleThemeSelect("dark")}
                    className={`rounded-xl px-3 py-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-violet-400 ${
                      activeTheme === "dark"
                        ? "bg-violet-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => handleThemeSelect("purple")}
                    className={`rounded-xl px-3 py-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-violet-400 ${
                      activeTheme === "purple"
                        ? "bg-violet-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    Purple
                  </button>
                  <button
                    type="button"
                    onClick={() => handleThemeSelect("cinema")}
                    className={`rounded-xl px-3 py-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-violet-400 ${
                      activeTheme === "cinema"
                        ? "bg-violet-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    Cinema
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-lg transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
