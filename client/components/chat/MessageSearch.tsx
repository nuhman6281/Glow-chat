import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Search, X, MessageSquare, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Message, User as UserType } from "@shared/api";
import { messagesApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface MessageSearchProps {
  chatId?: string;
  onMessageSelect?: (message: Message) => void;
  onClose?: () => void;
  className?: string;
}

export function MessageSearch({
  chatId,
  onMessageSelect,
  onClose,
  className,
}: MessageSearchProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Search messages
  const {
    data: searchResults,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["messageSearch", query, chatId],
    queryFn: () =>
      messagesApi.searchMessages(query, chatId, { page: 1, limit: 20 }),
    enabled: query.length >= 2,
    staleTime: 30000,
  });

  const handleSearch = async () => {
    if (query.trim().length < 2) {
      toast({
        title: "Search query too short",
        description: "Please enter at least 2 characters to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      await refetch();
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Failed to search messages",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      onClose?.();
    }
  };

  const handleMessageClick = (message: Message) => {
    onMessageSelect?.(message);
    onClose?.();
  };

  const formatMessagePreview = (content: string) => {
    if (content.length <= 100) return content;
    return content.substring(0, 100) + "...";
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case "image":
        return "🖼️";
      case "file":
        return "📎";
      case "voice":
        return "🎤";
      case "video":
        return "🎥";
      default:
        return "💬";
    }
  };

  return (
    <Card
      className={cn(
        "w-full max-w-2xl bg-background border shadow-lg",
        className,
      )}
    >
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Search Messages</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search messages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={query.length < 2 || isLoading}
            className="px-4"
          >
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>

        {query.length > 0 && query.length < 2 && (
          <p className="text-sm text-muted-foreground mt-2">
            Enter at least 2 characters to search
          </p>
        )}
      </div>

      <ScrollArea className="h-96">
        <div className="p-4">
          {error && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Failed to search messages</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4" />
                      <div className="h-3 bg-muted rounded w-3/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchResults?.data?.messages &&
            searchResults.data.messages.length > 0 && (
              <div className="space-y-3">
                {searchResults.data.messages.map((message) => {
                  const sender =
                    typeof message.sender === "object" ? message.sender : null;

                  return (
                    <div
                      key={message._id}
                      className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleMessageClick(message)}
                    >
                      <div className="flex items-start gap-3">
                        <UserAvatar
                          name={
                            sender
                              ? `${sender.firstName} ${sender.lastName}`
                              : "Unknown"
                          }
                          imageUrl={sender?.avatar}
                          className="w-8 h-8 shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {sender
                                ? `${sender.firstName} ${sender.lastName}`
                                : "Unknown"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(
                                new Date(message.createdAt),
                                { addSuffix: true },
                              )}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {getMessageIcon(message.type)}
                            </Badge>
                            {message.isEdited && (
                              <Badge variant="secondary" className="text-xs">
                                edited
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground">
                            {formatMessagePreview(message.content || "")}
                          </p>

                          {message.reactions &&
                            message.reactions.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {message.reactions.map((reaction, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {reaction.emoji} {reaction.users.length}
                                  </Badge>
                                ))}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          {searchResults?.data?.messages &&
            searchResults.data.messages.length === 0 &&
            query.length >= 2 && (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No messages found</p>
                <p className="text-sm text-muted-foreground">
                  Try different keywords or search in a specific chat
                </p>
              </div>
            )}

          {!query && !isLoading && (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Search for messages</p>
              <p className="text-sm text-muted-foreground">
                Enter keywords to find messages across your chats
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {searchResults?.data?.pagination &&
        searchResults.data.pagination.totalPages > 1 && (
          <div className="p-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {searchResults.data.messages.length} of{" "}
                {searchResults.data.pagination.total} results
              </span>
              <span>
                Page {searchResults.data.pagination.page} of{" "}
                {searchResults.data.pagination.totalPages}
              </span>
            </div>
          </div>
        )}
    </Card>
  );
}
