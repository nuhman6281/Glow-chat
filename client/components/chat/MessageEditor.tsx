import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { X, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Message } from "@shared/api";

interface MessageEditorProps {
  message: Message;
  onSave: (messageId: string, newContent: string) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

export function MessageEditor({
  message,
  onSave,
  onCancel,
  className,
}: MessageEditorProps) {
  const [content, setContent] = useState(message.content || "");
  const [isLoading, setIsLoading] = useState(false);
  const [originalContent] = useState(message.content || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Focus and select all text when editor opens
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  const handleSave = async () => {
    if (!content.trim() || content === originalContent) {
      onCancel();
      return;
    }

    setIsLoading(true);
    try {
      await onSave(message._id, content.trim());
    } catch (error) {
      console.error("Failed to save message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setContent(originalContent);
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const hasChanges = content !== originalContent;
  const isEmpty = !content.trim();

  return (
    <Card
      className={cn(
        "p-3 border-2 border-primary/20 bg-background/95 backdrop-blur-sm",
        className,
      )}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="font-medium">Editing message</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Edit your message..."
          className="min-h-[80px] resize-none border-0 focus-visible:ring-1 focus-visible:ring-primary"
          disabled={isLoading}
        />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Press Enter to save, Esc to cancel</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isLoading}
              className="h-8"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Cancel
            </Button>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={isLoading || isEmpty || !hasChanges}
              className="h-8"
            >
              <Check className="h-3 w-3 mr-1" />
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
