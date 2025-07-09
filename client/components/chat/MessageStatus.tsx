import React from "react";
import { Check, CheckCheck } from "lucide-react";
import { cn } from "../../lib/utils";

interface MessageStatusProps {
  status: "sending" | "sent" | "delivered" | "read" | "failed";
  className?: string;
}

export const MessageStatus: React.FC<MessageStatusProps> = ({
  status,
  className,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case "sending":
        return (
          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
        );
      case "sent":
        return <Check className="w-3 h-3" />;
      case "delivered":
        return <CheckCheck className="w-3 h-3" />;
      case "read":
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case "failed":
        return <span className="text-red-500 text-xs">!</span>;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "sending":
        return "Sending...";
      case "sent":
        return "Sent";
      case "delivered":
        return "Delivered";
      case "read":
        return "Read";
      case "failed":
        return "Failed to send";
      default:
        return "";
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs text-muted-foreground",
        className,
      )}
    >
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </div>
  );
};
