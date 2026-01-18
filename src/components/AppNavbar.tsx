import { useState, memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuditorModeToggle } from '@/components/AuditorModeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Moon, Sun, Menu, LogOut, User } from 'lucide-react';

export const AppNavbar = memo(function AppNavbar() {
  const { sidebarCollapsed, theme, toggleTheme, setMobileSidebarOpen, auditorMode, setAuditorMode } = useApp();
  const { user, logout } = usePrivy();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : user?.wallet?.address
    ? user.wallet.address.substring(2, 4).toUpperCase()
    : 'U';

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results or perform search
      // For now, we'll just log it - you can implement actual search logic later
      console.log('Searching for:', searchQuery);
      // Example: navigate(`/app/search?q=${encodeURIComponent(searchQuery)}`);
    }
  }, [searchQuery]);

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

      {/* Search Bar - Premium */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full bg-background-elevated border-border-subtle focus-visible:bg-background"
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

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user?.email || 'User'}
              </p>
              {user?.wallet?.address && (
                <p className="text-xs leading-none text-muted-foreground">
                  {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
});
