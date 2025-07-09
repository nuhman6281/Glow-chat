import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  Upload,
  X,
  File,
  Image,
  Video,
  Music,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export interface FileUploadItem {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
  url?: string;
}

interface FileUploadProps {
  onUploadComplete: (files: FileUploadItem[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
  multiple?: boolean;
  className?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB default
const ACCEPTED_TYPES = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  video: ["video/mp4", "video/webm", "video/ogg"],
  audio: ["audio/mp3", "audio/wav", "audio/ogg"],
  document: ["application/pdf", "text/plain", "application/msword"],
};

export function FileUpload({
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  maxFileSize = MAX_FILE_SIZE,
  acceptedTypes,
  multiple = true,
  className,
}: FileUploadProps) {
  const [uploadItems, setUploadItems] = useState<FileUploadItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size exceeds ${(maxFileSize / 1024 / 1024).toFixed(1)}MB limit`;
    }

    // Check file type if specified
    if (acceptedTypes && acceptedTypes.length > 0) {
      if (!acceptedTypes.includes(file.type)) {
        return `File type ${file.type} is not supported`;
      }
    }

    return null;
  };

  const addFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: FileUploadItem[] = [];
    const errors: string[] = [];

    fileArray.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push({
          id: `${Date.now()}-${Math.random()}`,
          file,
          progress: 0,
          status: "pending",
        });
      }
    });

    if (errors.length > 0) {
      errors.forEach((error) => {
        toast({
          title: "File validation failed",
          description: error,
          variant: "destructive",
        });
      });
    }

    if (validFiles.length > 0) {
      setUploadItems((prev) => {
        const newItems = [...prev, ...validFiles];
        return newItems.slice(0, maxFiles);
      });
    }
  }, [maxFiles, maxFileSize, acceptedTypes, toast]);

  const removeFile = (id: string) => {
    setUploadItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      addFiles(files);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files) {
      addFiles(files);
    }
  };

  const simulateUpload = async (item: FileUploadItem): Promise<void> => {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          setUploadItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    progress: 100,
                    status: "completed",
                    url: URL.createObjectURL(item.file),
                  }
                : i
            )
          );
          resolve();
        } else {
          setUploadItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? { ...i, progress, status: "uploading" }
                : i
            )
          );
        }
      }, 200);
    });
  };

  const uploadFiles = async () => {
    if (uploadItems.length === 0) return;

    setIsUploading(true);
    const pendingItems = uploadItems.filter((item) => item.status === "pending");

    try {
      // Simulate upload for each file
      await Promise.all(
        pendingItems.map(async (item) => {
          try {
            await simulateUpload(item);
          } catch (error) {
            setUploadItems((prev) =>
              prev.map((i) =>
                i.id === item.id
                  ? {
                      ...i,
                      status: "error",
                      error: "Upload failed",
                    }
                  : i
              )
            );
          }
        })
      );

      const completedItems = uploadItems.filter((item) => item.status === "completed");
      if (completedItems.length > 0) {
        onUploadComplete(completedItems);
        toast({
          title: "Upload completed",
          description: `${completedItems.length} file(s) uploaded successfully`,
        });
      }
    } catch (error) {
      onUploadError?.(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <Image className="w-4 h-4" />;
    if (file.type.startsWith("video/")) return <Video className="w-4 h-4" />;
    if (file.type.startsWith("audio/")) return <Music className="w-4 h-4" />;
    if (file.type === "application/pdf" || file.type.startsWith("text/")) {
      return <FileText className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          "border-2 border-dashed p-6 text-center transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag and drop files here, or{" "}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-primary hover:underline"
          >
            browse
          </button>
        </p>
        <p className="text-xs text-muted-foreground">
          Max {maxFiles} files, {formatFileSize(maxFileSize)} each
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes?.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />
      </Card>

      {/* File List */}
      {uploadItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {uploadItems.length} file(s) selected
            </h3>
            <Button
              onClick={uploadFiles}
              disabled={isUploading || uploadItems.every((item) => item.status !== "pending")}
              size="sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload All
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            {uploadItems.map((item) => (
              <Card key={item.id} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {getFileIcon(item.file)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">
                        {item.file.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(item.file.size)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(item.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <Progress value={item.progress} className="h-1" />
                    
                    <div className="flex items-center gap-2 mt-1">
                      {item.status === "pending" && (
                        <span className="text-xs text-muted-foreground">Ready to upload</span>
                      )}
                      {item.status === "uploading" && (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="text-xs text-muted-foreground">
                            Uploading... {Math.round(item.progress)}%
                          </span>
                        </>
                      )}
                      {item.status === "completed" && (
                        <>
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-green-600">Uploaded</span>
                        </>
                      )}
                      {item.status === "error" && (
                        <>
                          <AlertCircle className="w-3 h-3 text-red-500" />
                          <span className="text-xs text-red-600">
                            {item.error || "Upload failed"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}