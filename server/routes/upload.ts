import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { authenticate } from "../middleware/auth";
import { config } from "../config/config";
import User from "../models/User";
import Message from "../models/Message";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Allow images, videos, audio, and documents
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/ogg",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize, // 10MB default
  },
});

// Upload avatar
router.post("/avatar", authenticate, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const userId = req.userId;
    const filePath = req.file.path;
    const fileName = req.file.filename;

    // Update user's avatar
    await User.findByIdAndUpdate(userId, {
      avatar: `/uploads/${fileName}`,
    });

    res.json({
      success: true,
      message: "Avatar uploaded successfully",
      data: {
        avatarUrl: `/uploads/${fileName}`,
      },
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload avatar",
    });
  }
});

// Upload media for messages
router.post("/media", authenticate, upload.single("media"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const fileName = req.file.filename;
    const fileSize = req.file.size;
    const mimeType = req.file.mimetype;

    // Determine file type
    let fileType: "image" | "file" | "voice" | "video" = "file";
    if (mimeType.startsWith("image/")) {
      fileType = "image";
    } else if (mimeType.startsWith("video/")) {
      fileType = "video";
    } else if (mimeType.startsWith("audio/")) {
      fileType = "voice";
    }

    res.json({
      success: true,
      message: "Media uploaded successfully",
      data: {
        fileUrl: `/uploads/${fileName}`,
        fileName: req.file.originalname,
        fileSize,
        mimeType,
        fileType,
      },
    });
  } catch (error) {
    console.error("Media upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload media",
    });
  }
});

// Serve uploaded files
router.get("/uploads/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), "uploads", filename);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({
      success: false,
      message: "File not found",
    });
  }
});

export default router;