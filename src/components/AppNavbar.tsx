import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuditorModeToggle } from '@/components/AuditorModeToggle';
import { Search, Moon, Sun, Menu } from 'lucide-react';

export function AppNavbar() {
  const { sidebarCollapsed, theme, toggleTheme, setMobileSidebarOpen, auditorMode, setAuditorMode } = useApp();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results or perform search
      // For now, we'll just log it - you can implement actual search logic later
      console.log('Searching for:', searchQuery);
      // Example: navigate(`/app/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav
      className={cn(
        'fixed top-0 right-0 z-30 h-14 border-b bg-background transition-all duration-200 ease-in-out flex items-center gap-2 sm:gap-4',
        'px-2 sm:px-4',
        isMobile ? 'left-0' : sidebarCollapsed ? 'left-sidebar-collapsed' : 'left-sidebar'
      )}
    >
      {/* Mobile Menu Button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileSidebarOpen(true)}
          className="h-9 w-9 shrink-0 touch-manipulation"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 sm:pl-9 w-full text-sm sm:text-base"
          />
        </div>
      </form>

      {/* Auditor Mode Toggle */}
      {!isMobile && (
        <AuditorModeToggle enabled={auditorMode} onToggle={setAuditorMode} />
      )}

      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="h-9 w-9 shrink-0 touch-manipulation"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        {theme === 'light' ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </Button>
    </nav>
  );
}
