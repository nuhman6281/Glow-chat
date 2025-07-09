import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Send, X, MessageSquare, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Message, Chat } from "@shared/api";
import { messagesApi, chatsApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface MessageForwardDialogProps {
  message: Message;
  onClose: () => void;
  onForward?: (targetChatIds: string[]) => void;
  className?: string;
}

export function MessageForwardDialog({
  message,
  onClose,
  onForward,
  className,
}: MessageForwardDialogProps) {
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isForwarding, setIsForwarding] = useState(false);
  const { toast } = useToast();

  // Get user's chats
  const { data: chatsResponse, isLoading: isLoadingChats } = useQuery({
    queryKey: ["chats"],
    queryFn: () => chatsApi.getChats({ page: 1, limit: 100 }),
    staleTime: 30000,
  });

  const chats = chatsResponse?.data?.chats || [];

  // Filter chats based on search query
  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    if (chat.name && chat.name.toLowerCase().includes(searchLower)) return true;

    // Search in participant names
    if (chat.participants) {
      return chat.participants.some((participant) => {
        const user =
          typeof participant.user === "object" ? participant.user : null;
        if (user) {
          const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
          return fullName.includes(searchLower);
        }
        return false;
      });
    }

    return false;
  });

  const handleChatToggle = (chatId: string) => {
    setSelectedChats((prev) => {
      if (prev.includes(chatId)) {
        return prev.filter((id) => id !== chatId);
      } else {
        return [...prev, chatId];
      }
    });
  };

  const handleForward = async () => {
    if (selectedChats.length === 0) {
      toast({
        title: "No chats selected",
        description: "Please select at least one chat to forward the message",
        variant: "destructive",
      });
      return;
    }

    setIsForwarding(true);
    try {
      const response = await messagesApi.forwardMessage(
        message._id,
        selectedChats,
      );

      if (response.success) {
        toast({
          title: "Message forwarded",
          description: `Message forwarded to ${selectedChats.length} chat${selectedChats.length > 1 ? "s" : ""}`,
        });
        onForward?.(selectedChats);
        onClose();
      } else {
        toast({
          title: "Forward failed",
          description: response.message || "Failed to forward message",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Forward failed",
        description: "An error occurred while forwarding the message",
        variant: "destructive",
      });
    } finally {
      setIsForwarding(false);
    }
  };

  const formatMessagePreview = (content: string) => {
    if (!content) return "No content";
    if (content.length <= 50) return content;
    return content.substring(0, 50) + "...";
  };

  const getChatDisplayName = (chat: Chat) => {
    if (chat.name) return chat.name;

    if (chat.type === "direct" && chat.participants) {
      const otherParticipant = chat.participants.find(
        (p) => typeof p.user === "object" && p.user,
      );
      if (otherParticipant && typeof otherParticipant.user === "object") {
        return `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`;
      }
    }

    return "Unnamed Chat";
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.avatar) return chat.avatar;

    if (chat.type === "direct" && chat.participants) {
      const otherParticipant = chat.participants.find(
        (p) => typeof p.user === "object" && p.user,
      );
      if (otherParticipant && typeof otherParticipant.user === "object") {
        return otherParticipant.user.avatar;
      }
    }

    return undefined;
  };

  return (
    <Card
      className={cn(
        "w-full max-w-md bg-background border shadow-lg",
        className,
      )}
    >
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Forward Message</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Message Preview */}
        <div className="p-3 bg-muted/30 rounded-lg mb-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                {formatMessagePreview(message.content || "")}
              </p>
              {message.type !== "text" && (
                <Badge variant="outline" className="text-xs mt-1">
                  {message.type}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="h-64">
        <div className="p-4">
          {isLoadingChats ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-3/4" />
                    </div>
                    <div className="w-4 h-4 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredChats.length > 0 ? (
            <div className="space-y-2">
              {filteredChats.map((chat) => (
                <div
                  key={chat._id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleChatToggle(chat._id)}
                >
                  <Checkbox
                    checked={selectedChats.includes(chat._id)}
                    onChange={() => handleChatToggle(chat._id)}
                    className="shrink-0"
                  />

                  <UserAvatar
                    name={getChatDisplayName(chat)}
                    imageUrl={getChatAvatar(chat)}
                    className="w-8 h-8 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {getChatDisplayName(chat)}
                      </span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {chat.type}
                      </Badge>
                    </div>

                    {chat.type === "group" && chat.participants && (
                      <p className="text-xs text-muted-foreground">
                        {chat.participants.length} member
                        {chat.participants.length !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No chats found</p>
              {searchQuery && (
                <p className="text-sm text-muted-foreground">
                  Try a different search term
                </p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            {selectedChats.length} chat{selectedChats.length !== 1 ? "s" : ""}{" "}
            selected
          </span>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleForward}
            disabled={selectedChats.length === 0 || isForwarding}
            className="flex-1"
          >
            <Send className="h-4 w-4 mr-2" />
            {isForwarding ? "Forwarding..." : "Forward"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
