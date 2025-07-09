import { ReactNode } from "react";
import { Search, Phone, Video, Settings, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { GlobalSearch } from "@/components/ui/GlobalSearch";
import { BottomNav } from "./BottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface AppLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  header?: ReactNode;
  showSidebarToggle?: boolean;
  showCallButtons?: boolean;
}

export function AppLayout({
  children,
  sidebar,
  header,
  showSidebarToggle = true,
  showCallButtons = false,
}: AppLayoutProps) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="h-14 md:h-16 border-b border-border bg-card px-3 md:px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
          {/* Mobile sidebar trigger */}
          {isMobile && sidebar && showSidebarToggle && (
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                {sidebar}
              </SheetContent>
            </Sheet>
          )}

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-sm">
                G
              </span>
            </div>
            <span className="font-semibold text-lg hidden sm:block">
              GlowChat
            </span>
            <span className="font-semibold text-base sm:hidden">Glow</span>
          </div>

          {/* Search Bar - Hidden on small mobile, shown on tablet+ */}
          <div className="hidden sm:flex relative w-full max-w-md lg:max-w-lg">
            <GlobalSearch />
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {/* Search button for mobile */}
          <Button variant="ghost" size="icon" className="sm:hidden">
            <Search className="w-4 h-4" />
          </Button>

          {/* Call buttons - hidden on mobile, icon only on tablet */}
          {showCallButtons && (
            <>
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <Video className="w-4 h-4" />
              </Button>
            </>
          )}

          {/* Settings - always visible */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/settings")}
          >
            <Settings className="w-4 h-4" />
          </Button>

          {/* User Avatar */}
          <UserAvatar
            name="John Doe"
            status="online"
            className="w-7 h-7 md:w-8 md:h-8"
            onClick={() => navigate("/profile")}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Desktop Sidebar */}
        {sidebar && !isMobile && (
          <div className="w-80 xl:w-96 border-r border-border bg-sidebar hidden lg:flex flex-col shrink-0">
            {sidebar}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Page Header */}
          {header && (
            <div className="border-b border-border bg-card px-3 md:px-4 py-2 md:py-3 shrink-0">
              {header}
            </div>
          )}

          {/* Main Content Area */}
          <main className="flex-1 overflow-hidden pb-16 lg:pb-0 relative">
            {children}
          </main>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <BottomNav />
    </div>
  );
}
