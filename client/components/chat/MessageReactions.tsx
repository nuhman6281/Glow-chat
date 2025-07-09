import React, { useState } from "react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Badge } from "../ui/badge";
import { useAuth } from "../../contexts/AuthContext";
import { messagesApi } from "../../lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Smile } from "lucide-react";
import { EmojiPicker } from "./EmojiPicker";

interface Reaction {
  emoji: string;
  users: string[];
}

interface MessageReactionsProps {
  messageId: string;
  reactions: Reaction[];
  onReactionUpdate?: () => void;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  reactions,
  onReactionUpdate,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddingReaction, setIsAddingReaction] = useState(false);

  const handleAddReaction = async (emoji: string) => {
    if (!user) return;

    setIsAddingReaction(true);
    try {
      const response = await messagesApi.addReaction(messageId, emoji);
      if (response.success) {
        toast.success("Reaction added");
        onReactionUpdate?.();
        // Invalidate messages query to refresh (be more specific if possible)
        queryClient.invalidateQueries({ queryKey: ["messages"] });
      } else {
        toast.error(response.message || "Failed to add reaction");
      }
    } catch (error) {
      toast.error("Failed to add reaction");
    } finally {
      setIsAddingReaction(false);
    }
  };

  const handleRemoveReaction = async (emoji: string) => {
    if (!user) return;

    try {
      const response = await messagesApi.removeReaction(messageId, emoji);
      if (response.success) {
        toast.success("Reaction removed");
        onReactionUpdate?.();
        // Invalidate messages query to refresh (be more specific if possible)
        queryClient.invalidateQueries({ queryKey: ["messages"] });
      } else {
        toast.error(response.message || "Failed to remove reaction");
      }
    } catch (error) {
      toast.error("Failed to remove reaction");
    }
  };

  const handleReactionClick = (emoji: string) => {
    const reaction = reactions.find((r) => r.emoji === emoji);
    const hasReacted = reaction?.users.includes(user?._id || "");

    if (hasReacted) {
      handleRemoveReaction(emoji);
    } else {
      handleAddReaction(emoji);
    }
  };

  if (reactions.length === 0) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-muted-foreground hover:text-foreground"
          >
            <Smile className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <EmojiPicker onEmojiSelect={handleAddReaction}>
            <span />
          </EmojiPicker>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-muted-foreground hover:text-foreground"
          >
            <Smile className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <EmojiPicker onEmojiSelect={handleAddReaction}>
            <span />
          </EmojiPicker>
        </PopoverContent>
      </Popover>
      {reactions.map((reaction) => {
        const hasReacted = reaction.users.includes(user?._id || "");
        return (
          <Badge
            key={reaction.emoji}
            variant={hasReacted ? "default" : "secondary"}
            className={`cursor-pointer text-xs transition-colors ${
              hasReacted
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "hover:bg-muted"
            }`}
            onClick={() => handleReactionClick(reaction.emoji)}
          >
            <span className="mr-1">{reaction.emoji}</span>
            <span>{reaction.users.length}</span>
          </Badge>
        );
      })}
    </div>
  );
};
