import { useState, useRef } from "react";
import { Send, Paperclip, Smile, Mic, Image, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/contexts/AuthContext";
import { messagesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { MessageReply } from "./MessageReply";
import { Message } from "@shared/api";
import { EmojiPicker } from "./EmojiPicker";
import { VoiceRecorder } from "./VoiceRecorder";
import { ScheduleMessageDialog } from "./ScheduleMessageDialog";

interface MessageInputProps {
  chatId: string;
  onMessageSent?: () => void;
  replyTo?: Message | null;
  onCancelReply?: () => void;
}

export function MessageInput({
  chatId,
  onMessageSent,
  replyTo,
  onCancelReply,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { user, token } = useAuth();
  const { socket, isConnected, emit } = useSocket({
    token: token || "",
    enabled: !!token,
  });
  const { toast } = useToast();

  const handleSend = async () => {
    if (!message.trim() || !chatId || isSending) return;

    setIsSending(true);
    try {
      const messageData = {
        chatId,
        content: message.trim(),
        type: "text" as const,
        replyTo: replyTo?._id,
      };

      // Send via Socket.IO for real-time delivery
      if (isConnected && socket) {
        emit("send_message", messageData);
      } else {
        // Fallback to HTTP API if socket not connected
        await messagesApi.sendMessage(messageData);
      }

      setMessage("");
      // Do not call onMessageSent or refetch here
      // Only clear reply after sending
      if (replyTo && onCancelReply) {
        onCancelReply();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (
    file: File,
    type: "file" | "image" | "voice",
  ) => {
    if (!chatId || isUploading) return;

    setIsUploading(true);
    try {
      const messageData = {
        chatId,
        type,
        file,
        content: type === "file" ? `Shared a file: ${file.name}` : undefined,
      };

      await messagesApi.sendMessage(messageData);
      onMessageSent?.();

      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been shared`,
      });
    } catch (error) {
      console.error("Failed to upload file:", error);
      toast({
        title: "Failed to upload file",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, "file");
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, "image");
    }
  };

  const handleVoiceRecord = () => {
    setShowVoiceRecorder(true);
  };

  return (
    <div className="border-t border-border bg-card p-3 md:p-4 shrink-0">
      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center justify-between mb-2 p-2 bg-muted/50 rounded">
          <MessageReply replyTo={replyTo} />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onCancelReply}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept="*/*"
      />
      <input
        ref={imageInputRef}
        type="file"
        className="hidden"
        onChange={handleImageSelect}
        accept="image/*"
      />

      <div className="flex items-end gap-1.5 md:gap-2">
        {/* Attachment button */}
        <Button
          variant="ghost"
          size="icon"
          className="mb-2 h-8 w-8 md:h-10 md:w-10 shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Paperclip className="w-4 h-4" />
        </Button>

        {/* Message input */}
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="min-h-[40px] max-h-32 resize-none pr-16 md:pr-20 py-2.5 md:py-3 text-sm"
            rows={1}
            disabled={isSending || isUploading}
          />

          {/* Inline actions */}
          <div className="absolute right-2 bottom-2 flex items-center gap-0.5 md:gap-1">
            <EmojiPicker
              onEmojiSelect={(emoji) => setMessage((prev) => prev + emoji)}
            >
              <Button
                variant="ghost"
                size="icon"
                className="w-5 h-5 md:w-6 md:h-6"
              >
                <Smile className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </Button>
            </EmojiPicker>
            <Button
              variant="ghost"
              size="icon"
              className="w-5 h-5 md:w-6 md:h-6"
              onClick={() => imageInputRef.current?.click()}
              disabled={isUploading}
            >
              <Image className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </Button>
          </div>
        </div>

        {/* Send/Voice button */}
        {message.trim() ? (
          <Button
            onClick={handleSend}
            size="icon"
            className="mb-2 h-8 w-8 md:h-10 md:w-10 shrink-0"
            disabled={isSending || isUploading}
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="mb-2 h-8 w-8 md:h-10 md:w-10 shrink-0"
            onClick={handleVoiceRecord}
            disabled={isUploading}
          >
            <Mic className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1.5 md:gap-2 mt-2 overflow-x-auto scrollbar-hide">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-6 md:h-7 whitespace-nowrap"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <File className="w-3 h-3 mr-1" />
          {isUploading ? "Uploading..." : "File"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-6 md:h-7 whitespace-nowrap"
          onClick={() => {
            toast({
              title: "Poll feature",
              description: "Polls coming soon!",
            });
          }}
        >
          📊 Poll
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-6 md:h-7 whitespace-nowrap"
          onClick={() => setShowScheduleDialog(true)}
        >
          ⏰ Schedule
        </Button>
      </div>

      {/* Voice Recorder */}
      {showVoiceRecorder && (
        <VoiceRecorder
          chatId={chatId}
          onRecordingComplete={() => {
            setShowVoiceRecorder(false);
            onMessageSent?.();
          }}
          onCancel={() => setShowVoiceRecorder(false)}
        />
      )}

      {/* Schedule Message Dialog */}
      <ScheduleMessageDialog
        isOpen={showScheduleDialog}
        onClose={() => setShowScheduleDialog(false)}
        chatId={chatId}
        messageContent={message}
      />

      {/* Connection status */}
      {!isConnected && (
        <div className="mt-2 text-xs text-muted-foreground text-center">
          Connecting...
        </div>
      )}
    </div>
  );
}
