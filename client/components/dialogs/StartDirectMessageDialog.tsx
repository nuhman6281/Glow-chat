import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Search, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, chatsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

interface StartDirectMessageDialogProps {
  children?: React.ReactNode;
  onChatSelect?: (chatId: string) => void;
}

export function StartDirectMessageDialog({
  children,
  onChatSelect,
}: StartDirectMessageDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Search users
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["users", "search", searchQuery],
    queryFn: () => usersApi.searchUsers(searchQuery),
    enabled: searchQuery.length >= 2,
    staleTime: 30000,
  });

  // Get existing chats to filter out users already in direct chats
  const { data: existingChatsResponse } = useQuery({
    queryKey: ["chats"],
    queryFn: () => chatsApi.getChats({ limit: 100 }),
    staleTime: 30000,
  });

  const existingDirectChatUserIds =
    existingChatsResponse?.data?.chats
      ?.filter((chat) => chat.type === "direct")
      .map((chat) => {
        const otherParticipant = chat.participants.find((p) => {
          const user = typeof p.user === "object" ? p.user : null;
          return user && user._id !== currentUser._id;
        });
        return typeof otherParticipant?.user === "object"
          ? otherParticipant.user._id
          : otherParticipant?.user;
      })
      .filter(Boolean) || [];

  const users =
    searchResults?.data?.users?.filter(
      (user) => !existingDirectChatUserIds.includes(user._id),
    ) || [];

  // Create or get existing direct chat mutation
  const createDirectChatMutation = useMutation({
    mutationFn: async (userId: string) => {
      // First, try to find an existing direct chat
      const existingChats = await chatsApi.getChats({ limit: 100 });
      const existingDirectChat = existingChats.data?.chats?.find(
        (chat) =>
          chat.type === "direct" &&
          chat.participants.some((p) => {
            const user = typeof p.user === "object" ? p.user : null;
            return user && user._id === userId;
          }),
      );

      if (existingDirectChat) {
        return { data: existingDirectChat };
      }

      // If no existing chat, create a new one
      return chatsApi.createChat({
        type: "direct",
        participants: [userId],
      });
    },
    onSuccess: (data) => {
      // Handle both response structures: { data: { chat: Chat } } and { data: Chat }
      const responseData = data.data;
      const chat =
        responseData &&
        typeof responseData === "object" &&
        "chat" in responseData
          ? (responseData as any).chat
          : responseData;

      if (chat) {
        toast({
          title: "Direct message started",
          description: "You can now start chatting",
        });
        queryClient.invalidateQueries({ queryKey: ["chats"] });
        setOpen(false);
        setSearchQuery("");

        // Navigate to the chat
        if (onChatSelect) {
          onChatSelect(chat._id);
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to start direct message",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleStartDirectMessage = (userId: string) => {
    createDirectChatMutation.mutate(userId);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon">
            <MessageSquare className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start Direct Message</DialogTitle>
          <DialogDescription>
            Search for users to start a new direct message conversation. Users
            you already have chats with are hidden.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="search"
                placeholder="Enter username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Search Results */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {searchQuery.length < 2 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Type at least 2 characters to search
              </p>
            ) : isSearching ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              ))
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {searchResults?.data?.users?.length === 0
                  ? "No users found"
                  : "All found users already have direct chats with you"}
              </p>
            ) : (
              users.map((user: any) => (
                <div
                  key={user._id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <UserAvatar
                    name={`${user.firstName} ${user.lastName}`}
                    imageUrl={user.avatar}
                    className="w-10 h-10"
                    showStatus={false}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{user.username}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleStartDirectMessage(user._id)}
                    disabled={createDirectChatMutation.isPending}
                  >
                    {createDirectChatMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Message
                      </>
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
