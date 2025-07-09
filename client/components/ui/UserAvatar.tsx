import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  imageUrl?: string;
  status?: "online" | "away" | "offline";
  className?: string;
  showStatus?: boolean;
  onClick?: () => void;
}

export function UserAvatar({
  name,
  imageUrl,
  status = "offline",
  className,
  showStatus = true,
  onClick,
}: UserAvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const statusColors = {
    online: "bg-status-online",
    away: "bg-status-away",
    offline: "bg-status-offline",
  };

  return (
    <div
      className={cn("relative", className, onClick && "cursor-pointer")}
      onClick={onClick}
    >
      <div
        className={cn(
          "rounded-full bg-muted flex items-center justify-center text-sm font-medium",
          className,
        )}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="text-muted-foreground">{initials}</span>
        )}
      </div>

      {showStatus && (
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
            statusColors[status],
          )}
        />
      )}
    </div>
  );
}
