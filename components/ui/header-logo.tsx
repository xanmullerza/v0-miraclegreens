'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useSearch } from '@/lib/context/search-context';
import { BookoFoodLogo } from '@/components/ui/bookofood-logo';
import { cn } from '@/lib/utils';
import { useSplitView } from '@/lib/context/split-view-context';
import { useActionPanel } from '@/lib/context/action-panel-context';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { supabase } from '@/lib/supabase';

interface HeaderLogoProps {
  showSubtext?: boolean;
  userStatus?: 'cloud' | 'local' | 'anonymous';
  userAvatarUrl?: string;
  isMobileLandscape?: boolean;
}

export function HeaderLogo({
  showSubtext = true,
  userStatus = 'anonymous',
  userAvatarUrl,
  isMobileLandscape: mobileLandscapeProp,
}: HeaderLogoProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  const { resizeMode, toggleResize, setResizeMode } = useSplitView();
  const {
    isActionPanelOpen,
    setIsActionPanelOpen,
    setActiveView,
    activeView,
    activeMainTab,
    setActiveMainTab,
  } = useActionPanel();
  const { profile } = useUserPreferences();
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { searchQuery, setSearchQuery, isFocused, setIsFocused, results, setResults, isLoading, setIsLoading, onResultClickRef } = useSearch();

  useEffect(() => {
    setMounted(true);
    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsMobile(width < 1024);
      setIsLandscape(width < 1024 && width > height);
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Search functionality
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Search foods
        const { data: foods, error: foodsError } = await supabase
          .from('food_items')
          .select('id, name, common_name, category, image')
          .or(`name.ilike.%${searchQuery}%,common_name.ilike.%${searchQuery}%`)
          .limit(5);

        // Search recipes
        const { data: recipes, error: recipesError } = await supabase
          .from('recipes')
          .select('id, title, description, image_url')
          .ilike('title', `%${searchQuery}%`)
          .limit(5);

        const searchResults: any[] = [];

        if (foods && !foodsError) {
          foods.forEach(food => {
            searchResults.push({
              id: `food-${food.id}`,
              title: food.name,
              subtitle: food.common_name || food.category,
              image: food.image,
              data: { type: 'food', id: food.id }
            });
          });
        }

        if (recipes && !recipesError) {
          recipes.forEach(recipe => {
            searchResults.push({
              id: `recipe-${recipe.id}`,
              title: recipe.title,
              subtitle: recipe.description || 'Recipe',
              image: recipe.image_url,
              data: { type: 'recipe', id: recipe.id }
            });
          });
        }

        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, setResults, setIsLoading]);

  // Handle search result selection
  useEffect(() => {
    const handleResultClick = (result: any) => {
      if (result.data.type === 'food') {
        // Navigate to foods tab and open food detail
        setActiveMainTab('foods');
        router.push(`/?foodId=${result.data.id}`);
        setIsActionPanelOpen(true);
        setActiveView('food-detail');
      } else if (result.data.type === 'recipe') {
        // Navigate to recipes tab and open recipe detail
        setActiveMainTab('recipes');
        router.push(`/?recipeId=${result.data.id}`);
      }
      
      // Clear search
      setSearchQuery('');
      setIsSearchExpanded(false);
      setIsFocused(false);
    };

    onResultClickRef.current = handleResultClick;
  }, [onResultClickRef, setActiveMainTab, router, setIsActionPanelOpen, setActiveView, setSearchQuery]);

  const getResizeIcon = () => {
    if (resizeMode === 'equal') return <Computer size={18} />;
    if (resizeMode === 'content-focus') return <TabletSmartphone size={18} />;
    if (resizeMode === 'dashboard-only') return <Smartphone size={18} />;
    return <Computer size={18} />;
  };

  const getResizeTooltip = () => {
    if (resizeMode === 'content-focus') return 'Equal Split (50/50)';
    if (resizeMode === 'equal') return 'Full Dashboard View';
    if (resizeMode === 'dashboard-only') return 'Focus Content (70/30)';
    return 'Toggle View';
  };

  const mobileLandscape =
    typeof mobileLandscapeProp === 'boolean' ? mobileLandscapeProp : isMobile && isLandscape;

  if (mobileLandscape) {
    const mobileNavItems = [
      { id: 'recipes', label: 'Home', icon: Info },
      { id: 'foods', label: 'Library', icon: BookOpen },
      { id: 'planner', label: 'Tracker', icon: Calendar },
    ];

    const sideActions = [
      { id: 'privacy', label: 'Privacy', icon: Shield },
      { id: 'support', label: 'Support', icon: HelpCircle },
      { id: 'terms', label: 'Terms', icon: BookOpen },
    ];

    return (
      <div className="fixed inset-y-0 left-0 z-50 w-20 border-r border-border bg-background/90 backdrop-blur-xl md:hidden flex flex-col justify-between py-3">
        <div className="flex flex-col items-center gap-3 px-1">
          <Link
            href="/dashboard"
            className="flex items-center justify-center h-12 w-12 rounded-2xl bg-slate-900 dark:bg-slate-800 border border-slate-700 shadow-sm text-white transition-all hover:opacity-90"
          >
            <BookoFoodLogo size="sm" />
          </Link>

          <div className="flex flex-col items-center gap-2 mt-4">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMainTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveMainTab(item.id as any);
                    if (item.id === 'recipes') {
                      setResizeMode('content-focus');
                    }
                    router.push('/');
                  }}
                  title={item.label}
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-2xl transition-all',
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
                  )}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 px-1">
          {sideActions.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id as any);
                  setIsActionPanelOpen(true);
                }}
                title={item.label}
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-2xl transition-all',
                  isActive
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
                )}
              >
                <Icon size={18} />
              </button>
            );
          })}

          <button
            onClick={() => {
              setActiveView('import');
              setIsActionPanelOpen(true);
            }}
            title="Import Recipe"
            className="flex h-12 w-12 items-center justify-center rounded-2xl transition-all bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Plus size={18} />
          </button>

          <button
            onClick={() => {
              if (pathname === '/profile') {
                router.push('/dashboard');
                return;
              }
              setActiveView('profile');
              setIsActionPanelOpen(true);
            }}
            title="Profile"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white transition-all hover:opacity-90"
          >
            <div className="h-6 w-6 rounded-full flex items-center justify-center overflow-hidden">
              {userAvatarUrl ? (
                <img src={userAvatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={16} />
              )}
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      suppressHydrationWarning
      className={cn(
        'hidden md:flex items-center bg-background border-b border-border w-full transition-all duration-500 overflow-hidden h-12',
      )}
    >
      {/* Left - Logo Area */}
      <div className="flex h-full items-center px-4 overflow-hidden">
        <Link
          href="/dashboard"
          className="flex items-center hover:opacity-80 transition-all active:scale-[0.98] shrink-0"
        >
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-slate-900 dark:bg-slate-800 border border-slate-700 flex-shrink-0 shadow-sm">
            <BookoFoodLogo size="sm" />
          </div>
        </Link>

        {/* Main App Navigation (Next to Logo) */}
        <div className="flex items-center ml-2 sm:ml-6 gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'recipes', label: 'Home', icon: Info, color: 'text-purple-500' },
            { id: 'recipes', label: 'Cookbook', icon: ChefHat, color: 'text-emerald-500' },
            { id: 'foods', label: 'Library', icon: BookOpen, color: 'text-emerald-500' },
            { id: 'planner', label: 'Tracker', icon: Calendar, color: 'text-emerald-500' },
          ].map((item: any) => {
            const Icon = item.icon;
            const isHome = item.label === 'Home';
            const isActive = activeMainTab === item.id;

            if (isHome && activeMainTab !== 'recipes') return null;

            return (
              <button
                key={item.label}
                onClick={() => {
                  setActiveMainTab(item.id);
                  if (item.label === 'Home') {
                    setResizeMode('content-focus');
                  }
                  router.push('/');
                }}
                className={cn(
                  'flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full transition-all text-[10px] font-black uppercase tracking-widest shrink-0',
                  isActive
                    ? 'bg-slate-800/5 dark:bg-slate-800 text-foreground'
                    : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-emerald-500 active:scale-95',
                )}
                title={item.label}
              >
                <Icon size={14} className={isActive ? item.color : 'opacity-70'} />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Center - Global Search */}
      <div className="flex-1 flex justify-center px-4 relative">
        <div className="relative w-full max-w-md">
          <div
            className={cn(
              "relative w-full h-8 flex items-center bg-white/50 dark:bg-slate-900/50 rounded-xl shadow-sm ring-1 ring-white/10 transition-all duration-300",
              (isSearchExpanded || searchQuery) ? "bg-white dark:bg-slate-800 ring-emerald-500/20" : "cursor-pointer hover:bg-white/70 dark:hover:bg-slate-900/70"
            )}
            onClick={() => {
              if (!isSearchExpanded && !searchQuery) {
                setIsSearchExpanded(true);
                setIsFocused(true);
              }
            }}
          >
            <Search className={cn(
              "absolute transition-all duration-300 pointer-events-none text-slate-400",
              (isSearchExpanded || searchQuery) ? "left-3 text-emerald-500" : "left-1/2 -translate-x-1/2"
            )} size={14} />

            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                // Delay hiding to allow result clicks
                setTimeout(() => {
                  if (!searchQuery) {
                    setIsSearchExpanded(false);
                    setIsFocused(false);
                  }
                }, 150);
              }}
              placeholder="Search foods, recipes..."
              className={cn(
                "w-full h-full pl-9 pr-9 rounded-xl text-[11px] font-bold bg-transparent outline-none transition-all duration-300",
                (isSearchExpanded || searchQuery) ? "opacity-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" : "opacity-0 pointer-events-none"
              )}
            />

            {(isSearchExpanded || searchQuery) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery('');
                  setIsSearchExpanded(false);
                  setIsFocused(false);
                  searchInputRef.current?.blur();
                }}
                className="absolute right-3 p-1 transition-all duration-300 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {(isSearchExpanded || searchQuery) && (results.length > 0 || isLoading) && (
            <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-slate-500">
                  <div className="animate-spin w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  Searching...
                </div>
              ) : results.length > 0 ? (
                <div className="py-2">
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => {
                        if (onResultClickRef.current) {
                          onResultClickRef.current(result);
                        }
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3"
                    >
                      {result.image && (
                        <img 
                          src={result.image} 
                          alt={result.title} 
                          className="w-8 h-8 rounded-lg object-cover flex-shrink-0" 
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery && !isLoading ? (
                <div className="p-4 text-center text-slate-500">
                  No results found for "{searchQuery}"
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Right Group - Theme Toggle, View Ratio, Profile */}
      <div className="flex items-center h-full px-2 sm:px-4">
        {/* Navigation Items (Privacy, Support, Terms) */}
        <div className="flex items-center h-full sm:divide-x divide-border border-l border-border">
          {[
            { label: 'Privacy', id: 'privacy', icon: Shield, color: 'text-slate-500' },
            { label: 'Support', id: 'support', icon: HelpCircle, color: 'text-slate-500' },
            { label: 'Terms', id: 'terms', icon: BookOpen, color: 'text-slate-500' },
          ].map((item: any) => {
            const Icon = item.icon;
            const isActive = isActionPanelOpen && activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setIsActionPanelOpen(true);
                }}
                className={cn(
                  'flex items-center gap-2 px-2.5 sm:px-6 h-full transition-all text-[9.5px] font-black uppercase tracking-widest',
                  isActive
                    ? 'bg-slate-900 dark:bg-slate-800 text-white'
                    : 'text-muted-foreground hover:bg-muted dark:hover:bg-slate-800/50 hover:text-emerald-500 active:scale-95',
                )}
                title={item.label}
              >
                <Icon size={14} className={isActive ? item.color : ''} />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Theme Toggle (Desktop Only) */}
        <button
          onClick={() => {
            const options = ['material', 'neon', 'free'];
            const normalized =
              theme === 'light'
                ? 'material'
                : theme === 'dark'
                  ? 'neon'
                  : theme === 'system'
                    ? 'material'
                    : theme;
            const current = options.includes(normalized as string) ? normalized : 'material';
            const nextTheme = options[(options.indexOf(current as string) + 1) % options.length];
            setTheme(nextTheme);
          }}
          className="hidden lg:flex h-12 w-12 border-l border-border items-center justify-center transition-all focus:outline-none text-muted-foreground hover:text-emerald-500 hover:bg-muted dark:hover:bg-slate-800/50 active:scale-95"
          title={(() => {
            const options = ['material', 'neon', 'free'];
            const normalized =
              theme === 'light'
                ? 'material'
                : theme === 'dark'
                  ? 'neon'
                  : theme === 'system'
                    ? 'material'
                    : theme;
            const current = options.includes(normalized as string) ? normalized : 'material';
            const nextTheme = options[(options.indexOf(current as string) + 1) % options.length];
            return `Switch to ${nextTheme.charAt(0).toUpperCase() + nextTheme.slice(1)} theme`;
          })()}
        >
          <div className="relative w-[18px] h-[18px] flex items-center justify-center">
            {mounted ? <Shapes size={18} /> : <div className="w-[18px] h-[18px]" />}
          </div>
        </button>

        {/* Profile Button */}
        <div className="flex flex-shrink-0 border-l lg:border-l border-border h-full overflow-hidden">
          {/* Plus Button - Import Recipe */}
          <button
            onClick={() => {
              setActiveView('import');
              setIsActionPanelOpen(true);
            }}
            className="h-12 w-12 flex items-center justify-center hover:bg-muted dark:hover:bg-slate-800 transition-colors text-muted-foreground hover:text-emerald-500 active:scale-95"
            title="Import Recipe"
          >
            <Plus size={18} />
          </button>

          {pathname === '/profile' ? (
            <Link
              href="/dashboard"
              className="h-12 w-12 flex items-center justify-center hover:bg-muted dark:hover:bg-slate-800 transition-colors text-muted-foreground hover:text-emerald-500 active:scale-95"
              title="Go Home"
            >
              <Home size={18} />
            </Link>
          ) : (
            <button
              onClick={() => {
                setActiveView('profile');
                setIsActionPanelOpen(true);
              }}
              className="h-12 w-12 flex items-center justify-center hover:bg-muted dark:hover:bg-slate-800 transition-colors active:scale-95"
              title="Profile"
            >
              <div
                className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center text-white overflow-hidden transition-all shadow-sm flex-shrink-0 hover:ring-2 hover:ring-emerald-500/20',
                  userStatus === 'cloud'
                    ? 'bg-emerald-500'
                    : userStatus === 'local'
                      ? 'bg-blue-500'
                      : 'bg-orange-500',
                )}
              >
                {userAvatarUrl ? (
                  <img src={userAvatarUrl} alt="P" className="w-full h-full object-cover" />
                ) : (
                  <User size={14} />
                )}
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
