import React, { useEffect, useRef, useState } from "react";
import {
  MoreHorizontal,
  Reply,
  Heart,
  Copy,
  Edit,
  Trash,
  Forward,
  Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/contexts/AuthContext";
import { Message, User } from "@shared/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { messagesApi } from "@/lib/api";
import { MessageReactions } from "./MessageReactions";
import { ForwardMessageDialog } from "./ForwardMessageDialog";
import { LoadMoreMessages } from "./LoadMoreMessages";
import { MessageStatus } from "./MessageStatus";
import { MessageFormatter } from "./MessageFormatter";
import { MessageTranslation } from "./MessageTranslation";
import { FilePreview } from "./FilePreview";
import { MessageReply } from "./MessageReply";

interface MessageListProps {
  chatId: string;
  onReplyToMessage?: (message: Message) => void;
}

export function MessageList({ chatId, onReplyToMessage }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [translatedMessage, setTranslatedMessage] = useState<string | null>(
    null,
  );
  const [previewFile, setPreviewFile] = useState<any>(null);
  const { user: currentUser, token } = useAuth();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket({
    token: token || "",
    enabled: !!token,
  });
  const { toast } = useToast();

  // Fetch messages from API
  const {
    data: messagesResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["messages", chatId, currentPage],
    queryFn: () =>
      messagesApi.getMessages(chatId, { page: currentPage, limit: 50 }),
    enabled: !!chatId,
    staleTime: 30000, // 30 seconds
  });

  const messagesFromApi = messagesResponse?.data?.messages || [];
  const pagination = messagesResponse?.data?.pagination;

  // Update hasMore based on pagination
  useEffect(() => {
    if (pagination) {
      setHasMore(currentPage < pagination.totalPages);
    }
  }, [pagination, currentPage]);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesFromApi.length]);

  // Listen for new messages via Socket.IO
  useEffect(() => {
    if (!socket || !chatId) return;

    const handleNewMessage = (message: Message) => {
      if (message.chat === chatId) {
        queryClient.setQueryData(["messages", chatId, 1], (oldData: any) => {
          if (!oldData) return oldData;
          const existing = (oldData.data.messages || []).some(
            (m: Message) => m._id === message._id,
          );
          if (existing) return oldData;
          return {
            ...oldData,
            data: {
              ...oldData.data,
              messages: [...(oldData.data.messages || []), message],
            },
          };
        });
        scrollToBottom();
      }
    };

    const handleMessageRead = (data: {
      chatId: string;
      messageIds: string[];
      readBy: string;
    }) => {
      if (data.chatId === chatId) {
        queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("messages_read", handleMessageRead);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("messages_read", handleMessageRead);
    };
  }, [socket, chatId, queryClient]);

  const formatTimestamp = (date: string | Date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - messageDate.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return messageDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      // TODO: Implement message reactions API
      toast({
        title: "Reactions",
        description: "Message reactions coming soon!",
      });
    } catch (error) {
      toast({
        title: "Failed to add reaction",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      // TODO: Implement message deletion API
      toast({
        title: "Delete message",
        description: "Message deletion coming soon!",
      });
    } catch (error) {
      toast({
        title: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const MessageItem = ({ message }: { message: Message }) => {
    const sender = typeof message.sender === "object" ? message.sender : null;
    const isOwn = currentUser && sender && sender._id === currentUser._id;

    return (
      <div
        className={cn(
          "flex gap-3 p-3 hover:bg-muted/30 transition-colors",
          isOwn && "flex-row-reverse",
        )}
      >
        {/* Avatar */}
        <UserAvatar
          name={sender ? `${sender.firstName} ${sender.lastName}` : "Unknown"}
          imageUrl={sender?.avatar}
          className="w-8 h-8 shrink-0"
          showStatus={false}
        />

        {/* Message Content */}
        <div className={cn("flex-1 min-w-0", isOwn && "items-end")}>
          {/* Sender and timestamp */}
          <div
            className={cn(
              "flex items-center gap-2 mb-1",
              isOwn && "flex-row-reverse",
            )}
          >
            <span className="font-medium text-sm">
              {isOwn
                ? "You"
                : sender
                  ? `${sender.firstName} ${sender.lastName}`
                  : "Unknown"}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(message.createdAt)}
            </span>
            {message.isEdited && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
            {isOwn && (
              <MessageStatus
                status={
                  message.readBy && message.readBy.length > 0 ? "read" : "sent"
                }
                className="ml-1"
              />
            )}
          </div>

          {/* Reply indicator */}
          {message.replyTo && (
            <div className="mb-2">
              <MessageReply replyTo={message.replyTo} />
            </div>
          )}

          {/* Message content */}
          <div className={cn("group relative", isOwn && "flex justify-end")}>
            <div
              className={cn(
                "max-w-md rounded-lg px-3 py-2 text-sm break-words",
                isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              {message.type === "text" && message.content && (
                <MessageFormatter
                  content={message.content}
                  onMentionClick={(username) => {
                    toast({
                      title: "Mention clicked",
                      description: `You clicked on @${username}`,
                    });
                    // TODO: Navigate to user profile or start DM
                  }}
                  onHashtagClick={(hashtag) => {
                    toast({
                      title: "Hashtag clicked",
                      description: `You clicked on #${hashtag}`,
                    });
                    // TODO: Search for messages with this hashtag
                  }}
                  enableEmojis={true}
                  enableAutoLinks={true}
                  enableMentions={true}
                  enableHashtags={true}
                  maxPreviewLines={10}
                />
              )}

              {message.type === "image" && message.file && (
                <div className="space-y-2">
                  <img
                    src={message.file.url}
                    alt={message.file.name}
                    className="max-w-full h-auto rounded cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setPreviewFile(message.file)}
                  />
                  {message.content && (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>
              )}

              {message.type === "file" && message.file && (
                <div className="flex items-center gap-2 p-2 bg-background/10 rounded">
                  <div className="flex-1">
                    <p className="font-medium">{message.file.name}</p>
                    <p className="text-xs opacity-75">
                      {(message.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPreviewFile(message.file)}
                  >
                    Preview
                  </Button>
                  <Button size="sm" variant="outline">
                    Download
                  </Button>
                </div>
              )}

              {message.type === "voice" && message.file && (
                <div className="flex items-center gap-2 p-2">
                  <Button size="sm" variant="secondary">
                    ▶️ Play
                  </Button>
                  <span className="text-xs">
                    {message.file.duration
                      ? `${message.file.duration}s`
                      : "Voice message"}
                  </span>
                </div>
              )}
            </div>

            {/* Message actions */}
            <div
              className={cn(
                "absolute -top-2 opacity-0 group-hover:opacity-100 transition-opacity",
                isOwn ? "left-0" : "right-0",
              )}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-6 h-6">
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleReaction(message._id, "👍")}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Add Reaction
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onReplyToMessage?.(message)}>
                    <Reply className="w-4 h-4 mr-2" />
                    Reply
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setForwardMessage(message)}>
                    <Forward className="w-4 h-4 mr-2" />
                    Forward
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      navigator.clipboard.writeText(message.content || "")
                    }
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTranslatedMessage(message.content || "")}
                  >
                    <Languages className="w-4 h-4 mr-2" />
                    Translate
                  </DropdownMenuItem>
                  {isOwn && (
                    <>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteMessage(message._id)}
                        className="text-destructive"
                      >
                        <Trash className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Reactions */}
          <div className="mt-1">
            <MessageReactions
              messageId={message._id}
              reactions={message.reactions || []}
              onReactionUpdate={() => {
                queryClient.invalidateQueries({
                  queryKey: ["messages", chatId],
                });
              }}
            />
          </div>

          {/* Reply indicator */}
          {message.replyTo && (
            <div className="mt-1 p-2 bg-muted/50 rounded text-xs">
              <p className="text-muted-foreground">
                Replying to:{" "}
                {typeof message.replyTo.content === "string"
                  ? message.replyTo.content.slice(0, 50) + "..."
                  : "Message"}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const MessageSkeleton = () => (
    <div className="flex gap-3 p-3">
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-16 w-64 rounded-lg" />
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load messages</p>
          <Button
            variant="outline"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["messages", chatId] })
            }
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">
          Select a chat to start messaging
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Load More Button */}
      <LoadMoreMessages
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
      />

      {/* Messages */}
      <div className="space-y-1">
        {isLoading && currentPage === 1 ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, i) => <MessageSkeleton key={i} />)
        ) : messagesFromApi.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <p className="text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messagesFromApi.map((message) => (
            <MessageItem key={message._id} message={message} />
          ))
        )}
      </div>

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />

      {/* Forward Message Dialog */}
      <ForwardMessageDialog
        isOpen={!!forwardMessage}
        onClose={() => setForwardMessage(null)}
        message={forwardMessage}
      />

      {/* Translation Dialog */}
      {translatedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <MessageTranslation
              originalText={translatedMessage}
              onClose={() => setTranslatedMessage(null)}
            />
          </div>
        </div>
      )}

      {/* File Preview Dialog */}
      {previewFile && (
        <FilePreview
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          file={previewFile}
        />
      )}
    </div>
  );
}
