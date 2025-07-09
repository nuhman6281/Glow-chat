import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  X,
  File,
  Image,
  Video,
  Music,
  Archive,
  FileText,
  Check,
  AlertCircle,
  Trash2,
  Download,
  Eye,
  Play,
  Pause,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onUploadComplete?: (files: UploadedFile[]) => void;
  onUploadError?: (error: string) => void;
  multiple?: boolean;
  accept?: string;
  maxSize?: number; // in bytes
  maxFiles?: number;
  showPreview?: boolean;
  autoUpload?: boolean;
  className?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnail?: string;
  uploadedAt: Date;
}

interface FileItem {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
  uploadedFile?: UploadedFile;
}

const FILE_TYPE_ICONS = {
  image: Image,
  video: Video,
  audio: Music,
  archive: Archive,
  document: FileText,
  default: File,
};

const FILE_TYPE_COLORS = {
  image: "bg-blue-100 text-blue-700",
  video: "bg-purple-100 text-purple-700",
  audio: "bg-green-100 text-green-700",
  archive: "bg-orange-100 text-orange-700",
  document: "bg-red-100 text-red-700",
  default: "bg-gray-100 text-gray-700",
};

export function FileUpload({
  onUploadComplete,
  onUploadError,
  multiple = true,
  accept,
  maxSize = 50 * 1024 * 1024, // 50MB default
  maxFiles = 10,
  showPreview = true,
  autoUpload = true,
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Get file type category
  const getFileType = (file: File) => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
    if (file.type.includes("zip") || file.type.includes("rar") || file.type.includes("tar")) return "archive";
    if (file.type.includes("pdf") || file.type.includes("document") || file.type.includes("text")) return "document";
    return "default";
  };

  // Get file icon
  const getFileIcon = (file: File) => {
    const type = getFileType(file);
    return FILE_TYPE_ICONS[type] || FILE_TYPE_ICONS.default;
  };

  // Get file color
  const getFileColor = (file: File) => {
    const type = getFileType(file);
    return FILE_TYPE_COLORS[type] || FILE_TYPE_COLORS.default;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Validate file
  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File size exceeds ${formatFileSize(maxSize)} limit`;
    }

    // Check file type if accept is specified
    if (accept) {
      const acceptedTypes = accept.split(",").map(type => type.trim());
      const isValidType = acceptedTypes.some(type => {
        if (type.startsWith(".")) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return file.type.match(new RegExp(type.replace("*", ".*")));
      });
      
      if (!isValidType) {
        return `File type not allowed. Accepted types: ${accept}`;
      }
    }

    return null;
  };

  // Add files
  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    // Check max files limit
    if (files.length + fileArray.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive",
      });
      return;
    }

    const validFiles: FileItem[] = [];

    fileArray.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        toast({
          title: "Invalid file",
          description: error,
          variant: "destructive",
        });
        return;
      }

      const fileItem: FileItem = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        progress: 0,
        status: "pending",
      };

      validFiles.push(fileItem);
    });

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      
      if (autoUpload) {
        uploadFiles(validFiles);
      }
    }
  }, [files.length, maxFiles, maxSize, accept, autoUpload, toast]);

  // Upload files
  const uploadFiles = async (filesToUpload: FileItem[] = files) => {
    setUploading(true);

    const uploadPromises = filesToUpload.map(async (fileItem) => {
      if (fileItem.status === "completed") return fileItem;

      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? { ...f, status: "uploading" } : f
      ));

      try {
        const response = await uploadApi.uploadMedia(fileItem.file);
        
        if (response.success) {
          const uploadedFile: UploadedFile = {
            id: fileItem.id,
            name: fileItem.file.name,
            size: fileItem.file.size,
            type: fileItem.file.type,
            url: response.data.fileUrl,
            thumbnail: response.data.fileType === "image" ? response.data.fileUrl : undefined,
            uploadedAt: new Date(),
          };

          // Update file status to completed
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, status: "completed", progress: 100, uploadedFile }
              : f
          ));

          return uploadedFile;
        } else {
          throw new Error(response.message || "Upload failed");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Upload failed";
        
        // Update file status to error
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: "error", error: errorMessage }
            : f
        ));

        throw error;
      }
    });

    try {
      const uploadedFiles = await Promise.all(uploadPromises);
      const successfulUploads = uploadedFiles.filter(Boolean) as UploadedFile[];
      
      if (successfulUploads.length > 0) {
        onUploadComplete?.(successfulUploads);
        toast({
          title: "Upload successful",
          description: `${successfulUploads.length} file(s) uploaded successfully`,
        });
      }
    } catch (error) {
      onUploadError?.(error instanceof Error ? error.message : "Upload failed");
      toast({
        title: "Upload failed",
        description: "Some files failed to upload",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Remove file
  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      addFiles(selectedFiles);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  };

  // Handle click on upload area
  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  // Get preview component
  const getFilePreview = (fileItem: FileItem) => {
    const { file, uploadedFile } = fileItem;
    const fileType = getFileType(file);

    if (fileType === "image" && showPreview) {
      const src = uploadedFile?.thumbnail || URL.createObjectURL(file);
      return (
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
          <img
            src={src}
            alt={file.name}
            className="w-full h-full object-cover"
            onLoad={() => {
              if (!uploadedFile) {
                URL.revokeObjectURL(src);
              }
            }}
          />
        </div>
      );
    }

    const Icon = getFileIcon(file);
    return (
      <div className={cn("w-16 h-16 rounded-lg flex items-center justify-center", getFileColor(file))}>
        <Icon className="w-8 h-8" />
      </div>
    );
  };

  const pendingFiles = files.filter(f => f.status === "pending");
  const uploadingFiles = files.filter(f => f.status === "uploading");
  const completedFiles = files.filter(f => f.status === "completed");
  const errorFiles = files.filter(f => f.status === "error");

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-gray-400",
          files.length === 0 && "h-48"
        )}
        onClick={handleUploadAreaClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center h-full p-6">
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to upload
            </p>
            <p className="text-sm text-gray-500">
              {accept ? `Accepted types: ${accept}` : "All file types supported"}
            </p>
            <p className="text-sm text-gray-500">
              Max size: {formatFileSize(maxSize)} • Max files: {maxFiles}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Files ({files.length})</CardTitle>
              <div className="flex items-center gap-2">
                {pendingFiles.length > 0 && (
                  <Button
                    size="sm"
                    onClick={() => uploadFiles(pendingFiles)}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Square className="w-4 h-4 mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload All
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiles([])}
                  disabled={uploading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <div className="space-y-3">
                {files.map((fileItem) => (
                  <div
                    key={fileItem.id}
                    className="flex items-center gap-4 p-3 border rounded-lg"
                  >
                    {/* File Preview */}
                    {getFilePreview(fileItem)}

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{fileItem.file.name}</p>
                        {fileItem.status === "completed" && (
                          <Check className="w-4 h-4 text-green-500" />
                        )}
                        {fileItem.status === "error" && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(fileItem.file.size)}
                      </p>
                      {fileItem.error && (
                        <p className="text-sm text-red-500">{fileItem.error}</p>
                      )}
                    </div>

                    {/* Progress */}
                    {fileItem.status === "uploading" && (
                      <div className="w-24">
                        <Progress value={fileItem.progress} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">
                          {fileItem.progress}%
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {fileItem.status === "completed" && fileItem.uploadedFile && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(fileItem.uploadedFile!.url, "_blank")}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = fileItem.uploadedFile!.url;
                              link.download = fileItem.file.name;
                              link.click();
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(fileItem.id)}
                        disabled={fileItem.status === "uploading"}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

             {/* Summary */}
       {files.length > 0 && (
         <div className="flex items-center gap-4 text-sm">
           <div className="px-2 py-1 text-xs font-medium border border-input bg-background text-foreground rounded-md">
             Total: {files.length}
           </div>
           {pendingFiles.length > 0 && (
             <div className="px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-md">
               Pending: {pendingFiles.length}
             </div>
           )}
           {uploadingFiles.length > 0 && (
             <div className="px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-md">
               Uploading: {uploadingFiles.length}
             </div>
           )}
           {completedFiles.length > 0 && (
             <div className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-md">
               Completed: {completedFiles.length}
             </div>
           )}
           {errorFiles.length > 0 && (
             <div className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-md">
               Failed: {errorFiles.length}
             </div>
           )}
         </div>
       )}
    </div>
  );
}