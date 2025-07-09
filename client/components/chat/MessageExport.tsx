import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Calendar as CalendarIcon,
  FileText,
  FileDown,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format as formatDate } from "date-fns";
import { messagesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

interface MessageExportProps {
  chatId: string;
  chatName: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function MessageExport({
  chatId,
  chatName,
  isOpen,
  onClose,
  className,
}: MessageExportProps) {
  const [exportFormat, setExportFormat] = useState<"json" | "pdf" | "txt">(
    "txt",
  );
  const [dateRange, setDateRange] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({
    start: undefined,
    end: undefined,
  });
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await messagesApi.exportMessages(
        chatId,
        exportFormat,
        dateRange.start && dateRange.end ? dateRange : undefined,
      );

      if (response.success && response.data) {
        // Create download link
        const link = document.createElement("a");
        link.href = response.data.downloadUrl;
        link.download = `${chatName}-messages.${exportFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Export successful",
          description: `Messages exported as ${exportFormat.toUpperCase()}`,
        });

        onClose();
      } else {
        toast({
          title: "Export failed",
          description: response.message || "Failed to export messages",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "An error occurred while exporting messages",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatOptions = [
    { value: "txt", label: "Text File (.txt)", icon: FileText },
    { value: "json", label: "JSON File (.json)", icon: FileDown },
    { value: "pdf", label: "PDF Document (.pdf)", icon: FileDown },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-md w-full", className)}>
        <DialogHeader>
          <DialogTitle>Export Messages</DialogTitle>
        </DialogHeader>
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-4 top-4 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogClose>
        <div className="p-3 bg-muted/30 rounded-lg mb-4">
          <p className="text-sm font-medium">{chatName}</p>
          <p className="text-xs text-muted-foreground">
            Export messages from this chat
          </p>
        </div>
        <div className="space-y-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Export Format</label>
            <Select
              value={exportFormat}
              onValueChange={(value: any) => setExportFormat(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Date Range Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range (Optional)</label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange.start && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.start ? (
                      formatDate(dateRange.start, "PPP")
                    ) : (
                      <span>Start date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.start}
                    onSelect={(date) =>
                      setDateRange((prev) => ({ ...prev, start: date }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange.end && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.end ? (
                      formatDate(dateRange.end, "PPP")
                    ) : (
                      <span>End date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.end}
                    onSelect={(date) =>
                      setDateRange((prev) => ({ ...prev, end: date }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {dateRange.start && dateRange.end && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {formatDate(dateRange.start, "MMM d")} -{" "}
                  {formatDate(dateRange.end, "MMM d, yyyy")}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDateRange({ start: undefined, end: undefined })
                  }
                  className="h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Export Options Info */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">What's included:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Message content and timestamps</li>
              <li>• Sender information</li>
              <li>• Message reactions</li>
              <li>• File attachments (links)</li>
              {exportFormat === "json" && <li>• Full message metadata</li>}
              {exportFormat === "pdf" && (
                <li>• Formatted document with styling</li>
              )}
            </ul>
          </div>
        </div>
        <div className="pt-4 border-t mt-4 flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
