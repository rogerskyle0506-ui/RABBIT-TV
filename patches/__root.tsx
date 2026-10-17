import {
  Outlet,
  ScrollRestoration,
  createRootRoute,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Meta, Scripts } from '@tanstack/start'
import React, { useEffect, useState, useRef } from 'react'

export const Route = createRootRoute({
  component: RootComponent,
})

type ThemeName = 'violet' | 'red' | 'midnight' | 'emerald' | 'amber' | 'cyan'
type SettingsTab = 'theme' | 'scale' | 'mouse'

function RootComponent() {
  const navigate = useNavigate()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const [theme, setTheme] = useState<ThemeName>('violet')
  const [uiScale, setUiScale] = useState<number>(100)
  const [mouseMode, setMouseMode] = useState<boolean>(false)
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<SettingsTab>('theme')

  // Remote / Keyboard navigation states
  const [isTopNavFocused, setIsTopNavFocused] = useState<boolean>(false)
  const [topNavIndex, setTopNavIndex] = useState<number>(0)
  const [isSettingsMenuFocused, setIsSettingsMenuFocused] = useState<boolean>(false)
  const [settingsIndex, setSettingsIndex] = useState<number>(0)

  const settingsButtonRef = useRef<HTMLButtonElement>(null)
  const settingsModalRef = useRef<HTMLDivElement>(null)

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('rab_theme') as ThemeName
      const validThemes: ThemeName[] = ['violet', 'red', 'midnight', 'emerald', 'amber', 'cyan']
      if (savedTheme && validThemes.includes(savedTheme)) {
        setTheme(savedTheme)
      }
      const savedScale = localStorage.getItem('rab_scale')
      if (savedScale) {
        setUiScale(parseInt(savedScale, 10))
      }
      const savedMouse = localStorage.getItem('rab_mouse')
      if (savedMouse !== null) {
        setMouseMode(savedMouse === 'true')
      }
    }
  }, [])

  // Save preferences
  const handleSetTheme = (newTheme: ThemeName) => {
    setTheme(newTheme)
    localStorage.setItem('rab_theme', newTheme)
  }

  const handleSetScale = (scale: number) => {
    setUiScale(scale)
    localStorage.setItem('rab_scale', scale.toString())
  }

  const handleSetMouse = (enabled: boolean) => {
    setMouseMode(enabled)
    localStorage.setItem('rab_mouse', enabled.toString())
  }

  // Top navigation items
  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Movies', path: '/movies' },
    { label: 'TV Shows', path: '/tv' },
    { label: 'Search', path: '/search' },
    { label: 'My List', path: '/mylist' },
    { label: 'Watch History', path: '/watch-history' },
  ]

  const tabs: SettingsTab[] = ['theme', 'scale', 'mouse']

  // Global remote control listener for TV navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is inside settings modal
      if (showSettings) {
        if (e.key === 'Escape' || e.key === 'Backspace') {
          e.preventDefault()
          setShowSettings(false)
          setIsSettingsMenuFocused(false)
          settingsButtonRef.current?.focus()
          return
        }

        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault()
          const currentIndex = tabs.indexOf(activeTab)
          const nextIndex =
            e.key === 'ArrowRight'
              ? (currentIndex + 1) % tabs.length
              : (currentIndex - 1 + tabs.length) % tabs.length
          setActiveTab(tabs[nextIndex])
        }
        return
      }

      // If top nav bar is focused
      if (isTopNavFocused) {
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          setTopNavIndex((prev) => (prev + 1) % (navItems.length + 1)) // +1 for settings button
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          setTopNavIndex((prev) => (prev - 1 + navItems.length + 1) % (navItems.length + 1))
        } else if (e.key === 'Enter') {
          e.preventDefault()
          if (topNavIndex < navItems.length) {
            navigate({ to: navItems[topNavIndex].path })
            setIsTopNavFocused(false)
          } else {
            // Settings button clicked
            setShowSettings(true)
            setIsSettingsMenuFocused(true)
            setIsTopNavFocused(false)
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          setIsTopNavFocused(false) // Drop back into page content
        }
      } else {
        // Pressing Up from top of page focuses top nav
        if (e.key === 'ArrowUp' && window.scrollY === 0) {
          e.preventDefault()
          setIsTopNavFocused(true)
          setTopNavIndex(0)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showSettings, isTopNavFocused, topNavIndex, activeTab, navItems, navigate])

  // Theme styling helpers
  const getThemeBackground = () => {
    switch (theme) {
      case 'red':
        return 'bg-[#0f0505] text-zinc-100'
      case 'midnight':
        return 'bg-[#020617] text-slate-100'
      case 'emerald':
        return 'bg-[#031109] text-emerald-50'
      case 'amber':
        return 'bg-[#120a02] text-amber-50'
      case 'cyan':
        return 'bg-[#021013] text-cyan-50'
      case 'violet':
      default:
        return 'bg-[#090514] text-purple-50'
    }
  }

  const getPrimaryAccent = () => {
    switch (theme) {
      case 'red':
        return 'bg-red-600 hover:bg-red-500 text-white'
      case 'midnight':
        return 'bg-blue-600 hover:bg-blue-500 text-white'
      case 'emerald':
        return 'bg-emerald-600 hover:bg-emerald-500 text-white'
      case 'amber':
        return 'bg-amber-600 hover:bg-amber-500 text-white'
      case 'cyan':
        return 'bg-cyan-600 hover:bg-cyan-500 text-white'
      case 'violet':
      default:
        return 'bg-purple-600 hover:bg-purple-500 text-white'
    }
  }

  const getBorderColor = () => {
    switch (theme) {
      case 'red':
        return 'border-red-900/40 focus:border-red-500'
      case 'midnight':
        return 'border-blue-900/40 focus:border-blue-500'
      case 'emerald':
        return 'border-emerald-900/40 focus:border-emerald-500'
      case 'amber':
        return 'border-amber-900/40 focus:border-amber-500'
      case 'cyan':
        return 'border-cyan-900/40 focus:border-cyan-500'
      case 'violet':
      default:
        return 'border-purple-900/40 focus:border-purple-500'
    }
  }

  return (
    <html lang="en" className={mouseMode ? '' : 'cursor-none'}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>RABBiT TV</title>
        <Meta />
      </head>
      <body
        className={`min-h-screen ${getThemeBackground()} antialiased selection:bg-purple-500 selection:text-white`}
        style={{ fontSize: `${uiScale}%` }}
      >
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-black/40 border-b border-white/10 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-black tracking-wider bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              RABBiT TV
            </h1>
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item, idx) => {
                const isActive = currentPath === item.path
                const isFocused = isTopNavFocused && topNavIndex === idx
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate({ to: item.path })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? `${getPrimaryAccent()} shadow-lg`
                        : 'text-zinc-300 hover:text-white hover:bg-white/10'
                    } ${isFocused ? 'ring-2 ring-white scale-105' : ''}`}
                  >
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Settings Button */}
          <button
            ref={settingsButtonRef}
            onClick={() => {
              setShowSettings(true)
              setIsSettingsMenuFocused(true)
            }}
            className={`p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-zinc-200 hover:text-white ${
              isTopNavFocused && topNavIndex === navItems.length ? 'ring-2 ring-white scale-105' : ''
            }`}
            title="Settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </header>

        {/* Main Application Outlet */}
        <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 md:py-6 overflow-x-hidden">
          <Outlet />
        </main>

        {/* Settings Modal Popup */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div
              ref={settingsModalRef}
              className={`w-full max-w-xl rounded-2xl bg-zinc-900 border ${getBorderColor()} p-6 shadow-2xl text-zinc-100`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <h2 className="text-xl font-bold">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-zinc-400 hover:text-white px-3 py-1 rounded-lg bg-white/5"
                >
                  ✕ Close
                </button>
              </div>

              {/* Settings Tabs */}
              <div className="flex space-x-2 mb-6 border-b border-white/10 pb-4">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                      activeTab === tab ? getPrimaryAccent() : 'bg-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="space-y-6">
                {activeTab === 'theme' && (
                  <div>
                    <label className="text-sm font-medium text-zinc-300 block mb-3">Color Theme</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['violet', 'red', 'midnight', 'emerald', 'amber', 'cyan'] as ThemeName[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => handleSetTheme(t)}
                          className={`p-3 rounded-xl border text-center capitalize font-medium transition-all ${
                            theme === t
                              ? 'border-white bg-white/20 text-white shadow-lg'
                              : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'scale' && (
                  <div>
                    <label className="text-sm font-medium text-zinc-300 block mb-3">
                      UI Scale: <span className="text-white font-bold">{uiScale}%</span>
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {[90, 100, 110, 125].map((scale) => (
                        <button
                          key={scale}
                          onClick={() => handleSetScale(scale)}
                          className={`p-3 rounded-xl border text-center font-medium transition-all ${
                            uiScale === scale
                              ? 'border-white bg-white/20 text-white'
                              : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10'
                          }`}
                        >
                          {scale}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'mouse' && (
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h3 className="font-medium text-white">Mouse Cursor</h3>
                      <p className="text-xs text-zinc-400">Show or hide cursor on projector/TV display</p>
                    </div>
                    <button
                      onClick={() => handleSetMouse(!mouseMode)}
                      className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                        mouseMode ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {mouseMode ? 'Enabled' : 'Hidden'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <ScrollRestoration />
        <TanStackRouterDevtools />
        <Scripts />
      </body>
    </html>
  )
}
