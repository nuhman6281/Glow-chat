import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Users,
  Settings,
  MoreHorizontal,
  Send,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Camera,
  CameraOff,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWebRTC } from "@/hooks/use-webrtc";
import { useSound } from "@/hooks/use-sound";
import { cn } from "@/lib/utils";

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  stream?: MediaStream;
  screenStream?: MediaStream;
}

interface CallMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
}

interface CallInterfaceProps {
  callId: string;
  participants: Participant[];
  localParticipant: Participant;
  onEndCall: () => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleSpeaker: () => void;
  onRotateCamera: () => void;
  onMaximize: () => void;
  onMinimize: () => void;
  onSettings: () => void;
  isIncoming?: boolean;
  onAcceptCall?: () => void;
  onRejectCall?: () => void;
}

export function CallInterface({
  callId,
  participants,
  localParticipant,
  onEndCall,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleMute,
  onToggleCamera,
  onToggleSpeaker,
  onRotateCamera,
  onMaximize,
  onMinimize,
  onSettings,
  isIncoming = false,
  onAcceptCall,
  onRejectCall,
}: CallInterfaceProps) {
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<CallMessage[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const { playSound } = useSound();

  // Call duration timer
  useEffect(() => {
    if (!isIncoming) {
      const timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isIncoming]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Send chat message
  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage: CallMessage = {
        id: Date.now().toString(),
        senderId: localParticipant.id,
        senderName: localParticipant.name,
        message: chatMessage.trim(),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newMessage]);
      setChatMessage("");
    }
  };

  // Handle key press in chat input
  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Toggle fullscreen
  const handleFullscreenToggle = () => {
    if (isFullscreen) {
      onMinimize();
      setIsFullscreen(false);
    } else {
      onMaximize();
      setIsFullscreen(true);
    }
  };

  // Get grid layout based on participant count
  const getGridLayout = () => {
    const totalParticipants = participants.length + 1; // +1 for local participant
    
    if (totalParticipants <= 2) return "grid-cols-1";
    if (totalParticipants <= 4) return "grid-cols-2";
    if (totalParticipants <= 9) return "grid-cols-3";
    return "grid-cols-4";
  };

  // Render video grid
  const renderVideoGrid = () => {
    const allParticipants = [localParticipant, ...participants];
    const gridClass = getGridLayout();

    return (
      <div className={`grid ${gridClass} gap-2 h-full`}>
        {allParticipants.map((participant) => (
          <div
            key={participant.id}
            className={cn(
              "relative bg-black rounded-lg overflow-hidden",
              participant.isSpeaking && "ring-2 ring-green-500",
              activeSpeaker === participant.id && "ring-2 ring-blue-500"
            )}
          >
            {/* Video stream */}
            {participant.isVideoEnabled && participant.stream && (
              <video
                ref={(el) => {
                  if (el) el.srcObject = participant.stream;
                }}
                autoPlay
                playsInline
                muted={participant.id === localParticipant.id}
                className="w-full h-full object-cover"
              />
            )}

            {/* Screen share stream */}
            {participant.isScreenSharing && participant.screenStream && (
              <video
                ref={(el) => {
                  if (el) el.srcObject = participant.screenStream;
                }}
                autoPlay
                playsInline
                muted={participant.id === localParticipant.id}
                className="w-full h-full object-contain bg-gray-900"
              />
            )}

            {/* Placeholder when no video */}
            {!participant.isVideoEnabled && !participant.isScreenSharing && (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <UserAvatar
                  name={participant.name}
                  imageUrl={participant.avatar}
                  className="w-20 h-20"
                />
              </div>
            )}

            {/* Participant info overlay */}
            <div className="absolute bottom-2 left-2 right-2">
              <div className="flex items-center justify-between bg-black/50 backdrop-blur-sm rounded-lg p-2">
                <div className="flex items-center gap-2">
                  <UserAvatar
                    name={participant.name}
                    imageUrl={participant.avatar}
                    className="w-6 h-6"
                  />
                  <span className="text-white text-sm font-medium truncate">
                    {participant.name}
                    {participant.id === localParticipant.id && " (You)"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {!participant.isAudioEnabled && (
                    <MicOff className="w-4 h-4 text-red-500" />
                  )}
                  {participant.isScreenSharing && (
                    <Monitor className="w-4 h-4 text-blue-500" />
                  )}
                  {participant.isSpeaking && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
              </div>
            </div>

            {/* Screen share indicator */}
            {participant.isScreenSharing && (
              <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                Screen Sharing
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Incoming call interface
  if (isIncoming) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <Card className="w-96 max-w-[90vw]">
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto mb-4">
              <UserAvatar
                name={participants[0]?.name || "Unknown"}
                imageUrl={participants[0]?.avatar}
                className="w-full h-full"
              />
            </div>
            <CardTitle className="text-xl">
              {participants[0]?.name || "Unknown"}
            </CardTitle>
            <p className="text-muted-foreground">
              Incoming {participants[0]?.isVideoEnabled ? "video" : "voice"} call
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                variant="destructive"
                onClick={onRejectCall}
                className="w-16 h-16 rounded-full"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
              <Button
                size="lg"
                onClick={onAcceptCall}
                className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700"
              >
                <Phone className="w-6 h-6" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed inset-0 bg-black z-50 flex flex-col",
      isMinimized && "h-32 bottom-0 top-auto"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-3 h-3 rounded-full",
              localParticipant.isAudioEnabled ? "bg-green-500" : "bg-red-500"
            )} />
            <span className="text-white font-medium">
              {formatDuration(callDuration)}
            </span>
          </div>
                     <div className="px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-md">
             {participants.length + 1} participants
           </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowParticipants(!showParticipants)}
            className="text-white hover:bg-white/10"
          >
            <Users className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChat(!showChat)}
            className="text-white hover:bg-white/10"
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFullscreenToggle}
            className="text-white hover:bg-white/10"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onSettings}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsBlurred(!isBlurred)}>
                {isBlurred ? <Camera className="w-4 h-4 mr-2" /> : <CameraOff className="w-4 h-4 mr-2" />}
                {isBlurred ? "Remove Background Blur" : "Add Background Blur"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsRecording(!isRecording)}>
                <div className={cn("w-2 h-2 rounded-full mr-2", isRecording ? "bg-red-500" : "bg-gray-400")} />
                {isRecording ? "Stop Recording" : "Start Recording"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onRotateCamera}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Switch Camera
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Video grid */}
        <div className="flex-1 p-4">
          {renderVideoGrid()}
        </div>

        {/* Side panels */}
        {showParticipants && (
          <div className="w-80 bg-gray-900 border-l border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold text-white">Participants</h3>
            </div>
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {[localParticipant, ...participants].map((participant) => (
                  <div key={participant.id} className="flex items-center gap-3">
                    <UserAvatar
                      name={participant.name}
                      imageUrl={participant.avatar}
                      className="w-10 h-10"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {participant.name}
                        {participant.id === localParticipant.id && " (You)"}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {participant.isAudioEnabled ? "Audio on" : "Audio off"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!participant.isAudioEnabled && (
                        <MicOff className="w-4 h-4 text-red-500" />
                      )}
                      {participant.isScreenSharing && (
                        <Monitor className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {showChat && (
          <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold text-white">Call Chat</h3>
            </div>
            <ScrollArea className="flex-1" ref={chatScrollRef}>
              <div className="p-4 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex flex-col",
                      message.senderId === localParticipant.id ? "items-end" : "items-start"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400">
                        {message.senderName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "max-w-[80%] p-2 rounded-lg text-sm",
                        message.senderId === localParticipant.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-white"
                      )}
                    >
                      {message.message}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={handleChatKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-800 border-gray-600 text-white"
                />
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 p-6 bg-black/50 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="lg"
          onClick={onToggleSpeaker}
          className="text-white hover:bg-white/10"
        >
          <Volume2 className="w-6 h-6" />
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onClick={onToggleMute}
          className={cn(
            "text-white hover:bg-white/10",
            localParticipant.isMuted && "bg-red-600 hover:bg-red-700"
          )}
        >
          {localParticipant.isMuted ? (
            <MicOff className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onClick={onToggleCamera}
          className={cn(
            "text-white hover:bg-white/10",
            !localParticipant.isVideoEnabled && "bg-red-600 hover:bg-red-700"
          )}
        >
          {localParticipant.isVideoEnabled ? (
            <Camera className="w-6 h-6" />
          ) : (
            <CameraOff className="w-6 h-6" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onClick={onToggleScreenShare}
          className={cn(
            "text-white hover:bg-white/10",
            localParticipant.isScreenSharing && "bg-blue-600 hover:bg-blue-700"
          )}
        >
          {localParticipant.isScreenSharing ? (
            <MonitorOff className="w-6 h-6" />
          ) : (
            <Monitor className="w-6 h-6" />
          )}
        </Button>

        <Button
          variant="destructive"
          size="lg"
          onClick={onEndCall}
          className="w-14 h-14 rounded-full"
        >
          <PhoneOff className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}