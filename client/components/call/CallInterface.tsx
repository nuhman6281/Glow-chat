import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Settings,
  Users,
  MessageSquare,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { webrtcManager, CallState } from "@/lib/webrtc";
import { soundManager, playCallEnded, playCallMissed } from "@/lib/sounds";
import { useToast } from "@/hooks/use-toast";

interface CallInterfaceProps {
  callId: string;
  participants: string[];
  isVideo: boolean;
  onEndCall: () => void;
  onMinimize: () => void;
  className?: string;
}

export function CallInterface({
  callId,
  participants,
  isVideo,
  onEndCall,
  onMinimize,
  className,
}: CallInterfaceProps) {
  const [callState, setCallState] = useState<CallState>(webrtcManager.getCallState());
  const [isMinimized, setIsMinimized] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(!isVideo);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const { toast } = useToast();

  useEffect(() => {
    // Set up call state change callback
    webrtcManager.setCallStateChangeCallback((state) => {
      setCallState(state);
    });

    // Set up remote stream callbacks
    webrtcManager.setRemoteStreamCallbacks(
      (userId, stream) => {
        const videoElement = remoteVideoRefs.current.get(userId);
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      },
      (userId) => {
        const videoElement = remoteVideoRefs.current.get(userId);
        if (videoElement) {
          videoElement.srcObject = null;
        }
      }
    );

    // Set up ICE candidate callback
    webrtcManager.onIceCandidate = (userId, candidate) => {
      // Send ICE candidate via socket
      // This should be implemented in the socket handler
      console.log("ICE candidate for", userId, candidate);
    };

    return () => {
      webrtcManager.setCallStateChangeCallback(null);
      webrtcManager.setRemoteStreamCallbacks(null, null);
      webrtcManager.onIceCandidate = null;
    };
  }, []);

  useEffect(() => {
    // Update local video when stream changes
    if (localVideoRef.current && callState.localStream) {
      localVideoRef.current.srcObject = callState.localStream;
    }
  }, [callState.localStream]);

  const handleToggleAudio = async () => {
    try {
      const isEnabled = await webrtcManager.toggleAudio();
      setIsAudioMuted(!isEnabled);
      
      if (isEnabled) {
        soundManager.playSound("unmute");
      } else {
        soundManager.playSound("mute");
      }
    } catch (error) {
      toast({
        title: "Failed to toggle audio",
        description: "Please check your microphone permissions",
        variant: "destructive",
      });
    }
  };

  const handleToggleVideo = async () => {
    try {
      const isEnabled = await webrtcManager.toggleVideo();
      setIsVideoMuted(!isEnabled);
      
      if (isEnabled) {
        soundManager.playSound("video_on");
      } else {
        soundManager.playSound("video_off");
      }
    } catch (error) {
      toast({
        title: "Failed to toggle video",
        description: "Please check your camera permissions",
        variant: "destructive",
      });
    }
  };

  const handleToggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        await webrtcManager.stopScreenShare();
        setIsScreenSharing(false);
        soundManager.playSound("screen_share_stop");
      } else {
        const stream = await webrtcManager.startScreenShare();
        if (stream) {
          setIsScreenSharing(true);
          soundManager.playSound("screen_share_start");
        }
      }
    } catch (error) {
      toast({
        title: "Failed to toggle screen share",
        description: "Please check your screen sharing permissions",
        variant: "destructive",
      });
    }
  };

  const handleToggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // This would typically involve changing audio output device
    // For now, we'll just toggle the state
  };

  const handleEndCall = async () => {
    try {
      await webrtcManager.endCall();
      playCallEnded();
      onEndCall();
    } catch (error) {
      console.error("Failed to end call:", error);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    onMinimize();
  };

  const getRemoteVideoRef = (userId: string) => (element: HTMLVideoElement | null) => {
    if (element) {
      remoteVideoRefs.current.set(userId, element);
    } else {
      remoteVideoRefs.current.delete(userId);
    }
  };

  if (isMinimized) {
    return (
      <Card className={cn("fixed bottom-4 right-4 p-2 bg-background/95 backdrop-blur-sm", className)}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium">Call in progress</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMinimize}
            className="h-6 w-6 p-0"
          >
            <Phone className="w-3 h-3" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn("fixed inset-0 bg-background z-50 flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <div>
            <h2 className="font-semibold">
              {isVideo ? "Video Call" : "Voice Call"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {participants.length} participant{participants.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowParticipants(!showParticipants)}
          >
            <Users className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChat(!showChat)}
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMinimize}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative bg-black">
        {/* Remote Videos */}
        <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
          {Array.from(callState.remoteStreams.entries()).map(([userId, stream]) => (
            <div key={userId} className="relative bg-muted rounded-lg overflow-hidden">
              <video
                ref={getRemoteVideoRef(userId)}
                autoPlay
                playsInline
                muted={false}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {userId}
              </div>
            </div>
          ))}
        </div>

        {/* Local Video */}
        {isVideo && callState.localStream && (
          <div className="absolute top-4 right-4 w-48 h-36 bg-muted rounded-lg overflow-hidden border-2 border-primary">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted={true}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              You
            </div>
          </div>
        )}

        {/* Screen Share */}
        {isScreenSharing && callState.screenShareStream && (
          <div className="absolute inset-0 bg-black">
            <video
              autoPlay
              playsInline
              muted={false}
              className="w-full h-full object-contain"
              srcObject={callState.screenShareStream}
            />
            <div className="absolute top-4 left-4 bg-black/50 text-white text-sm px-3 py-1 rounded">
              Screen Sharing
            </div>
          </div>
        )}

        {/* No Video Placeholder */}
        {!isVideo && callState.remoteStreams.size === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Phone className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Voice Call</h3>
              <p className="text-muted-foreground">
                Connecting to participants...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-background/95 backdrop-blur-sm border-t">
        <div className="flex items-center justify-center gap-4">
          {/* Audio Toggle */}
          <Button
            variant={isAudioMuted ? "destructive" : "secondary"}
            size="lg"
            onClick={handleToggleAudio}
            className="w-12 h-12 rounded-full"
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          {/* Video Toggle */}
          {isVideo && (
            <Button
              variant={isVideoMuted ? "destructive" : "secondary"}
              size="lg"
              onClick={handleToggleVideo}
              className="w-12 h-12 rounded-full"
            >
              {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </Button>
          )}

          {/* Screen Share */}
          <Button
            variant={isScreenSharing ? "destructive" : "secondary"}
            size="lg"
            onClick={handleToggleScreenShare}
            className="w-12 h-12 rounded-full"
          >
            {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          </Button>

          {/* Speaker Toggle */}
          <Button
            variant={isSpeakerOn ? "secondary" : "outline"}
            size="lg"
            onClick={handleToggleSpeaker}
            className="w-12 h-12 rounded-full"
          >
            {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>

          {/* End Call */}
          <Button
            variant="destructive"
            size="lg"
            onClick={handleEndCall}
            className="w-12 h-12 rounded-full"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Participants Panel */}
      {showParticipants && (
        <div className="absolute top-16 right-4 w-64 bg-background border rounded-lg shadow-lg p-4">
          <h3 className="font-semibold mb-3">Participants</h3>
          <div className="space-y-2">
            {participants.map((participant) => (
              <div key={participant} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">{participant}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Panel */}
      {showChat && (
        <div className="absolute bottom-20 right-4 w-80 h-96 bg-background border rounded-lg shadow-lg flex flex-col">
          <div className="p-3 border-b">
            <h3 className="font-semibold">Call Chat</h3>
          </div>
          <div className="flex-1 p-3">
            <p className="text-sm text-muted-foreground">
              Call chat feature coming soon...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}