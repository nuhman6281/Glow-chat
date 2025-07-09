import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Download,
  Eye,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface FilePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    name: string;
    url: string;
    size: number;
    mimeType: string;
    duration?: number;
  };
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("video/")) return Video;
  if (mimeType.startsWith("audio/")) return Music;
  if (mimeType.includes("pdf") || mimeType.includes("document"))
    return FileText;
  if (mimeType.includes("zip") || mimeType.includes("rar")) return Archive;
  return File;
};

const getFileType = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType.startsWith("video/")) return "Video";
  if (mimeType.startsWith("audio/")) return "Audio";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("document")) return "Document";
  if (mimeType.includes("zip") || mimeType.includes("rar")) return "Archive";
  return "File";
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const FilePreview: React.FC<FilePreviewProps> = ({
  isOpen,
  onClose,
  file,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const FileIcon = getFileIcon(file.mimeType);
  const fileType = getFileType(file.mimeType);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = file.url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const renderPreview = () => {
    if (file.mimeType.startsWith("image/")) {
      return (
        <div className="flex justify-center">
          <img
            src={file.url}
            alt={file.name}
            className="max-w-full max-h-96 object-contain rounded"
          />
        </div>
      );
    }

    if (file.mimeType.startsWith("video/")) {
      return (
        <div className="space-y-2">
          <video
            src={file.url}
            controls
            className="w-full max-h-96 rounded"
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {Math.floor(currentTime)}s / {Math.floor(duration)}s
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleMuteToggle}>
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (file.mimeType.startsWith("audio/")) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <Button
              size="lg"
              variant="outline"
              onClick={handlePlayPause}
              className="w-16 h-16 rounded-full"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </Button>
          </div>
          <audio
            src={file.url}
            controls
            className="w-full"
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          />
          {file.duration && (
            <div className="text-center text-sm text-muted-foreground">
              Duration: {Math.floor(file.duration)}s
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-8">
        <FileIcon className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground text-center">
          Preview not available for this file type
        </p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileIcon className="w-5 h-5" />
              {file.name}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* File info */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{fileType}</Badge>
            <Badge variant="outline">{formatFileSize(file.size)}</Badge>
            <Badge variant="outline">{file.mimeType}</Badge>
          </div>

          {/* Preview */}
          <div className="border rounded-lg p-4">{renderPreview()}</div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
