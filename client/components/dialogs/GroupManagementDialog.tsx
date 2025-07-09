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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Settings,
  Users,
  Crown,
  Shield,
  User,
  UserX,
  Search,
  Edit,
  Save,
  X,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatsApi, usersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface GroupManagementDialogProps {
  chatId: string;
  children?: React.ReactNode;
}

interface Participant {
  user:
    | string
    | {
        _id: string;
        firstName: string;
        lastName: string;
        username: string;
        avatar?: string;
        status: string;
      };
  role: "admin" | "member";
  joinedAt: Date;
  lastReadMessage?: string;
}

export function GroupManagementDialog({
  chatId,
  children,
}: GroupManagementDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("participants");
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get chat details
  const { data: chatData, isLoading: isLoadingChat } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => chatsApi.getChatById(chatId),
    enabled: !!chatId,
  });

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ["user", "me"],
    queryFn: () => usersApi.getMe(),
  });

  // Search users for adding to group
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["users", "search", searchQuery],
    queryFn: () => usersApi.searchUsers(searchQuery),
    enabled: searchQuery.length >= 2,
    staleTime: 30000,
  });

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: (updateData: { name?: string; description?: string }) =>
      chatsApi.updateChat(chatId, updateData),
    onSuccess: () => {
      toast({
        title: "Group updated",
        description: "Group settings have been saved",
      });
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update group",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Add participants mutation
  const addParticipantsMutation = useMutation({
    mutationFn: (userIds: string[]) =>
      chatsApi.addParticipants(chatId, userIds),
    onSuccess: () => {
      toast({
        title: "Participants added",
        description: "Users have been added to the group",
      });
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
      setSearchQuery("");
      setSelectedUsers([]);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add participants",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Remove participant mutation
  const removeParticipantMutation = useMutation({
    mutationFn: (userId: string) => chatsApi.removeParticipant(chatId, userId),
    onSuccess: () => {
      toast({
        title: "Participant removed",
        description: "User has been removed from the group",
      });
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove participant",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      chatsApi.updateParticipantRole(chatId, userId, role),
    onSuccess: () => {
      toast({
        title: "Role updated",
        description: "User role has been changed",
      });
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update role",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSaveGroup = () => {
    updateGroupMutation.mutate({
      name: groupName,
      description: groupDescription,
    });
  };

  const handleAddParticipants = () => {
    if (selectedUsers.length === 0) return;
    addParticipantsMutation.mutate(selectedUsers.map((u) => u._id));
  };

  const handleRemoveParticipant = (userId: string) => {
    removeParticipantMutation.mutate(userId);
  };

  const handleUpdateRole = (userId: string, role: string) => {
    updateRoleMutation.mutate({ userId, role });
  };

  const chat = chatData?.data;
  const participants = chat?.participants || [];
  const currentUserRole = participants.find(
    (p: any) =>
      typeof p.user === "object" && p.user._id === currentUser?.data?._id,
  )?.role;
  const isAdmin = currentUserRole === "admin";
  const isModerator = currentUserRole === "admin"; // Only admin for now

  const users = searchResults?.data?.users || [];
  const existingParticipantIds = participants.map((p: any) =>
    typeof p.user === "object" ? p.user._id : p.user,
  );
  const filteredUsers = users.filter(
    (user: any) =>
      !existingParticipantIds.includes(user._id) &&
      !selectedUsers.find((s) => s._id === user._id),
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "moderator":
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "moderator":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoadingChat) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children || (
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p>Loading group settings...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Group Settings</DialogTitle>
          <DialogDescription>
            Manage group participants, roles, and settings
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="participants" className="space-y-4 mt-4">
              {/* Add Participants */}
              <div className="space-y-2">
                <Label>Add Participants</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search users to add..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Search Results */}
                {searchQuery.length >= 2 && (
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                    {isSearching ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        Searching...
                      </p>
                    ) : filteredUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No users found
                      </p>
                    ) : (
                      filteredUsers.map((user: any) => (
                        <div
                          key={user._id}
                          className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => {
                            if (
                              !selectedUsers.find((s) => s._id === user._id)
                            ) {
                              setSelectedUsers([...selectedUsers, user]);
                            }
                          }}
                        >
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="text-xs">
                              {user.firstName?.[0]}
                              {user.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              @{user.username}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Selected Users */}
                {selectedUsers.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Users ({selectedUsers.length})</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map((user) => (
                        <Badge
                          key={user._id}
                          variant="secondary"
                          className="pl-2 pr-1 py-1 flex items-center gap-2"
                        >
                          <Avatar className="w-4 h-4">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="text-xs">
                              {user.firstName?.[0]}
                              {user.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs">
                            {user.firstName} {user.lastName}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-3 h-3 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() =>
                              setSelectedUsers(
                                selectedUsers.filter((u) => u._id !== user._id),
                              )
                            }
                          >
                            <X className="w-2 h-2" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      onClick={handleAddParticipants}
                      disabled={addParticipantsMutation.isPending}
                    >
                      {addParticipantsMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      Add to Group
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Current Participants */}
              <div className="space-y-2">
                <Label>Current Participants ({participants.length})</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {participants.map((participant: Participant) => (
                    <div
                      key={participant._id}
                      className="flex items-center gap-3 p-2 rounded border"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={participant.user.avatar} />
                        <AvatarFallback>
                          {participant.user.firstName?.[0]}
                          {participant.user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {participant.user.firstName}{" "}
                            {participant.user.lastName}
                          </p>
                          {getRoleIcon(participant.role)}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          @{participant.user.username}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isModerator &&
                          participant.user._id !== currentUser?.data?._id && (
                            <>
                              <Select
                                value={participant.role}
                                onValueChange={(role) =>
                                  handleUpdateRole(participant.user._id, role)
                                }
                                disabled={
                                  !isAdmin || updateRoleMutation.isPending
                                }
                              >
                                <SelectTrigger className="w-24 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {isAdmin && (
                                    <SelectItem value="admin">Admin</SelectItem>
                                  )}
                                  <SelectItem value="moderator">
                                    Moderator
                                  </SelectItem>
                                  <SelectItem value="member">Member</SelectItem>
                                </SelectContent>
                              </Select>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    View Profile
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() =>
                                      handleRemoveParticipant(
                                        participant.user._id,
                                      )
                                    }
                                  >
                                    Remove from Group
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="groupName">Group Name</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? (
                        <Save className="w-4 h-4" />
                      ) : (
                        <Edit className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <Input
                    id="groupName"
                    value={groupName || chat?.name || ""}
                    onChange={(e) => setGroupName(e.target.value)}
                    disabled={!isEditing}
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="groupDescription">Description</Label>
                  <Textarea
                    id="groupDescription"
                    value={groupDescription || chat?.description || ""}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    disabled={!isEditing}
                    maxLength={500}
                    rows={3}
                  />
                </div>

                {isEditing && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveGroup}
                      disabled={updateGroupMutation.isPending}
                    >
                      {updateGroupMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Group Permissions</Label>
                  <p className="text-sm text-muted-foreground">
                    Configure what members can do in this group
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Send Messages</p>
                      <p className="text-sm text-muted-foreground">
                        Allow members to send text messages
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Send Media</p>
                      <p className="text-sm text-muted-foreground">
                        Allow members to send images and files
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Edit Messages</p>
                      <p className="text-sm text-muted-foreground">
                        Allow members to edit their messages
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Delete Messages</p>
                      <p className="text-sm text-muted-foreground">
                        Allow members to delete their messages
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Add Participants</p>
                      <p className="text-sm text-muted-foreground">
                        Allow moderators to add new members
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Remove Participants</p>
                      <p className="text-sm text-muted-foreground">
                        Allow moderators to remove members
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
