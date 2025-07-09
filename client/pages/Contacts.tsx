import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  UserPlus,
  Users,
  MessageCircle,
  Phone,
  Video,
  MoreHorizontal,
  Check,
  X,
  Clock,
  UserCheck,
  UserX,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, contactsApi, friendRequestsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { AddContactDialog } from "@/components/dialogs/AddContactDialog";
import { CreateGroupDialog } from "@/components/dialogs/CreateGroupDialog";
import { FriendRequests } from "@/components/contacts/FriendRequests";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

export default function Contacts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("contacts");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ["user", "me"],
    queryFn: () => usersApi.getMe(),
  });

  // Get contacts
  const { data: contactsData, isLoading: isLoadingContacts } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => contactsApi.getContacts({ limit: 50 }),
  });



  const handleStartChat = (userId: string) => {
    // TODO: Navigate to chat or create new chat
    toast({
      title: "Starting chat...",
      description: "Chat feature coming soon",
    });
  };

  const handleCall = (userId: string, type: "voice" | "video") => {
    // TODO: Implement calling
    toast({
      title: `${type === "voice" ? "Voice" : "Video"} call`,
      description: "Calling feature coming soon",
    });
  };

  const contacts = contactsData?.data?.contacts || [];

  const filteredContacts = contacts.filter(
    (contact: any) =>
      `${contact.firstName} ${contact.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      contact.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatLastSeen = (date: Date | string | null | undefined) => {
    // Handle null/undefined values
    if (!date) {
      return "Unknown";
    }

    // Ensure date is a Date object
    const dateObj = date instanceof Date ? date : new Date(date);

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return "Unknown";
    }

    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">
            Manage your contacts and friend requests
          </p>
        </div>
        <div className="flex gap-2">
          <AddContactDialog>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </AddContactDialog>
          <CreateGroupDialog>
            <Button variant="outline">
              <Users className="w-4 h-4 mr-2" />
              New Group
            </Button>
          </CreateGroupDialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Contacts ({contacts.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Friend Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Contacts List */}
          {isLoadingContacts ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="w-20 h-8" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredContacts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? "No contacts match your search"
                    : "Start by adding some contacts"}
                </p>
                {!searchQuery && (
                  <AddContactDialog>
                    <Button>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Contact
                    </Button>
                  </AddContactDialog>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredContacts.map((contact: any) => (
                <Card key={contact._id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={contact.avatar} />
                          <AvatarFallback>
                            {contact.firstName[0]}
                            {contact.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(
                            contact.status,
                          )}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {contact.firstName} {contact.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          @{contact.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {contact.status === "online"
                            ? "Online"
                            : `Last seen ${formatLastSeen(contact.lastSeen)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartChat(contact._id)}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCall(contact._id, "voice")}
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCall(contact._id, "video")}
                        >
                          <Video className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStartChat(contact._id)}>
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCall(contact._id, "voice")}>
                              <Phone className="w-4 h-4 mr-2" />
                              Voice Call
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCall(contact._id, "video")}>
                              <Video className="w-4 h-4 mr-2" />
                              Video Call
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <UserX className="w-4 h-4 mr-2" />
                              Remove Contact
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <FriendRequests />
        </TabsContent>
      </Tabs>
    </div>
  );
}
