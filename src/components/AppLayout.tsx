import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { AppSidebar } from '@/components/AppSidebar';
import { AppNavbar } from '@/components/AppNavbar';

export function AppLayout() {
  const { sidebarCollapsed } = useApp();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <AppNavbar />
      <main
        className={cn(
          'min-h-screen transition-all duration-200 ease-in-out pt-14',
          isMobile 
            ? 'ml-0' 
            : sidebarCollapsed 
              ? 'ml-sidebar-collapsed' 
              : 'ml-sidebar'
        )}
      >
        <div className="page-container animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
