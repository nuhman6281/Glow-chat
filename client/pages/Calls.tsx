import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Phone,
  Video,
  PhoneCall,
  PhoneMissed,
  PhoneIncoming,
  PhoneOutgoing,
  Search,
  Plus,
  Clock,
  PhoneOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { callsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Call } from "@shared/api";

export default function Calls() {
  const [searchQuery, setSearchQuery] = useState("");
  const { token } = useAuth();
  const { toast } = useToast();

  // Fetch calls from API
  const {
    data: callsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["calls"],
    queryFn: () => callsApi.getCalls({ limit: 50 }),
    enabled: !!token,
    staleTime: 30000, // 30 seconds
  });

  const calls = callsResponse?.data?.calls || [];

  const filteredCalls = calls.filter((call: Call) =>
    call.participants.some((participant) => {
      const user =
        typeof participant.user === "object" ? participant.user : null;
      if (!user) return false;
      return (
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }),
  );

  const missedCalls = filteredCalls.filter(
    (call: Call) => call.status === "missed",
  );
  const voiceCalls = filteredCalls.filter(
    (call: Call) => call.type === "voice",
  );
  const videoCalls = filteredCalls.filter(
    (call: Call) => call.type === "video",
  );

  const getCallIcon = (call: Call) => {
    if (call.status === "missed" || call.status === "declined") {
      return <PhoneMissed className="w-4 h-4 text-destructive" />;
    } else if (call.status === "answered") {
      return <PhoneIncoming className="w-4 h-4 text-green-500" />;
    } else {
      return <PhoneOutgoing className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatTimestamp = (date: Date | string | null | undefined) => {
    // Handle null/undefined values
    if (!date) {
      return "Unknown";
    }

    // Ensure date is a Date object
    const callDate = date instanceof Date ? date : new Date(date);

    // Check if the date is valid
    if (isNaN(callDate.getTime())) {
      return "Unknown";
    }

    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - callDate.getTime()) / (1000 * 60 * 60),
    );
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return callDate.toLocaleDateString();
    }
  };

  const getCallName = (call: Call) => {
    if (call.participants.length === 1) {
      const participant = call.participants[0];
      const user =
        typeof participant.user === "object" ? participant.user : null;
      if (user) {
        return `${user.firstName} ${user.lastName}`;
      }
      return "Unknown User";
    } else {
      return `Group Call (${call.participants.length} people)`;
    }
  };

  const CallItem = ({ call }: { call: Call }) => (
    <div className="flex items-center gap-3 p-4 rounded-lg hover:bg-muted/50 transition-colors">
      <UserAvatar
        name={getCallName(call)}
        className="w-12 h-12"
        showStatus={false}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold truncate">{getCallName(call)}</h3>
          {call.participants.length > 1 && (
            <Badge variant="secondary" className="text-xs">
              {call.participants.length} people
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {getCallIcon(call)}
          <span>{formatTimestamp(call.createdAt)}</span>
          {call.duration && (
            <>
              <span>•</span>
              <span>{formatDuration(call.duration)}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            toast({
              title: "Call feature",
              description: "Call functionality coming soon!",
            });
          }}
        >
          <Phone className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            toast({
              title: "Video call feature",
              description: "Video call functionality coming soon!",
            });
          }}
        >
          <Video className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  const CallSkeleton = () => (
    <div className="flex items-center gap-3 p-4">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex gap-1">
        <Skeleton className="w-8 h-8 rounded" />
        <Skeleton className="w-8 h-8 rounded" />
      </div>
    </div>
  );

  return (
    <AppLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Calls</h1>
            <p className="text-sm text-muted-foreground">Recent call history</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast({
                  title: "Voice call",
                  description: "Voice call feature coming soon!",
                });
              }}
            >
              <Phone className="w-4 h-4 mr-2" />
              Voice Call
            </Button>
            <Button
              size="sm"
              onClick={() => {
                toast({
                  title: "Video call",
                  description: "Video call feature coming soon!",
                });
              }}
            >
              <Video className="w-4 h-4 mr-2" />
              Video Call
            </Button>
          </div>
        </div>
      }
    >
      <div className="h-full flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search call history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Call History */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="all" className="h-full flex flex-col">
            <TabsList className="grid grid-cols-4 m-4 mb-0">
              <TabsTrigger value="all">
                All ({filteredCalls.length})
              </TabsTrigger>
              <TabsTrigger value="missed">
                Missed ({missedCalls.length})
              </TabsTrigger>
              <TabsTrigger value="voice">
                Voice ({voiceCalls.length})
              </TabsTrigger>
              <TabsTrigger value="video">
                Video ({videoCalls.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="all" className="mt-0 p-4 pt-0">
                <div className="space-y-1">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <CallSkeleton key={i} />
                    ))
                  ) : filteredCalls.length === 0 ? (
                    <div className="text-center py-8">
                      <Phone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No calls yet</p>
                      <p className="text-sm text-muted-foreground">
                        Start a call to see your history here
                      </p>
                    </div>
                  ) : (
                    filteredCalls.map((call) => (
                      <CallItem key={call._id} call={call} />
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="missed" className="mt-0 p-4 pt-0">
                <div className="space-y-1">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <CallSkeleton key={i} />
                    ))
                  ) : missedCalls.length === 0 ? (
                    <div className="text-center py-8">
                      <PhoneMissed className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No missed calls</p>
                    </div>
                  ) : (
                    missedCalls.map((call) => (
                      <CallItem key={call._id} call={call} />
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="voice" className="mt-0 p-4 pt-0">
                <div className="space-y-1">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <CallSkeleton key={i} />
                    ))
                  ) : voiceCalls.length === 0 ? (
                    <div className="text-center py-8">
                      <Phone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No voice calls</p>
                    </div>
                  ) : (
                    voiceCalls.map((call) => (
                      <CallItem key={call._id} call={call} />
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="video" className="mt-0 p-4 pt-0">
                <div className="space-y-1">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <CallSkeleton key={i} />
                    ))
                  ) : videoCalls.length === 0 ? (
                    <div className="text-center py-8">
                      <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No video calls</p>
                    </div>
                  ) : (
                    videoCalls.map((call) => (
                      <CallItem key={call._id} call={call} />
                    ))
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Quick Actions */}
        <div className="border-t border-border p-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              className="h-12"
              onClick={() => {
                toast({
                  title: "Voice call",
                  description: "Voice call feature coming soon!",
                });
              }}
            >
              <Phone className="w-5 h-5 mr-2" />
              Start Voice Call
            </Button>
            <Button
              variant="outline"
              className="h-12"
              onClick={() => {
                toast({
                  title: "Video call",
                  description: "Video call feature coming soon!",
                });
              }}
            >
              <Video className="w-5 h-5 mr-2" />
              Start Video Call
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
