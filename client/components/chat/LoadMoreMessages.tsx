import React from "react";
import { Button } from "../ui/button";
import { Loader2, ChevronUp } from "lucide-react";
import { cn } from "../../lib/utils";

interface LoadMoreMessagesProps {
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  className?: string;
}

export const LoadMoreMessages: React.FC<LoadMoreMessagesProps> = ({
  isLoading,
  hasMore,
  onLoadMore,
  className,
}) => {
  if (!hasMore) return null;

  return (
    <div className={cn("flex justify-center py-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onLoadMore}
        disabled={isLoading}
        className="text-xs"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <ChevronUp className="w-3 h-3 mr-1" />
            Load more messages
          </>
        )}
      </Button>
    </div>
  );
};
