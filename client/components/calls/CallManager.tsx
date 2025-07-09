import React, { useState, useEffect } from "react";
import { CallInterface } from "./CallInterface";
import { webrtcManager, CallState } from "@/lib/webrtc";
import { useSocket } from "@/hooks/use-socket";
import { useSound } from "@/hooks/use-sound";
import { callsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CallManagerProps {
  currentUserId: string;
  onCallEnd?: () => void;
}

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

export function CallManager({ currentUserId, onCallEnd }: CallManagerProps) {
  const [callState, setCallState] = useState<CallState | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localParticipant, setLocalParticipant] = useState<Participant | null>(null);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState<any>(null);

  const { socket } = useSocket();
  const { playSound } = useSound();
  const { toast } = useToast();

  // Set up WebRTC callbacks
  useEffect(() => {
    webrtcManager.setCallStateChangeCallback((state) => {
      setCallState(state);
      
      // Update local participant
      if (state.localStream) {
        setLocalParticipant({
          id: currentUserId,
          name: "You",
          isVideoEnabled: state.isVideoEnabled,
          isAudioEnabled: state.isAudioEnabled,
          isScreenSharing: state.isScreenSharing,
          isSpeaking: false,
          isMuted: state.isMuted,
          stream: state.localStream,
          screenStream: state.screenShareStream || undefined,
        });
      }
    });

    webrtcManager.setRemoteStreamCallbacks(
      (userId, stream) => {
        setParticipants(prev => {
          const existingIndex = prev.findIndex(p => p.id === userId);
          const participant: Participant = {
            id: userId,
            name: `User ${userId}`, // In real app, fetch from user data
            isVideoEnabled: stream.getVideoTracks().length > 0,
            isAudioEnabled: stream.getAudioTracks().length > 0,
            isScreenSharing: false,
            isSpeaking: false,
            isMuted: false,
            stream,
          };

          if (existingIndex >= 0) {
            const newParticipants = [...prev];
            newParticipants[existingIndex] = participant;
            return newParticipants;
          } else {
            return [...prev, participant];
          }
        });
      },
      (userId) => {
        setParticipants(prev => prev.filter(p => p.id !== userId));
      }
    );

    webrtcManager.onIceCandidate = (userId, candidate) => {
      if (socket && currentCallId) {
        socket.emit("ice-candidate", {
          callId: currentCallId,
          targetUserId: userId,
          candidate,
        });
      }
    };
  }, [currentUserId, socket, currentCallId]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data: any) => {
      setIncomingCallData(data);
      setIsIncomingCall(true);
      playSound("callIncoming");
    };

    const handleCallAccepted = async (data: any) => {
      try {
        setCurrentCallId(data.callId);
        await webrtcManager.startCall([data.callerId], data.isVideo);
      } catch (error) {
        console.error("Failed to start call:", error);
        toast({
          title: "Call failed",
          description: "Failed to start the call",
          variant: "destructive",
        });
      }
    };

    const handleCallRejected = () => {
      setIsIncomingCall(false);
      setIncomingCallData(null);
      playSound("callEnd");
      toast({
        title: "Call rejected",
        description: "The call was rejected",
      });
    };

    const handleCallEnded = () => {
      webrtcManager.endCall();
      setCurrentCallId(null);
      setIsIncomingCall(false);
      setIncomingCallData(null);
      setParticipants([]);
      setLocalParticipant(null);
      playSound("callEnd");
      onCallEnd?.();
    };

    const handleOffer = async (data: any) => {
      try {
        const answer = await webrtcManager.handleOffer(data.senderId, data.offer);
        socket.emit("answer", {
          callId: data.callId,
          targetUserId: data.senderId,
          answer,
        });
      } catch (error) {
        console.error("Failed to handle offer:", error);
      }
    };

    const handleAnswer = async (data: any) => {
      try {
        await webrtcManager.handleAnswer(data.senderId, data.answer);
      } catch (error) {
        console.error("Failed to handle answer:", error);
      }
    };

    const handleIceCandidate = async (data: any) => {
      try {
        await webrtcManager.handleIceCandidate(data.senderId, data.candidate);
      } catch (error) {
        console.error("Failed to handle ICE candidate:", error);
      }
    };

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("call-rejected", handleCallRejected);
    socket.on("call-ended", handleCallEnded);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("call-rejected", handleCallRejected);
      socket.off("call-ended", handleCallEnded);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, [socket, currentCallId, onCallEnd, playSound, toast]);

  const handleAcceptCall = async () => {
    if (!incomingCallData || !socket) return;

    try {
      setCurrentCallId(incomingCallData.callId);
      setIsIncomingCall(false);
      
      // Join the call
      await webrtcManager.joinCall([incomingCallData.callerId], incomingCallData.isVideo);
      
      // Notify the caller
      socket.emit("accept-call", {
        callId: incomingCallData.callId,
        callerId: incomingCallData.callerId,
      });

      // Update call status in backend
      await callsApi.updateCallStatus(incomingCallData.callId, "ongoing");
      
      setIncomingCallData(null);
    } catch (error) {
      console.error("Failed to accept call:", error);
      toast({
        title: "Failed to accept call",
        description: "Unable to join the call",
        variant: "destructive",
      });
    }
  };

  const handleRejectCall = async () => {
    if (!incomingCallData || !socket) return;

    try {
      // Notify the caller
      socket.emit("reject-call", {
        callId: incomingCallData.callId,
        callerId: incomingCallData.callerId,
      });

      // Update call status in backend
      await callsApi.updateCallStatus(incomingCallData.callId, "declined");
      
      setIsIncomingCall(false);
      setIncomingCallData(null);
      playSound("callEnd");
    } catch (error) {
      console.error("Failed to reject call:", error);
    }
  };

  const handleEndCall = async () => {
    if (!currentCallId || !socket) return;

    try {
      // End the call locally
      await webrtcManager.endCall();
      
      // Notify other participants
      socket.emit("end-call", {
        callId: currentCallId,
      });

      // Update call status in backend
      await callsApi.updateCallStatus(currentCallId, "ended");
      
      setCurrentCallId(null);
      setParticipants([]);
      setLocalParticipant(null);
      playSound("callEnd");
      onCallEnd?.();
    } catch (error) {
      console.error("Failed to end call:", error);
    }
  };

  const handleToggleAudio = async () => {
    try {
      await webrtcManager.toggleAudio();
    } catch (error) {
      console.error("Failed to toggle audio:", error);
    }
  };

  const handleToggleVideo = async () => {
    try {
      await webrtcManager.toggleVideo();
    } catch (error) {
      console.error("Failed to toggle video:", error);
    }
  };

  const handleToggleScreenShare = async () => {
    try {
      if (callState?.isScreenSharing) {
        await webrtcManager.stopScreenShare();
      } else {
        await webrtcManager.startScreenShare();
      }
    } catch (error) {
      console.error("Failed to toggle screen share:", error);
    }
  };

  // Don't render if not in a call
  if (!callState?.isInCall && !isIncomingCall) {
    return null;
  }

  // Show incoming call interface
  if (isIncomingCall && incomingCallData) {
    return (
      <CallInterface
        callId={incomingCallData.callId}
        participants={[{
          id: incomingCallData.callerId,
          name: incomingCallData.callerName || "Unknown",
          avatar: incomingCallData.callerAvatar,
          isVideoEnabled: incomingCallData.isVideo,
          isAudioEnabled: true,
          isScreenSharing: false,
          isSpeaking: false,
          isMuted: false,
        }]}
        localParticipant={{
          id: currentUserId,
          name: "You",
          isVideoEnabled: false,
          isAudioEnabled: false,
          isScreenSharing: false,
          isSpeaking: false,
          isMuted: false,
        }}
        onEndCall={handleRejectCall}
        onToggleAudio={() => {}}
        onToggleVideo={() => {}}
        onToggleScreenShare={() => {}}
        onToggleMute={() => {}}
        onToggleCamera={() => {}}
        onToggleSpeaker={() => {}}
        onRotateCamera={() => {}}
        onMaximize={() => {}}
        onMinimize={() => {}}
        onSettings={() => {}}
        isIncoming={true}
        onAcceptCall={handleAcceptCall}
        onRejectCall={handleRejectCall}
      />
    );
  }

  // Show active call interface
  if (localParticipant) {
    return (
      <CallInterface
        callId={currentCallId || ""}
        participants={participants}
        localParticipant={localParticipant}
        onEndCall={handleEndCall}
        onToggleAudio={handleToggleAudio}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleMute={handleToggleAudio}
        onToggleCamera={handleToggleVideo}
        onToggleSpeaker={() => {}}
        onRotateCamera={() => {}}
        onMaximize={() => {}}
        onMinimize={() => {}}
        onSettings={() => {}}
      />
    );
  }

  return null;
}