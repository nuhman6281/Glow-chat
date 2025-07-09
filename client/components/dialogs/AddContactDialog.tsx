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
import { UserPlus, Search, Check, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";

interface AddContactDialogProps {
  children?: React.ReactNode;
}

export function AddContactDialog({ children }: AddContactDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search users
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["users", "search", searchQuery],
    queryFn: () => usersApi.searchUsers(searchQuery),
    enabled: searchQuery.length >= 2,
    staleTime: 30000,
  });

  // Add contact mutation - Using updateMe to add to contacts list for now
  const addContactMutation = useMutation({
    mutationFn: async (userId: string) => {
      // TODO: Replace with proper addContact API when available
      throw new Error("Add contact API not yet implemented");
    },
    onSuccess: () => {
      toast({
        title: "Contact added",
        description: "User has been added to your contacts",
      });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setOpen(false);
      setSearchQuery("");
      setSelectedUsers([]);
    },
    onError: (error: any) => {
      toast({
        title: "Feature coming soon",
        description: "Contact management is being implemented",
        variant: "destructive",
      });
    },
  });

  const handleAddContact = (userId: string) => {
    addContactMutation.mutate(userId);
  };

  const users = searchResults?.data?.users || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon">
            <UserPlus className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
          <DialogDescription>
            Search for users by username or email to add them as contacts.
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
                No users found
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
                    onClick={() => handleAddContact(user._id)}
                    disabled={addContactMutation.isPending}
                  >
                    {addContactMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-1" />
                        Add
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
