import { useState, useEffect } from "react";
import { Sparkles, Search, Compass, BookOpen, Flame, Mail, Download, LogIn, Laptop, Moon, Sun, Monitor, CircleAlert, Video, Menu, X, Youtube, Heart } from "lucide-react";
import { AppSettings } from "../types";

interface NavbarProps {
  settings: AppSettings;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAdmin: () => void;
  onOpenContact: () => void;
  isAdminLoggedIn: boolean;
  onLogoutAdmin: () => void;
  setSelectedPlatform?: (platform: string) => void;
  setSelectedCategory?: (category: string) => void;
  setSortBy?: (sort: any) => void;
}

export default function Navbar({
  settings,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onOpenAdmin,
  onOpenContact,
  isAdminLoggedIn,
  onLogoutAdmin,
  setSelectedPlatform = () => {},
  setSelectedCategory = () => {},
  setSortBy = () => {}
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    // Register PWA installation listener
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  const navItems = [
    { id: "home", label: "Home", icon: Compass },
    { id: "midjourney-prompts", label: "Midjourney Prompts", icon: Sparkles },
    { id: "chatgpt-gemini", label: "ChatGPT/Gemini", icon: Sparkles },
    { id: "trending", label: "Trending", icon: Flame },
    { id: "guides", label: "AI Guides (Blog)", icon: BookOpen },
    { id: "watch", label: "How to Use", icon: Youtube },
    { id: "favorites", label: "My Favorites", icon: Heart }
  ];

  return (
    <nav
      id="main-navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || mobileMenuOpen
          ? "bg-[#0F172A]/95 backdrop-blur-xl border-b border-violet-500/10 shadow-[0_10px_30px_rgba(15,23,42,0.5)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => setActiveTab("home")}>
            <div className="relative group">
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 opacity-70 blur-md group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative px-4 py-2 bg-[#1E293B] rounded-lg border border-violet-500/20 flex items-center gap-2">
                <img
                  src="/logo.png"
                  alt="Shubh Prompt Logo"
                  className="w-5 h-5 object-contain rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = document.getElementById("logo-fallback-sparkles");
                    if (fallback) fallback.style.display = "block";
                  }}
                />
                <Sparkles
                  id="logo-fallback-sparkles"
                  className="w-5 h-5 text-cyan-400 animate-pulse"
                  style={{ display: "none" }}
                />
                <span className="font-sans font-bold tracking-tight text-white text-lg bg-gradient-to-r from-cyan-400 via-violet-300 to-white bg-clip-text text-transparent">
                  {settings.logoName || "ShubhPrompt"}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = 
                item.id === "midjourney-prompts"
                  ? activeTab === "prompts" && (window as any).selectedPlatform === "Midjourney"
                  : item.id === "chatgpt-gemini"
                  ? activeTab === "prompts" && (window as any).selectedPlatform === "ChatGPT/Gemini"
                  : activeTab === item.id;
              return (
                <button
                  id={`nav-item-${item.id}`}
                  key={item.id}
                  onClick={() => {
                    if (item.id === "midjourney-prompts") {
                      setSelectedPlatform("Midjourney");
                      setSelectedCategory("All Categories");
                      setSortBy("latest");
                      setActiveTab("prompts");
                      setSearchQuery("");
                    } else if (item.id === "chatgpt-gemini") {
                      setSelectedPlatform("ChatGPT/Gemini");
                      setSelectedCategory("All Categories");
                      setSortBy("latest");
                      setActiveTab("prompts");
                      setSearchQuery("");
                    } else {
                      setActiveTab(item.id);
                      setSearchQuery("");
                    }
                  }}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? "text-cyan-400 bg-violet-500/10 border-b border-cyan-500/30"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-gray-400 hover:text-white"}`} />
                  {item.label}
                </button>
              );
            })}
            <button
              id="nav-item-contact"
              onClick={onOpenContact}
              className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200 flex items-center gap-1.5"
            >
              <Mail className="w-4 h-4 text-gray-400" />
              Contact
            </button>
          </div>

          {/* Search Box */}
          <div className="hidden md:flex flex-1 max-w-xs mx-4">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 h-4 text-violet-400" />
              </span>
              <input
                id="search-input-navbar"
                type="text"
                placeholder="Search premium prompts..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeTab === "home") {
                    setActiveTab("prompts");
                  }
                }}
                className="w-full bg-[#1E293B] border border-violet-500/20 hover:border-violet-500/40 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/80 rounded-full py-2.5 pl-10 pr-4 text-xs font-sans text-white placeholder-gray-400 transition-all duration-300"
              />
            </div>
          </div>

          {/* Actions: Install, Support & Admin Actions */}
          <div className="flex items-center gap-3">
            {isInstallable && (
              <button
                id="install-app-btn"
                onClick={handleInstallApp}
                className="relative hidden sm:inline-flex group overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-full" />
                <span className="relative px-4 py-1.5 rounded-full bg-[#0F172A] transition-all duration-300 group-hover:bg-transparent text-xs text-cyan-300 font-medium flex items-center gap-1.5 hover:text-white">
                  <Download className="w-3.5 h-3.5" />
                  Install App
                </span>
              </button>
            )}

            {isAdminLoggedIn ? (
              <div className="flex items-center gap-2">
                <button
                  id="admin-dashboard-link-btn"
                  onClick={() => setActiveTab("admin")}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 transition-all duration-300"
                >
                  <Monitor className="w-4.5 h-4.5" />
                  Console
                </button>
                <button
                  id="admin-logout-btn"
                  onClick={onLogoutAdmin}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center gap-1.5 transition-all duration-300"
                >
                  <CircleAlert className="w-4.5 h-4.5" />
                  Log Out
                </button>
              </div>
            ) : (
              <button
                id="admin-login-link-btn"
                onClick={onOpenAdmin}
                className="p-2 sm:px-4 sm:py-2.5 text-xs font-medium rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-violet-950/20 transition-all duration-300 flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4 text-violet-400" />
                <span className="hidden sm:inline">Admin Login</span>
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex lg:hidden items-center ml-2">
            <button
              id="hamburger-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              className="p-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all duration-200 outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-cyan-400 animate-pulse" />
              ) : (
                <Menu className="w-6 h-6 text-[#E2E8F0]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu (Positioned absolutely to eliminate CLS and layout shifts) */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 lg:hidden bg-[#0F172A]/98 border-b border-violet-500/15 backdrop-blur-3xl px-5 pt-3 pb-8 space-y-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] max-h-[calc(100vh-5rem)] overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-200 z-50">
          {/* Mobile Search Input Block */}
          <div className="py-2.5">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-violet-400" />
              </span>
              <input
                id="search-input-navbar-mobile"
                type="text"
                placeholder="Search premium prompts..."
                value={searchQuery}
                aria-label="Search prompts"
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeTab === "home") {
                    setActiveTab("prompts");
                  }
                }}
                className="w-full bg-[#1E293B] border border-violet-500/30 hover:border-violet-500/50 focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-400/80 rounded-full py-3.5 pl-11 pr-5 text-sm font-sans text-white focus:outline-none transition-all duration-300 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Navigation Links Index */}
          <div className="space-y-1.5 pt-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = 
                item.id === "midjourney-prompts"
                  ? activeTab === "prompts" && (window as any).selectedPlatform === "Midjourney"
                  : item.id === "chatgpt-gemini"
                  ? activeTab === "prompts" && (window as any).selectedPlatform === "ChatGPT/Gemini"
                  : activeTab === item.id;
              return (
                <button
                  id={`mobile-nav-${item.id}`}
                  key={item.id}
                  onClick={() => {
                    if (item.id === "midjourney-prompts") {
                      setSelectedPlatform("Midjourney");
                      setSelectedCategory("All Categories");
                      setSortBy("latest");
                      setActiveTab("prompts");
                      setSearchQuery("");
                    } else if (item.id === "chatgpt-gemini") {
                      setSelectedPlatform("ChatGPT/Gemini");
                      setSelectedCategory("All Categories");
                      setSortBy("latest");
                      setActiveTab("prompts");
                      setSearchQuery("");
                    } else {
                      setActiveTab(item.id);
                      setSearchQuery("");
                    }
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-3.5 ${
                    isActive
                      ? "text-cyan-400 bg-violet-500/10 border-l-4 border-cyan-400"
                      : "text-gray-300 hover:text-white hover:bg-white/5 active:bg-white/10"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-cyan-400" : "text-gray-400"}`} />
                  {item.label}
                </button>
              );
            })}

            <button
              id="mobile-nav-contact"
              onClick={() => {
                onOpenContact();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-5 py-3.5 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all duration-200 flex items-center gap-3.5"
            >
              <Mail className="w-5 h-5 text-gray-400" />
              Contact Support
            </button>

            {/* Mobile Admin Management Controls */}
            {isAdminLoggedIn ? (
              <div className="pt-4 border-t border-violet-500/10 mt-4 space-y-2.5">
                <button
                  id="mobile-nav-admin"
                  onClick={() => {
                    setActiveTab("admin");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-5 py-3.5 rounded-xl text-sm font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 active:bg-emerald-500/30 transition-all duration-200 flex items-center gap-3.5"
                >
                  <Monitor className="w-5 h-5 text-emerald-400" />
                  Administrator Console
                </button>
                <button
                  id="mobile-nav-logout"
                  onClick={() => {
                    onLogoutAdmin();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-5 py-3.5 rounded-xl text-sm font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 active:bg-rose-500/30 transition-all duration-200 flex items-center gap-3.5"
                >
                  <CircleAlert className="w-5 h-5 text-rose-400" />
                  Log Out Administrator
                </button>
              </div>
            ) : (
              <button
                id="mobile-nav-admin-login"
                onClick={() => {
                  onOpenAdmin();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-5 py-3.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-cyan-400 hover:bg-violet-950/20 transition-all duration-200 flex items-center gap-3.5 pt-4 border-t border-violet-500/10 mt-4"
              >
                <LogIn className="w-5 h-5 text-violet-400" />
                Administrator Login
              </button>
            )}

            {isInstallable && (
              <button
                id="mobile-nav-install"
                onClick={() => {
                  handleInstallApp();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-5 py-3.5 rounded-xl text-sm font-bold text-cyan-300 bg-violet-950/40 hover:text-white transition-all duration-200 flex items-center gap-3.5 mt-4"
              >
                <Download className="w-5 h-5 text-cyan-400" />
                Install Native App
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
