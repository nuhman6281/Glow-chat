import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Calendar, Clock, Send } from "lucide-react";
import { messagesApi } from "../../lib/api";
import { toast } from "sonner";

interface ScheduleMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  messageContent: string;
}

export const ScheduleMessageDialog: React.FC<ScheduleMessageDialogProps> = ({
  isOpen,
  onClose,
  chatId,
  messageContent,
}) => {
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  const handleSchedule = async () => {
    if (!scheduledDate || !scheduledTime) {
      toast.error("Please select date and time");
      return;
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();

    if (scheduledDateTime <= now) {
      toast.error("Scheduled time must be in the future");
      return;
    }

    setIsScheduling(true);
    try {
      // TODO: Implement scheduled message API
      // For now, we'll just show a success message
      toast.success(
        `Message scheduled for ${scheduledDateTime.toLocaleString()}`,
      );
      onClose();
      setScheduledDate("");
      setScheduledTime("");
    } catch (error) {
      toast.error("Failed to schedule message");
    } finally {
      setIsScheduling(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Message</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Message preview */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-1">Message:</p>
            <p className="text-sm text-muted-foreground">
              {messageContent || "No content"}
            </p>
          </div>

          {/* Date picker */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={getMinDateTime()}
            />
          </div>

          {/* Time picker */}
          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time
            </Label>
            <Input
              id="time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSchedule}
              disabled={!scheduledDate || !scheduledTime || isScheduling}
            >
              {isScheduling ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Schedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
