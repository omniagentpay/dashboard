import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { WorkspaceSwitcherModal } from '@/components/WorkspaceSwitcherModal';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import {
  LayoutDashboard,
  MessageSquare,
  CreditCard,
  Wallet,
  ArrowLeftRight,
  Globe,
  List,
  Shield,
  Code,
  Settings,
  ChevronLeft,
  ChevronDown,
  Building2,
  Plus,
} from 'lucide-react';

const navItems = [
  { path: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/app/agent', icon: MessageSquare, label: 'Agent Chat' },
  { path: '/app/intents', icon: CreditCard, label: 'Payment Intents' },
  { path: '/app/wallets', icon: Wallet, label: 'Wallets' },
  { path: '/app/crosschain', icon: ArrowLeftRight, label: 'Cross-chain' },
  { path: '/app/x402', icon: Globe, label: 'x402 Directory' },
  { path: '/app/transactions', icon: List, label: 'Transactions' },
  { path: '/app/guards', icon: Shield, label: 'Guard Studio' },
  { path: '/app/developers', icon: Code, label: 'Developers' },
  { path: '/app/settings', icon: Settings, label: 'Settings' },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { workspace, sidebarCollapsed, setSidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } = useApp();
  const isMobile = useIsMobile();
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);

  const handleNavClick = () => {
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
    onNavigate?.();
  };

  return (
    <>
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-3 border-b">
        {!sidebarCollapsed && (
          <span className="font-semibold text-foreground">OmniAgentPay</span>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <ChevronLeft className={cn(
              'h-4 w-4 transition-transform',
              sidebarCollapsed && 'rotate-180'
            )} />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.end 
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.end}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-sidebar',
                    'touch-manipulation', // Better touch handling
                    isActive 
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold' 
                      : 'text-sidebar-foreground'
                  )}
                >
                  <item.icon className={cn(
                    'h-5 w-5 shrink-0',
                    isActive && 'text-primary'
                  )} />
                  {(!sidebarCollapsed || isMobile) && <span>{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Workspace Switcher */}
      <div className="border-t p-2">
        <button
          onClick={() => {
            if (!sidebarCollapsed || isMobile) {
              setWorkspaceModalOpen(true);
            }
          }}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors touch-manipulation',
            'hover:bg-sidebar-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-sidebar',
            sidebarCollapsed && !isMobile ? 'justify-center' : 'justify-between'
          )}
          aria-label="Switch workspace"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            {(!sidebarCollapsed || isMobile) && (
              <div className="text-left">
                <p className="font-medium text-foreground">{workspace.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{workspace.plan} plan</p>
              </div>
            )}
          </div>
          {(!sidebarCollapsed || isMobile) && (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>

      <WorkspaceSwitcherModal
        open={workspaceModalOpen}
        onOpenChange={setWorkspaceModalOpen}
      />
    </>
  );
}

export function AppSidebar() {
  const { mobileSidebarOpen, setMobileSidebarOpen, sidebarCollapsed } = useApp();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0 bg-sidebar">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-sidebar transition-all duration-200 ease-in-out flex flex-col',
        'hidden md:flex', // Hide on mobile, show on desktop
        sidebarCollapsed ? 'w-sidebar-collapsed' : 'w-sidebar'
      )}
    >
      <SidebarContent />
    </aside>
  );
}
