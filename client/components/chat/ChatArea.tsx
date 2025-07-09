import { useState } from "react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Button } from "@/components/ui/button";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { MessageSearch } from "./MessageSearch";
import {
  Phone,
  Video,
  Info,
  Search,
  Star,
  Users,
  Download,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Message } from "@shared/api";
import { MessageExport } from "./MessageExport";

interface ChatAreaProps {
  chatId?: string;
  chatName?: string;
  chatType?: "direct" | "group" | "channel";
  participants?: number;
  isOnline?: boolean;
}

export function ChatArea({
  chatId,
  chatName = "Chat",
  chatType = "direct",
  participants = 1,
  isOnline = true,
}: ChatAreaProps) {
  const queryClient = useQueryClient();
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const handleRefreshMessages = () => {
    // Invalidate and refetch messages for the current chat
    if (chatId) {
      queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
    }
    // Also invalidate chats to update last message
    queryClient.invalidateQueries({ queryKey: ["chats"] });
  };

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Welcome to GlowChat</h3>
          <p className="text-muted-foreground">
            Select a conversation to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <UserAvatar
            name={chatName}
            status={
              chatType === "direct"
                ? isOnline
                  ? "online"
                  : "offline"
                : undefined
            }
            className="w-8 h-8 md:w-10 md:h-10 shrink-0"
          />
          <div className="min-w-0">
            <h2 className="font-semibold text-sm md:text-base truncate">
              {chatName}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              {chatType === "direct"
                ? isOnline
                  ? "Online"
                  : "Last seen recently"
                : `${participants} members`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:h-10 md:w-10"
          >
            <Phone className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:h-10 md:w-10"
          >
            <Video className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:h-10 md:w-10 hidden sm:flex"
            onClick={() => setIsSearching(true)}
          >
            <Search className="w-4 h-4" />
          </Button>
          {chatType !== "direct" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:h-10 md:w-10 hidden md:flex"
            >
              <Users className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:h-10 md:w-10"
            onClick={() => setShowExportDialog(true)}
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:h-10 md:w-10"
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Message Search */}
      {isSearching && (
        <MessageSearch
          chatId={chatId}
          onClose={() => setIsSearching(false)}
          onSelectMessage={(message) => {
            // TODO: Scroll to message
            setIsSearching(false);
          }}
        />
      )}

      {/* Messages */}
      <MessageList
        chatId={chatId}
        onReplyToMessage={(message) => setReplyTo(message)}
      />

      {/* Message Input */}
      <MessageInput
        chatId={chatId}
        onMessageSent={handleRefreshMessages}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />

      {/* Export Dialog */}
      <MessageExport
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        messages={[]} // TODO: Get messages from MessageList
        chatName={chatName}
      />
    </div>
  );
}
