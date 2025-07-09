import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  Check,
  X,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { friendRequestsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface FriendRequest {
  _id: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar?: string;
  };
  receiver: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar?: string;
  };
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
}

export function FriendRequests() {
  const [activeTab, setActiveTab] = useState("received");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch received friend requests
  const {
    data: receivedRequests,
    isLoading: loadingReceived,
    refetch: refetchReceived,
  } = useQuery({
    queryKey: ["friendRequests", "received"],
    queryFn: () => friendRequestsApi.getReceivedFriendRequests(),
    staleTime: 30000,
  });

  // Fetch sent friend requests
  const {
    data: sentRequests,
    isLoading: loadingSent,
    refetch: refetchSent,
  } = useQuery({
    queryKey: ["friendRequests", "sent"],
    queryFn: () => friendRequestsApi.getSentFriendRequests(),
    staleTime: 30000,
  });

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const response = await friendRequestsApi.acceptFriendRequest(requestId);
      if (response.success) {
        toast({
          title: "Friend request accepted",
          description: "You are now friends!",
        });
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
        queryClient.invalidateQueries({ queryKey: ["users"] });
      } else {
        toast({
          title: "Failed to accept request",
          description: response.message || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await friendRequestsApi.rejectFriendRequest(requestId);
      if (response.success) {
        toast({
          title: "Friend request rejected",
          description: "The request has been declined",
        });
        queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      } else {
        toast({
          title: "Failed to reject request",
          description: response.message || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject friend request",
        variant: "destructive",
      });
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const response = await friendRequestsApi.cancelFriendRequest(requestId);
      if (response.success) {
        toast({
          title: "Friend request cancelled",
          description: "The request has been cancelled",
        });
        queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      } else {
        toast({
          title: "Failed to cancel request",
          description: response.message || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel friend request",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="default" className="text-xs">
            <UserCheck className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="text-xs">
            <UserX className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderRequestItem = (request: FriendRequest, type: "received" | "sent") => {
    const otherUser = type === "received" ? request.sender : request.receiver;
    const isPending = request.status === "pending";

    return (
      <Card key={request._id} className="p-4">
        <div className="flex items-center gap-3">
          <UserAvatar
            name={`${otherUser.firstName} ${otherUser.lastName}`}
            imageUrl={otherUser.avatar}
            className="w-12 h-12"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium truncate">
                {otherUser.firstName} {otherUser.lastName}
              </h3>
              {getStatusBadge(request.status)}
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">
              @{otherUser.username}
            </p>
            
            <p className="text-xs text-muted-foreground">
              {type === "received" ? "Sent you a friend request" : "You sent a friend request"} •{" "}
              {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
            </p>
          </div>

          {isPending && (
            <div className="flex items-center gap-2">
              {type === "received" ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleAcceptRequest(request._id)}
                    className="h-8 px-3"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectRequest(request._id)}
                    className="h-8 px-3"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCancelRequest(request._id)}
                  className="h-8 px-3"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  };

  const receivedRequestsList = receivedRequests?.data?.friendRequests || [];
  const sentRequestsList = sentRequests?.data?.friendRequests || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <UserPlus className="w-5 h-5" />
        <h2 className="text-lg font-semibold">Friend Requests</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Received
            {receivedRequestsList.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {receivedRequestsList.filter(r => r.status === "pending").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Sent
            {sentRequestsList.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {sentRequestsList.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-3">
          {loadingReceived ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                      <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : receivedRequestsList.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No friend requests</h3>
              <p className="text-muted-foreground">
                You don't have any pending friend requests at the moment.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {receivedRequestsList.map((request) => renderRequestItem(request, "received"))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-3">
          {loadingSent ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                      <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : sentRequestsList.length === 0 ? (
            <Card className="p-8 text-center">
              <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sent requests</h3>
              <p className="text-muted-foreground">
                You haven't sent any friend requests yet.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {sentRequestsList.map((request) => renderRequestItem(request, "sent"))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}