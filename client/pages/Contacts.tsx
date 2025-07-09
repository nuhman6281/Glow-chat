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
import { usersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { AddContactDialog } from "@/components/dialogs/AddContactDialog";
import { CreateGroupDialog } from "@/components/dialogs/CreateGroupDialog";
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

  // Get all users (for now, we'll use this as contacts)
  const { data: contactsData, isLoading: isLoadingContacts } = useQuery({
    queryKey: ["users", "all"],
    queryFn: () => usersApi.getAllUsers({ limit: 50 }),
  });

  // TODO: Implement friend requests API when available
  const friendRequests: any[] = [];

  // Accept friend request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      // TODO: Implement actual API call
      return Promise.resolve();
    },
    onSuccess: () => {
      toast({
        title: "Friend request accepted",
        description: "User has been added to your contacts",
      });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: () => {
      toast({
        title: "Failed to accept request",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  // Reject friend request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      // TODO: Implement actual API call
      return Promise.resolve();
    },
    onSuccess: () => {
      toast({
        title: "Friend request rejected",
        description: "Request has been declined",
      });
    },
    onError: () => {
      toast({
        title: "Failed to reject request",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleAcceptRequest = (requestId: string) => {
    acceptRequestMutation.mutate(requestId);
  };

  const handleRejectRequest = (requestId: string) => {
    rejectRequestMutation.mutate(requestId);
  };

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

  const contacts = contactsData?.data?.users || [];

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

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="requests">
            Friend Requests
            {friendRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {friendRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="search">Search Users</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>My Contacts ({filteredContacts.length})</CardTitle>
              <CardDescription>
                People you can chat and call with
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoadingContacts ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No contacts found</p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "Try adjusting your search"
                      : "Add some contacts to get started"}
                  </p>
                </div>
              ) : (
                filteredContacts.map((contact: any) => (
                  <div
                    key={contact._id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback>
                          {contact.firstName?.[0]}
                          {contact.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(contact.status)}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {contact.firstName} {contact.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        @{contact.username} •{" "}
                        {contact.status === "online"
                          ? "Online"
                          : contact.lastSeen
                            ? formatLastSeen(contact.lastSeen)
                            : "Unknown"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
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
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>Block User</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Remove Contact
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Friend Requests ({friendRequests.length})</CardTitle>
              <CardDescription>
                People who want to connect with you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {friendRequests.length === 0 ? (
                <div className="text-center py-8">
                  <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No pending friend requests
                  </p>
                </div>
              ) : (
                friendRequests.map((request) => (
                  <div
                    key={request._id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={request.from.avatar} />
                      <AvatarFallback>
                        {request.from.firstName?.[0]}
                        {request.from.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {request.from.firstName} {request.from.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{request.from.username} •{" "}
                        {request.createdAt
                          ? formatLastSeen(request.createdAt)
                          : "Unknown"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(request._id)}
                        disabled={acceptRequestMutation.isPending}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectRequest(request._id)}
                        disabled={rejectRequestMutation.isPending}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search for users by name or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>Find new people to connect with</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Search functionality coming soon
                </p>
                <p className="text-sm text-muted-foreground">
                  Use the "Add Contact" button to find and add new contacts
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
