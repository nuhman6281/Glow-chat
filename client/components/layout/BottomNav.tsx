import { MessageCircle, Phone, Users, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function BottomNav({
  activeTab = "chats",
  onTabChange,
}: BottomNavProps) {
  const tabs = [
    { id: "chats", label: "Chats", icon: MessageCircle, href: "/" },
    { id: "calls", label: "Calls", icon: Phone, href: "/calls" },
    { id: "contacts", label: "Contacts", icon: Users, href: "/contacts" },
    { id: "profile", label: "Profile", icon: User, href: "/profile" },
    { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-pb">
      <div className="grid grid-cols-5 h-14 md:h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <Button
              key={tab.id}
              variant="ghost"
              className={cn(
                "h-full rounded-none flex flex-col gap-0.5 md:gap-1 py-1.5 md:py-2 px-1",
                isActive && "text-primary bg-primary/10",
              )}
              onClick={() => {
                onTabChange?.(tab.id);
                window.location.href = tab.href;
              }}
            >
              <Icon className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-xs leading-tight">{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
