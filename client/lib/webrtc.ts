// WebRTC Manager for Glow Chat
// Handles video/voice calls, screen sharing, and real-time communication

import { webrtcApi } from "./api";

export interface CallConfig {
  iceServers: RTCIceServer[];
  videoConstraints: MediaTrackConstraints;
  audioConstraints: MediaTrackConstraints;
  screenShareConstraints: {
    video: {
      cursor: string;
      displaySurface: DisplayCaptureSurfaceType;
    };
  };
}

export interface CallState {
  isInCall: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  isMuted: boolean;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  screenShareStream: MediaStream | null;
}

export interface CallParticipant {
  userId: string;
  stream: MediaStream;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
}

class WebRTCManager {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private screenShareStream: MediaStream | null = null;
  private callState: CallState = {
    isInCall: false,
    isVideoEnabled: true,
    isAudioEnabled: true,
    isScreenSharing: false,
    isMuted: false,
    localStream: null,
    remoteStreams: new Map(),
    screenShareStream: null,
  };

  private config: CallConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
    videoConstraints: {
      width: { ideal: 1280, min: 640 },
      height: { ideal: 720, min: 480 },
      frameRate: { ideal: 30, min: 15 },
    },
    audioConstraints: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    screenShareConstraints: {
      video: {
        cursor: "always",
        displaySurface: "monitor" as DisplayCaptureSurfaceType,
      },
    },
  };

  private onCallStateChange: ((state: CallState) => void) | null = null;
  private onRemoteStreamAdd: ((userId: string, stream: MediaStream) => void) | null = null;
  private onRemoteStreamRemove: ((userId: string) => void) | null = null;

  constructor() {
    this.initializeConfig();
  }

  private async loadIceServers(): Promise<RTCIceServer[]> {
    try {
      const response = await webrtcApi.getIceServers();
      if (response.success && response.data) {
        return response.data.iceServers;
      }
    } catch (error) {
      console.error("Failed to load ICE servers from API:", error);
      // Report the issue
      await webrtcApi.reportIssue({
        issueType: "ice_server_fetch_failed",
        description: "Failed to fetch ICE servers from API",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        browserInfo: this.getBrowserInfo(),
      }).catch(() => {}); // Ignore reporting errors
    }
    
    // Return default STUN servers as fallback
    return [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ];
  }

  private async initializeConfig() {
    // Load ICE servers from API
    try {
      const iceServers = await this.loadIceServers();
      this.config.iceServers = iceServers;
    } catch (error) {
      console.error("Failed to initialize WebRTC config:", error);
    }
  }

  private getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      webrtcSupported: !!(window.RTCPeerConnection || (window as any).webkitRTCPeerConnection),
      getUserMediaSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      getDisplayMediaSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia),
    };
  }

  public setCallStateChangeCallback(callback: (state: CallState) => void) {
    this.onCallStateChange = callback;
  }

  public setRemoteStreamCallbacks(
    onAdd: (userId: string, stream: MediaStream) => void,
    onRemove: (userId: string) => void
  ) {
    this.onRemoteStreamAdd = onAdd;
    this.onRemoteStreamRemove = onRemove;
  }

  public getCallState(): CallState {
    return { ...this.callState };
  }

  public async startCall(
    participants: string[],
    isVideo: boolean = true
  ): Promise<MediaStream> {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo ? this.config.videoConstraints : false,
        audio: this.config.audioConstraints,
      });

      this.localStream = stream;
      this.callState.localStream = stream;
      this.callState.isInCall = true;
      this.callState.isVideoEnabled = isVideo;
      this.callState.isAudioEnabled = true;

      // Create peer connections for each participant
      for (const participantId of participants) {
        await this.createPeerConnection(participantId, stream);
      }

      this.notifyCallStateChange();
      return stream;
    } catch (error) {
      console.error("Failed to start call:", error);
      throw error;
    }
  }

  public async joinCall(
    participants: string[],
    isVideo: boolean = true
  ): Promise<MediaStream> {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo ? this.config.videoConstraints : false,
        audio: this.config.audioConstraints,
      });

      this.localStream = stream;
      this.callState.localStream = stream;
      this.callState.isInCall = true;
      this.callState.isVideoEnabled = isVideo;
      this.callState.isAudioEnabled = true;

      // Create peer connections for each participant
      for (const participantId of participants) {
        await this.createPeerConnection(participantId, stream);
      }

      this.notifyCallStateChange();
      return stream;
    } catch (error) {
      console.error("Failed to join call:", error);
      throw error;
    }
  }

  public async endCall(): Promise<void> {
    try {
      // Stop all streams
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      if (this.screenShareStream) {
        this.screenShareStream.getTracks().forEach(track => track.stop());
        this.screenShareStream = null;
      }

      // Close all peer connections
      for (const [userId, pc] of this.peerConnections) {
        pc.close();
      }
      this.peerConnections.clear();

      // Reset call state
      this.callState = {
        isInCall: false,
        isVideoEnabled: true,
        isAudioEnabled: true,
        isScreenSharing: false,
        isMuted: false,
        localStream: null,
        remoteStreams: new Map(),
        screenShareStream: null,
      };

      this.notifyCallStateChange();
    } catch (error) {
      console.error("Failed to end call:", error);
      throw error;
    }
  }

  public async toggleVideo(): Promise<boolean> {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.callState.isVideoEnabled = videoTrack.enabled;
      this.notifyCallStateChange();
      return videoTrack.enabled;
    }
    return false;
  }

  public async toggleAudio(): Promise<boolean> {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.callState.isAudioEnabled = audioTrack.enabled;
      this.callState.isMuted = !audioTrack.enabled;
      this.notifyCallStateChange();
      return audioTrack.enabled;
    }
    return false;
  }

  public async startScreenShare(): Promise<MediaStream | null> {
    try {
      if (this.screenShareStream) {
        await this.stopScreenShare();
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: this.config.screenShareConstraints.video,
      });

      this.screenShareStream = stream;
      this.callState.screenShareStream = stream;
      this.callState.isScreenSharing = true;

      // Replace video track in all peer connections
      const videoTrack = stream.getVideoTracks()[0];
      for (const [userId, pc] of this.peerConnections) {
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      }

      // Handle screen share stop
      stream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };

      this.notifyCallStateChange();
      return stream;
    } catch (error) {
      console.error("Failed to start screen share:", error);
      return null;
    }
  }

  public async stopScreenShare(): Promise<void> {
    if (this.screenShareStream) {
      this.screenShareStream.getTracks().forEach(track => track.stop());
      this.screenShareStream = null;
      this.callState.screenShareStream = null;
      this.callState.isScreenSharing = false;

      // Restore original video track
      if (this.localStream) {
        const videoTrack = this.localStream.getVideoTracks()[0];
        for (const [userId, pc] of this.peerConnections) {
          const sender = pc.getSenders().find(s => s.track?.kind === "video");
          if (sender && videoTrack) {
            await sender.replaceTrack(videoTrack);
          }
        }
      }

      this.notifyCallStateChange();
    }
  }

  public async addParticipant(userId: string): Promise<void> {
    if (this.localStream) {
      await this.createPeerConnection(userId, this.localStream);
    }
  }

  public async removeParticipant(userId: string): Promise<void> {
    const pc = this.peerConnections.get(userId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(userId);
      this.callState.remoteStreams.delete(userId);
      this.notifyCallStateChange();
    }
  }

  public async handleOffer(userId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const pc = await this.getOrCreatePeerConnection(userId);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    return answer;
  }

  public async handleAnswer(userId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peerConnections.get(userId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  public async handleIceCandidate(userId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peerConnections.get(userId);
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  private async createPeerConnection(userId: string, stream: MediaStream): Promise<RTCPeerConnection> {
    const pc = new RTCPeerConnection({ iceServers: this.config.iceServers });

    // Add local stream tracks
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Handle remote streams
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (remoteStream) {
        this.callState.remoteStreams.set(userId, remoteStream);
        this.onRemoteStreamAdd?.(userId, remoteStream);
        this.notifyCallStateChange();
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to signaling server
        this.onIceCandidate?.(userId, event.candidate);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        this.callState.remoteStreams.delete(userId);
        this.onRemoteStreamRemove?.(userId);
        this.notifyCallStateChange();
      }
    };

    this.peerConnections.set(userId, pc);
    return pc;
  }

  private async getOrCreatePeerConnection(userId: string): Promise<RTCPeerConnection> {
    let pc = this.peerConnections.get(userId);
    if (!pc && this.localStream) {
      pc = await this.createPeerConnection(userId, this.localStream);
    }
    if (!pc) {
      throw new Error("No local stream available");
    }
    return pc;
  }

  private notifyCallStateChange() {
    this.onCallStateChange?.(this.getCallState());
  }

  // Signaling callbacks (to be set by the caller)
  public onIceCandidate: ((userId: string, candidate: RTCIceCandidate) => void) | null = null;

  // Utility methods
  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStreams(): Map<string, MediaStream> {
    return new Map(this.callState.remoteStreams);
  }

  public getScreenShareStream(): MediaStream | null {
    return this.screenShareStream;
  }

  public isInCall(): boolean {
    return this.callState.isInCall;
  }

  public isVideoEnabled(): boolean {
    return this.callState.isVideoEnabled;
  }

  public isAudioEnabled(): boolean {
    return this.callState.isAudioEnabled;
  }

  public isScreenSharing(): boolean {
    return this.callState.isScreenSharing;
  }

  public isMuted(): boolean {
    return this.callState.isMuted;
  }
}

// Create singleton instance
export const webrtcManager = new WebRTCManager();

// Export convenience functions
export const startCall = (participants: string[], isVideo?: boolean) => 
  webrtcManager.startCall(participants, isVideo);
export const joinCall = (participants: string[], isVideo?: boolean) => 
  webrtcManager.joinCall(participants, isVideo);
export const endCall = () => webrtcManager.endCall();
export const toggleVideo = () => webrtcManager.toggleVideo();
export const toggleAudio = () => webrtcManager.toggleAudio();
export const startScreenShare = () => webrtcManager.startScreenShare();
export const stopScreenShare = () => webrtcManager.stopScreenShare();
export const addParticipant = (userId: string) => webrtcManager.addParticipant(userId);
export const removeParticipant = (userId: string) => webrtcManager.removeParticipant(userId);
export const handleOffer = (userId: string, offer: RTCSessionDescriptionInit) => 
  webrtcManager.handleOffer(userId, offer);
export const handleAnswer = (userId: string, answer: RTCSessionDescriptionInit) => 
  webrtcManager.handleAnswer(userId, answer);
export const handleIceCandidate = (userId: string, candidate: RTCIceCandidateInit) => 
  webrtcManager.handleIceCandidate(userId, candidate);