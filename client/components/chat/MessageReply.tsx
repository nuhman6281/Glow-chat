import React from "react";
import { cn } from "@/lib/utils";
import { Message } from "@shared/api";

interface MessageReplyProps {
  replyTo: Message;
  className?: string;
}

export const MessageReply: React.FC<MessageReplyProps> = ({
  replyTo,
  className,
}) => {
  const sender = typeof replyTo.sender === "object" ? replyTo.sender : null;
  const senderName = sender
    ? `${sender.firstName} ${sender.lastName}`
    : "Unknown";

  const getReplyContent = () => {
    if (replyTo.type === "text" && replyTo.content) {
      return replyTo.content;
    }
    if (replyTo.type === "image") {
      return "📷 Image";
    }
    if (replyTo.type === "file" && replyTo.file) {
      return `📎 ${replyTo.file.name}`;
    }
    if (replyTo.type === "voice") {
      return "🎤 Voice message";
    }
    return "Message";
  };

  return (
    <div
      className={cn(
        "border-l-2 border-primary/30 pl-3 py-1 mb-2 bg-muted/30 rounded-r",
        className,
      )}
    >
      <div className="text-xs text-muted-foreground mb-1">
        Replying to {senderName}
      </div>
      <div className="text-sm truncate">{getReplyContent()}</div>
    </div>
  );
};
