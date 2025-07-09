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
import { Users, Search, X, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatsApi, usersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface CreateGroupDialogProps {
  children?: React.ReactNode;
}

export function CreateGroupDialog({ children }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<any[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search users for participants
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["users", "search", searchQuery],
    queryFn: () => usersApi.searchUsers(searchQuery),
    enabled: searchQuery.length >= 2,
    staleTime: 30000,
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: (groupData: {
      name: string;
      description?: string;
      participants: string[];
      type: "group";
    }) => chatsApi.createChat(groupData),
    onSuccess: (data) => {
      toast({
        title: "Group created",
        description: `${groupName} has been created successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create group",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setOpen(false);
    setGroupName("");
    setGroupDescription("");
    setSearchQuery("");
    setSelectedParticipants([]);
  };

  const handleAddParticipant = (user: any) => {
    if (!selectedParticipants.find((p) => p._id === user._id)) {
      setSelectedParticipants([...selectedParticipants, user]);
    }
    setSearchQuery("");
  };

  const handleRemoveParticipant = (userId: string) => {
    setSelectedParticipants(
      selectedParticipants.filter((p) => p._id !== userId),
    );
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      toast({
        title: "Group name required",
        description: "Please enter a name for the group",
        variant: "destructive",
      });
      return;
    }

    if (selectedParticipants.length === 0) {
      toast({
        title: "Add participants",
        description: "Please add at least one participant to the group",
        variant: "destructive",
      });
      return;
    }

    createGroupMutation.mutate({
      name: groupName.trim(),
      description: groupDescription.trim() || undefined,
      participants: selectedParticipants.map((p) => p._id),
      type: "group",
    });
  };

  const users = searchResults?.data?.users || [];
  const filteredUsers = users.filter(
    (user: any) => !selectedParticipants.find((p) => p._id === user._id),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon">
            <Users className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Group Chat</DialogTitle>
          <DialogDescription>
            Create a new group chat and invite participants.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Group Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name *</Label>
              <Input
                id="groupName"
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupDescription">Description (Optional)</Label>
              <Textarea
                id="groupDescription"
                placeholder="What's this group about?"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </div>
          </div>

          {/* Selected Participants */}
          {selectedParticipants.length > 0 && (
            <div className="space-y-2">
              <Label>
                Selected Participants ({selectedParticipants.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {selectedParticipants.map((participant) => (
                  <Badge
                    key={participant._id}
                    variant="secondary"
                    className="pl-2 pr-1 py-1 flex items-center gap-2"
                  >
                    <UserAvatar
                      name={`${participant.firstName} ${participant.lastName}`}
                      imageUrl={participant.avatar}
                      className="w-5 h-5"
                      showStatus={false}
                    />
                    <span className="text-xs">
                      {participant.firstName} {participant.lastName}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-4 h-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleRemoveParticipant(participant._id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Add Participants */}
          <div className="space-y-2">
            <Label htmlFor="participantSearch">Add Participants</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="participantSearch"
                placeholder="Search users to add..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Search Results */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {searchQuery.length < 2 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Type to search for users
              </p>
            ) : isSearching ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2 rounded border"
                >
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-20 mb-1" />
                    <Skeleton className="h-2 w-24" />
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
              ))
            ) : filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {searchQuery.length >= 2
                  ? "No users found"
                  : "Start typing to search"}
              </p>
            ) : (
              filteredUsers.map((user: any) => (
                <div
                  key={user._id}
                  className="flex items-center gap-3 p-2 rounded border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleAddParticipant(user)}
                >
                  <UserAvatar
                    name={`${user.firstName} ${user.lastName}`}
                    imageUrl={user.avatar}
                    className="w-8 h-8"
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
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateGroup}
            disabled={
              !groupName.trim() ||
              selectedParticipants.length === 0 ||
              createGroupMutation.isPending
            }
          >
            {createGroupMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Users className="w-4 h-4 mr-2" />
            )}
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
