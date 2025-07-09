import { useState } from "react";
import {
  Plus,
  Hash,
  MessageCircle,
  Users,
  Search,
  Filter,
  UserPlus,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { chatsApi } from "@/lib/api";
import { Chat, User } from "@shared/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddContactDialog } from "@/components/dialogs/AddContactDialog";
import { CreateGroupDialog } from "@/components/dialogs/CreateGroupDialog";
import { StartDirectMessageDialog } from "../dialogs/StartDirectMessageDialog";
import { useAuth } from "@/contexts/AuthContext";

interface ChatSidebarProps {
  selectedChatId?: string | null;
  onChatSelect?: (chatId: string) => void;
}

export function ChatSidebar({
  selectedChatId,
  onChatSelect,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Fetch chats from API
  const {
    data: chatsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["chats"],
    queryFn: () => chatsApi.getChats({ limit: 50 }),
    staleTime: 30000, // 30 seconds
  });

  const chats = chatsResponse?.data?.chats || [];

  const formatTimestamp = (date: string | Date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - messageDate.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return messageDate.toLocaleDateString();
  };

  const getOtherParticipant = (chat: Chat): User | null => {
    if (chat.type !== "direct") return null;

    const participant = chat.participants.find((p) => {
      const user = p.user;
      // Compare with the actual current user's ID
      return typeof user === "object" && user._id !== currentUser?._id;
    });

    return participant && typeof participant.user === "object"
      ? participant.user
      : null;
  };

  const getChatName = (chat: Chat) => {
    if (chat.type === "direct") {
      const otherUser = getOtherParticipant(chat);
      return otherUser
        ? `${otherUser.firstName} ${otherUser.lastName}`
        : "Unknown User";
    }
    return chat.name || "Group Chat";
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === "direct") {
      const otherUser = getOtherParticipant(chat);
      return otherUser?.avatar;
    }
    return chat.avatar;
  };

  const getLastMessage = (chat: Chat) => {
    if (!chat.lastMessage) return "No messages yet";
    const msg = typeof chat.lastMessage === "object" ? chat.lastMessage : null;
    if (!msg) return "No messages yet";

    const sender = typeof msg.sender === "object" ? msg.sender : null;
    const senderName = sender?.firstName || "Someone";
    const content = msg.content || `[${msg.type}]`;

    return chat.type === "group" ? `${senderName}: ${content}` : content;
  };

  // Filter chats after all helper functions are defined
  const filteredChats = chats.filter((chat: Chat) => {
    const chatName =
      chat.type === "direct"
        ? getOtherParticipant(chat)?.firstName || "Unknown"
        : chat.name || "Group Chat";
    return chatName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const directMessages = filteredChats.filter(
    (chat: Chat) => chat.type === "direct",
  );
  const groupChats = filteredChats.filter(
    (chat: Chat) => chat.type === "group",
  );

  const ChatItem = ({ chat }: { chat: Chat }) => (
    <div
      key={chat._id}
      onClick={() => onChatSelect?.(chat._id)}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
        "hover:bg-sidebar-accent",
        selectedChatId === chat._id && "bg-sidebar-accent",
      )}
    >
      <div className="relative">
        {chat.type === "direct" ? (
          <UserAvatar
            name={getChatName(chat)}
            imageUrl={getChatAvatar(chat)}
            className="w-10 h-10"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-sm truncate">
            {getChatName(chat)}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(chat.lastActivity)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {getLastMessage(chat)}
        </p>
      </div>

      {chat.unreadCount && chat.unreadCount > 0 && (
        <div className="bg-primary text-primary-foreground text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
          {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
        </div>
      )}
    </div>
  );

  const ChatSkeleton = () => (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="text-center py-8">
            <p className="text-destructive">Failed to load chats</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                // Use useQueryClient to invalidate the query
                queryClient.invalidateQueries({ queryKey: ["chats"] });
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Chats</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <Plus className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <AddContactDialog>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Contact
                </DropdownMenuItem>
              </AddContactDialog>
              <CreateGroupDialog>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Users className="w-4 h-4 mr-2" />
                  New Group
                </DropdownMenuItem>
              </CreateGroupDialog>
              <StartDirectMessageDialog onChatSelect={onChatSelect}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  New Chat
                </DropdownMenuItem>
              </StartDirectMessageDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="all" className="h-full flex flex-col">
          <TabsList className="grid grid-cols-3 m-3 md:m-4 mb-2">
            <TabsTrigger value="all" className="text-xs px-2">
              All
            </TabsTrigger>
            <TabsTrigger value="direct" className="text-xs px-2">
              DMs
            </TabsTrigger>
            <TabsTrigger value="groups" className="text-xs px-2">
              Groups
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-3 md:px-4 pb-3 md:pb-4">
            <TabsContent value="all" className="mt-0 space-y-1">
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <ChatSkeleton key={i} />
                ))
              ) : filteredChats.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {searchQuery ? "No chats found" : "No conversations yet"}
                  </p>
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <ChatItem key={chat._id} chat={chat} />
                ))
              )}
            </TabsContent>

            <TabsContent value="direct" className="mt-0 space-y-1">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">
                  Direct Messages
                </span>
                <StartDirectMessageDialog onChatSelect={onChatSelect}>
                  <Button variant="ghost" size="icon" className="w-6 h-6">
                    <Plus className="w-4 h-4" />
                  </Button>
                </StartDirectMessageDialog>
              </div>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <ChatSkeleton key={i} />
                ))
              ) : directMessages.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    No direct messages
                  </p>
                </div>
              ) : (
                directMessages.map((chat) => (
                  <ChatItem key={chat._id} chat={chat} />
                ))
              )}
            </TabsContent>

            <TabsContent value="groups" className="mt-0 space-y-1">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">
                  Group Chats
                </span>
                <CreateGroupDialog>
                  <Button variant="ghost" size="icon" className="w-6 h-6">
                    <Plus className="w-4 h-4" />
                  </Button>
                </CreateGroupDialog>
              </div>
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <ChatSkeleton key={i} />
                ))
              ) : groupChats.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    No group chats
                  </p>
                </div>
              ) : (
                groupChats.map((chat) => (
                  <ChatItem key={chat._id} chat={chat} />
                ))
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
