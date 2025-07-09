import React, { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Mic, Square, Play, Pause, Upload, X } from "lucide-react";
import { messagesApi } from "../../lib/api";
import { toast } from "sonner";

interface VoiceRecorderProps {
  chatId: string;
  onRecordingComplete?: () => void;
  onCancel?: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  chatId,
  onRecordingComplete,
  onCancel,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error("Failed to access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const playRecording = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleUpload = async () => {
    if (!audioBlob || !chatId) return;

    setIsUploading(true);
    try {
      // Convert blob to file
      const file = new File([audioBlob], `voice-message-${Date.now()}.wav`, {
        type: "audio/wav",
      });

      await messagesApi.sendMessage({
        chatId,
        type: "voice",
        file,
      });

      toast.success("Voice message sent");
      onRecordingComplete?.();
    } catch (error) {
      toast.error("Failed to send voice message");
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!audioBlob) {
    return (
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
        <div className="flex-1">
          <p className="text-sm font-medium">Voice Recording</p>
          <p className="text-xs text-muted-foreground">
            {isRecording
              ? `Recording... ${formatTime(recordingTime)}`
              : "Click to start recording"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {!isRecording ? (
            <Button
              size="sm"
              onClick={startRecording}
              className="bg-red-500 hover:bg-red-600"
            >
              <Mic className="w-4 h-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={stopRecording} variant="destructive">
              <Square className="w-4 h-4" />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
      <div className="flex-1">
        <p className="text-sm font-medium">Voice Message</p>
        <p className="text-xs text-muted-foreground">
          Duration: {formatTime(recordingTime)}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={playRecording}
          disabled={isUploading}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
        <Button size="sm" onClick={handleUpload} disabled={isUploading}>
          {isUploading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
        />
      )}
    </div>
  );
};
