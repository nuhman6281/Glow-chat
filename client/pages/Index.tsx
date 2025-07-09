import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import { AddContactDialog } from "@/components/dialogs/AddContactDialog";
import { CreateGroupDialog } from "@/components/dialogs/CreateGroupDialog";
import { GroupManagementDialog } from "@/components/dialogs/GroupManagementDialog";
import { useQuery } from "@tanstack/react-query";
import { chatsApi } from "@/lib/api";
import { Chat } from "@shared/api";
import { useAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import { UserPlus, Users, Settings } from "lucide-react";

export default function Index() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  // Fetch chats from API
  const { data: chatsResponse } = useQuery({
    queryKey: ["chats"],
    queryFn: () => chatsApi.getChats({ limit: 50 }),
    staleTime: 30000, // 30 seconds
  });

  const chats = chatsResponse?.data?.chats || [];

  const selectedChat = selectedChatId
    ? { data: chats.find((chat: Chat) => chat._id === selectedChatId) }
    : null;

  const getChatName = (chat: Chat) => {
    if (!chat) return undefined;
    if (chat.type === "direct") {
      const otherParticipant = chat.participants?.find(
        (p) => typeof p.user === "object" && p.user._id !== currentUser?._id,
      );
      const user =
        typeof otherParticipant?.user === "object"
          ? otherParticipant.user
          : null;
      return user ? `${user.firstName} ${user.lastName}` : "Unknown User";
    }
    return chat.name || "Group Chat";
  };

  return (
    <AppLayout
      sidebar={
        <div className="flex flex-col h-full">
          {/* Action Buttons */}
          <div className="flex items-center gap-2 p-4 border-b">
            <AddContactDialog>
              <Button variant="ghost" size="icon" className="flex-1">
                <UserPlus className="w-4 h-4" />
              </Button>
            </AddContactDialog>
            <CreateGroupDialog>
              <Button variant="ghost" size="icon" className="flex-1">
                <Users className="w-4 h-4" />
              </Button>
            </CreateGroupDialog>
          </div>

          {/* Chat Sidebar */}
          <div className="flex-1 overflow-hidden">
            <ChatSidebar
              selectedChatId={selectedChatId}
              onChatSelect={setSelectedChatId}
            />
          </div>
        </div>
      }
      showCallButtons={!!selectedChatId}
    >
      <div className="flex flex-col h-full">
        {/* Chat Header with Group Management */}
        {selectedChatId && selectedChat?.data?.type === "group" && (
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex-1">
              <h2 className="font-semibold">
                {getChatName(selectedChat?.data)}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedChat?.data?.participants?.length} participants
              </p>
            </div>
            <GroupManagementDialog chatId={selectedChatId}>
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </GroupManagementDialog>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden">
          <ChatArea
            chatId={selectedChatId || undefined}
            chatName={getChatName(selectedChat?.data)}
            chatType={selectedChat?.data?.type}
            participants={selectedChat?.data?.participants?.length}
            isOnline={true} // TODO: Get actual online status
          />
        </div>
      </div>
    </AppLayout>
  );
}
