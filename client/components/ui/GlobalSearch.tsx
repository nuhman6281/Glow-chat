import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Users,
  MessageSquare,
  Settings,
  User,
  Hash,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { usersApi, chatsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface SearchResult {
  id: string;
  type: "user" | "chat" | "setting";
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // Debounced query for API calls
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch users
  const { data: usersResponse } = useQuery({
    queryKey: ["users", "search", debouncedQuery],
    queryFn: () => usersApi.searchUsers(debouncedQuery),
    enabled: debouncedQuery.length > 0,
    staleTime: 30000,
  });

  // Fetch chats
  const { data: chatsResponse } = useQuery({
    queryKey: ["chats", "search", debouncedQuery],
    queryFn: () => chatsApi.getChats({ limit: 5 }),
    enabled: debouncedQuery.length > 0,
    staleTime: 30000,
  });

  const users = usersResponse?.data?.users || [];
  const chats = chatsResponse?.data?.chats || [];

  // Generate search results
  const generateResults = useCallback((): SearchResult[] => {
    if (!debouncedQuery) return [];

    const results: SearchResult[] = [];

    // Add users - ensure users is an array
    if (Array.isArray(users)) {
      users.forEach((user) => {
        // Ensure user is a User object, not a string
        if (
          typeof user === "object" &&
          "firstName" in user &&
          "lastName" in user
        ) {
          const userObj = user as any;
          if (
            userObj.firstName
              .toLowerCase()
              .includes(debouncedQuery.toLowerCase()) ||
            userObj.lastName
              .toLowerCase()
              .includes(debouncedQuery.toLowerCase()) ||
            userObj.email.toLowerCase().includes(debouncedQuery.toLowerCase())
          ) {
            results.push({
              id: `user-${userObj._id}`,
              type: "user",
              title: `${userObj.firstName} ${userObj.lastName}`,
              subtitle: userObj.email,
              icon: <User className="w-4 h-4" />,
              action: () => {
                navigate(`/profile/${userObj._id}`);
                setIsOpen(false);
                setQuery("");
              },
            });
          }
        }
      });
    }

    // Add chats - ensure chats is an array
    if (Array.isArray(chats)) {
      chats.forEach((chat) => {
        let chatName = chat.name;

        if (chat.type === "direct") {
          const otherParticipant = chat.participants?.find(
            (p) =>
              typeof p.user === "object" && p.user._id !== currentUser?._id,
          );
          if (
            otherParticipant &&
            typeof otherParticipant.user === "object" &&
            "firstName" in otherParticipant.user
          ) {
            const userObj = otherParticipant.user as any;
            chatName = `${userObj.firstName} ${userObj.lastName}`;
          }
        }

        if (chatName?.toLowerCase().includes(debouncedQuery.toLowerCase())) {
          results.push({
            id: `chat-${chat._id}`,
            type: "chat",
            title: chatName || "Unknown Chat",
            subtitle:
              chat.type === "group"
                ? `${chat.participants?.length} participants`
                : "Direct message",
            icon:
              chat.type === "group" ? (
                <Hash className="w-4 h-4" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              ),
            action: () => {
              navigate(`/?chat=${chat._id}`);
              setIsOpen(false);
              setQuery("");
            },
          });
        }
      });
    }

    // Add settings options
    const settingsOptions = [
      { title: "Profile Settings", path: "/profile" },
      { title: "Account Settings", path: "/settings" },
      { title: "Privacy Settings", path: "/settings?tab=privacy" },
      { title: "Notification Settings", path: "/settings?tab=notifications" },
    ];

    settingsOptions.forEach((option) => {
      if (option.title.toLowerCase().includes(debouncedQuery.toLowerCase())) {
        results.push({
          id: `setting-${option.path}`,
          type: "setting",
          title: option.title,
          subtitle: "Settings",
          icon: <Settings className="w-4 h-4" />,
          action: () => {
            navigate(option.path);
            setIsOpen(false);
            setQuery("");
          },
        });
      }
    });

    return results.slice(0, 8); // Limit to 8 results
  }, [debouncedQuery, users, chats, navigate, currentUser]);

  const results = generateResults();

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + results.length) % results.length,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          results[selectedIndex].action();
        }
        break;
      case "Escape":
        setIsOpen(false);
        setQuery("");
        break;
    }
  };

  // Handle input focus/blur
  const handleFocus = () => {
    if (query.length > 0) {
      setIsOpen(true);
    }
  };

  const handleBlur = () => {
    // Delay closing to allow for clicks on results
    setTimeout(() => setIsOpen(false), 200);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length > 0);
    setSelectedIndex(0);
  };

  return (
    <div className="relative w-full max-w-md lg:max-w-lg">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
      <Input
        ref={inputRef}
        value={query}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Search messages, files, people..."
        className="pl-10 bg-muted/50 border-0 text-sm"
      />

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {results.map((result, index) => (
            <div
              key={result.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors",
                index === selectedIndex && "bg-muted/50",
              )}
              onClick={result.action}
            >
              <div className="text-muted-foreground">{result.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {result.title}
                </div>
                {result.subtitle && (
                  <div className="text-xs text-muted-foreground truncate">
                    {result.subtitle}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && query.length > 0 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 p-4">
          <div className="text-sm text-muted-foreground text-center">
            No results found for "{query}"
          </div>
        </div>
      )}
    </div>
  );
}
