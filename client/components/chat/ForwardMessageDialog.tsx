import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { X, Search, Send } from "lucide-react";
import { Message, Chat, User } from "@shared/api";
import { chatsApi, messagesApi } from "../../lib/api";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";

interface ForwardMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message | null;
}

export const ForwardMessageDialog: React.FC<ForwardMessageDialogProps> = ({
  isOpen,
  onClose,
  message,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [isForwarding, setIsForwarding] = useState(false);
  const { user } = useAuth();

  const { data: chatsResponse } = useQuery({
    queryKey: ["chats"],
    queryFn: () => chatsApi.getChats(),
    enabled: isOpen,
  });

  const chats = chatsResponse?.data?.chats || [];

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true;

    if (chat.type === "direct" && chat.participants) {
      const otherParticipant = chat.participants.find(
        (p) => typeof p.user === "object" && p.user._id !== user?._id,
      );
      if (otherParticipant && typeof otherParticipant.user === "object") {
        const name = `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`;
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      }
    }

    if (chat.type === "group" && chat.name) {
      return chat.name.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return false;
  });

  const handleChatToggle = (chatId: string) => {
    setSelectedChats((prev) =>
      prev.includes(chatId)
        ? prev.filter((id) => id !== chatId)
        : [...prev, chatId],
    );
  };

  const handleForward = async () => {
    if (!message || selectedChats.length === 0) return;

    setIsForwarding(true);
    try {
      const forwardPromises = selectedChats.map((chatId) =>
        messagesApi.sendMessage({
          chatId,
          content: message.content || "",
          type: "text" as const,
          replyTo: undefined, // Don't forward reply context
        }),
      );

      await Promise.all(forwardPromises);

      toast.success(
        `Message forwarded to ${selectedChats.length} chat${selectedChats.length > 1 ? "s" : ""}`,
      );
      onClose();
      setSelectedChats([]);
    } catch (error) {
      toast.error("Failed to forward message");
    } finally {
      setIsForwarding(false);
    }
  };

  const getChatName = (chat: Chat) => {
    if (chat.type === "group") {
      return chat.name;
    }

    if (chat.type === "direct" && chat.participants) {
      const otherParticipant = chat.participants.find(
        (p) => typeof p.user === "object" && p.user._id !== user?._id,
      );
      if (otherParticipant && typeof otherParticipant.user === "object") {
        return `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`;
      }
    }

    return "Unknown";
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === "group") {
      return chat.avatar || undefined;
    }

    if (chat.type === "direct" && chat.participants) {
      const otherParticipant = chat.participants.find(
        (p) => typeof p.user === "object" && p.user._id !== user?._id,
      );
      if (otherParticipant && typeof otherParticipant.user === "object") {
        return otherParticipant.user.avatar;
      }
    }

    return undefined;
  };

  if (!message) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Forward Message</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Original message preview */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Original message:</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {message.content || "No content"}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {message.type}
              </Badge>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Chat list */}
          <div className="max-h-60 overflow-y-auto space-y-2">
            {filteredChats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No chats found
              </p>
            ) : (
              filteredChats.map((chat) => {
                const isSelected = selectedChats.includes(chat._id);
                return (
                  <div
                    key={chat._id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleChatToggle(chat._id)}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                      {getChatAvatar(chat) ? (
                        <img
                          src={getChatAvatar(chat)}
                          alt={getChatName(chat)}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getChatName(chat).charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {getChatName(chat)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {chat.type === "group" ? "Group" : "Direct message"}
                      </p>
                    </div>
                    {isSelected && (
                      <Badge variant="default" className="shrink-0">
                        Selected
                      </Badge>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedChats.length} chat{selectedChats.length !== 1 ? "s" : ""}{" "}
              selected
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleForward}
                disabled={selectedChats.length === 0 || isForwarding}
              >
                {isForwarding ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Forward
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
