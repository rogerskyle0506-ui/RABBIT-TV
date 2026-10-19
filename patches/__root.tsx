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

// Your custom icon embedded directly as a Base64 data URL
const BRAND_LOGO_DATA_URL =
  "data:image/png;base64,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aW1fZ2VuZXJhdG9yX2luZm+iZG5hbWV4Ikdvb2dsZSBDMlBBIENvcmUgR2VuZXJhdG9yIExpYnJhcnlndmVyc2lvbnM5OTYyMDU4Njc6OTk2MjA1ODY3cmNyZWF0ZWRfYXNzZXJ0aW9uc4KiY3VybHgqc2VsZiNqdW1iZj1jMnBhLmFzc2VydGlvbnMvYzJwYS5hY3Rpb25zLnYyZGhhc2hYILRTtiim83ZGQQsoQD0fNRJTvZea70r60JHkD8uaxj4gomN1cmx4KXNlbGYjanVtYmY9YzJwYS5hc3NlcnRpb25zL2MycGEuaGFzaC5kYXRhZGhhc2hYIHPiCMU3cTyzVCz6w+zqK2iyT5sAf7qbmlm4SriuZsY2aXNpZ25hdHVyZXgZc2VsZiNqdW1iZj1jMnBhLnNpZ25hdHVyZWNhbGdmc2hhMjU2AAACgWp1bWIAAAApanVtZGMyYXMAEQAQgAAAqgA4m3EDYzJwYS5hc3NlcnRpb25zAAAAALRqdW1iAAAAQGp1bWRjYm9yABEAEIAAAKoAOJtxE2MycGEuaGFzaC5kYXRhAAAAABhjMnNoCZQ4hvwVrSLqH+hjdT0CcwAAAGxjYm9ypGpleGNsdXNpb25zgaJlc3RhcnQUZmxlbmd0aBkXuWNhbGdmc2hhMjU2ZGhhc2hYINhUQSVZoIjmUBkDOCYquMDWtiEgySwyIUcyljgWMj1kY3BhZE4AAAAAAAAAAAAAAAAAAAAAAZxqdW1iAAAAQWp1bWRjYm9yABEAEIAAAKoAOJtxE2MycGEuYWN0aW9ucy52MgAAAAAYYzJzaBTRtkrH3wgtnIJbVqDjOYoAAAFTY2JvcqFnYWN0aW9uc4KjZmFjdGlvbmxjMnBhLmNyZWF0ZWRrZGVzY3JpcHRpb254IENyZWF0ZWQgYnkgR29vZ2xlIEdlbmVyYXRpdmUgQUkucWRpZ2l0YWxTb3VyY2VUeXBleEZodHRwOi8vY3YuaXB0Yy5vcmcvbmV3c2NvZGVzL2RpZ2l0YWxzb3VyY2V0eXBlL3RyYWluZWRBbGdvcml0aG1pY01lZGlho2ZhY3Rpb25rYzJwYS5lZGl0ZWRrZGVzY3JpcHRpb254KEFwcGxpZWQgaW1wZXJjZXB0aWJsZSBTeW50aElEIHdhdGVybWFyay5xZGlnaXRhbFNvdXJjZVR5cGV4Rmh0dHA6Ly9jdi5pcHRjLm9yZy9uZXdzY29kZXMvZGlnaXRhbHNvdXJjZXR5cGUvdHJhaW5lZEFsZ29yaXRobWljTWVkaWEAAB4zanVtYgAAAEdqdW1kYzJtYQARABCAAACqADibcQN1cm46YzJwYToxMDIyYTU2OC1jYWI1LTUyYjctMmM4OC00Yzk1ODc4ZTMyMDIAAAAS/2p1bWIAAAAoanVtZGMyY3MAEQAQgAAAqgA4m3EDYzJwYS5zaWduYXR1cmUAAAASz2Nib3LShFkGKKIBJhghglkDPDCCAzgwggK/oAMCAQICEx8xsI0jAqQCOSpb2Yip63Ul4oIwCgYIKoZIzj0EAwMwUTELMAkGA1UEBhMCVVMxEzARBgNVBAoMCkdvb2dsZSBMTEMxLTArBgNVBAMMJEdvb2dsZSBDMlBBIE1lZGlhIFNlcnZpY2VzIDFQIElDQSBHMzAeFw0yNjA3MjcyMTA1MjhaFw0yNzA3MjIyMTA1MjdaMGsxCzAJBgNVBAYTAlVTMRMwEQYDVQQKEwpHb29nbGUgTExDMRwwGgYDVQQLExNHb29nbGUgU3lzdGVtIDkwMjkxMSkwJwYDVQQDEyBHb29nbGUgTWVkaWEgUHJvY2Vzc2luZyBTZXJ2aWNlczBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABEJlut2eD5gouD3lY28WPFJAiZ9BCYwbvVITA4bST3HcadCdj8/mQPZt9BDF0VAoAAYN0BtHkTdMzythjSmNCT6jggFaMIIBVjAOBgNVHQ8BAf8EBAMCBsAwHwYDVR0lBBgwFgYIKwYBBQUHAwQGCisGAQQBg+heAgEwDAYDVR0TAQH/BAIwADAdBgNVHQ4EFgQUGnl+XWgexiAXlVoJAmLbJNmnylYwHwYDVR0jBBgwFoAU2nvhvbQsioXgENZrmsdK8frf9jcwbAYIKwYBBQUHAQEEYDBeMCYGCCsGAQUFBzABhhpodHRwOi8vYzJwYS1vY3NwLnBraS5nb29nLzA0BggrBgEFBQcwAoYoaHR0cDovL3BraS5nb29nL2MycGEvbWVkaWEtMXAtaWNhLWczLmNydDAXBgNVHSAEEDAOMAwGCisGAQQBg+heAQEwGQYJKwYBBAGD6F4DBAwGCisGAQQBg+heAwowMwYJKwYBBAGD6F4EBCYMJDAxOWY3MjIyLTQ2N2EtNzk5MS04ODVlLWQxNWQyNDAxZjc5YTAKBggqhkjOPQQDAwNnADBkAjBrrGilfh/a8cE0CJquvTOMSZKIyr0Gux9Pgp2pO23jJqu3iYFJ8hGs151AzvEPk3gCMFsvdxcYodoj0rgDxy/8TQxTNATznVcxUeV+47IxMhyMFj5mFOro+6fcO5D77eOhe1kC4DCCAtwwggJjoAMCAQICFEH6pSFHdiFY2n+bLP+N/RYJHu4+MAoGCCqGSM49BAMDMEMxCzAJBgNVBAYTAlVTMRMwEQYDVQQKDApHb29nbGUgTExDMR8wHQYDVQQDDBZHb29nbGUgQzJQQSBSb290IENBIEczMB4XDTI1MDUwODIyMzYyNloXDTMwMDUwODIyMzYyNlowUTELMAkGA1UEBhMCVVMxEzARBgNVBAoMCkdvb2dsZSBMTEMxLTArBgNVBAMMJEdvb2dsZSBDMlBBIE1lZGlhIFNlcnZpY2VzIDFQIElDQSBHMzB2MBAGByqGSM49AgEGBSuBBAAiA2IABLgj5VMUopbapwdpcdhEuxSvk1WVpgMUc8w408ymfLpqKsrwqkizpGQazonmi6q6fq587dBAA1lh91+tjasxF0XsFuq2/5Uu1V5FQjNNoAtGYCVu/jwrGYC6FAVEPp5DeaOCAQgwggEEMBcGA1UdIAQQMA4wDAYKKwYBBAGD6F4BATAOBgNVHQ8BAf8EBAMCAQYwHwYDVR0lBBgwFgYIKwYBBQUHAwQGCisGAQQBg+heAgEwEgYDVR0TAQH/BAgwBgEB";

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
        return {
          logoBg: "bg-gradient-to-br from-red-600 to-rose-800 shadow-red-600/40",
          btnBg: "bg-red-950/70 border-red-500/30 text-red-200 hover:bg-red-900/80",
        };
      case "midnight":
        return {
          logoBg: "bg-gradient-to-br from-blue-600 to-sky-800 shadow-blue-600/40",
          btnBg: "bg-blue-950/70 border-blue-500/30 text-blue-200 hover:bg-blue-900/80",
        };
      case "emerald":
        return {
          logoBg: "bg-gradient-to-br from-emerald-600 to-teal-800 shadow-emerald-600/40",
          btnBg: "bg-emerald-950/70 border-emerald-500/30 text-emerald-200 hover:bg-emerald-900/80",
        };
      case "amber":
        return {
          logoBg: "bg-gradient-to-br from-amber-500 to-yellow-700 shadow-amber-600/40",
          btnBg: "bg-yellow-950/70 border-amber-500/30 text-amber-200 hover:bg-yellow-900/80",
        };
      case "cyan":
        return {
          logoBg: "bg-gradient-to-br from-cyan-600 to-blue-800 shadow-cyan-600/40",
          btnBg: "bg-cyan-950/70 border-cyan-500/30 text-cyan-200 hover:bg-cyan-900/80",
        };
      case "violet":
      default:
        return {
          logoBg: "bg-gradient-to-br from-violet-600 to-purple-800 shadow-violet-600/40",
          btnBg: "bg-purple-950/70 border-violet-500/30 text-purple-200 hover:bg-purple-900/80",
        };
    }
  };

  const activeHeader = getThemeHeaderStyles(appTheme);

  const getPrimaryAccentColor = (theme: AppTheme) => {
    switch (theme) {
      case "red":
        return "text-red-400";
      case "midnight":
        return "text-blue-400";
      case "emerald":
        return "text-emerald-300";
      case "amber":
        return "text-amber-300";
      case "cyan":
        return "text-cyan-300";
      case "violet":
      default:
        return "text-violet-400";
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
              {/* Brand Logo with Icon */}
              <Link
                to="/"
                className="flex items-center gap-2 text-base sm:text-xl font-black tracking-wider text-white focus:outline-none shrink-0 group"
              >
                <div className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-white/20 shadow-md transition-transform group-hover:scale-105 shrink-0 ${activeHeader.logoBg}`}>
                  <img
                    src={BRAND_LOGO_DATA_URL}
                    alt="RABBiT TV"
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="whitespace-nowrap">RABBiT TV</span>
              </Link>

              {/* Watch History Link & Settings Gear Button */}
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

            {/* Popout Settings Menu */}
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
                      src={BRAND_LOGO_DATA_URL}
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
                  <div className="grid grid-cols-3 gap-3">
                    {allThemesList.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setAppTheme(t.id)}
                        className={`rounded-xl border py-3 text-xs font-bold transition focus:outline-none focus:ring-4 ${
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
