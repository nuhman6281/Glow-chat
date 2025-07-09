import express from "express";
import { body, query, validationResult } from "express-validator";
import Chat from "../models/Chat";
import Message from "../models/Message";
import User from "../models/User";
import { authenticate } from "../middleware/auth";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";

const router = express.Router();

// Rate limiting for chat routes
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting and authentication to all chat routes
router.use(chatLimiter);
router.use(authenticate);

// Get all chats for current user
router.get(
  "/",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 200 })
      .withMessage("Limit must be between 1 and 200"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const userId = req.userId;

      // Get chats where user is a participant
      const chats = await Chat.find({
        "participants.user": new mongoose.Types.ObjectId(userId),
      })
        .populate(
          "participants.user",
          "firstName lastName username avatar status",
        )
        .populate({
          path: "lastMessage",
          populate: {
            path: "sender",
            select: "firstName lastName username avatar",
          },
        })
        .sort({ lastActivity: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Chat.countDocuments({
        "participants.user": new mongoose.Types.ObjectId(userId),
      });

      res.json({
        success: true,
        data: {
          chats,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("Get chats error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Create a new chat
router.post("/", async (req, res) => {
  try {
    const { type, participants, name } = req.body;
    const userId = req.userId;

    console.log("Creating chat with:", { type, participants, name, userId });

    console.log(
      "participants raw:",
      participants,
      participants.map((p) => typeof p),
    );
    if (
      !Array.isArray(participants) ||
      participants.some((p) => typeof p !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "Participants must be an array of user ID strings",
        data: { participants },
      });
    }

    console.log("RAW BODY:", req.body);
    let mappedParticipants;
    try {
      mappedParticipants = participants.map((participantId) => ({
        user: new mongoose.Types.ObjectId(participantId),
        role: "member",
        joinedAt: new Date(),
      }));
    } catch (err) {
      console.error("Error mapping participants:", err, participants);
      return res.status(400).json({
        success: false,
        message: "Error mapping participants",
        error: err.message,
        data: { participants },
      });
    }

    // Create new chat with minimal structure
    const chatData = {
      type: type || "direct",
      participants: [
        // Add current user
        {
          user: new mongoose.Types.ObjectId(userId),
          role: "member",
          joinedAt: new Date(),
        },
        // Add other participants
        ...mappedParticipants,
      ],
      name: type === "group" ? name : undefined,
      createdBy: new mongoose.Types.ObjectId(userId),
    };

    console.log("Chat data:", JSON.stringify(chatData, null, 2));

    const chat = new Chat(chatData);
    console.log("Chat object created, saving...");
    await chat.save();
    console.log("Chat saved successfully");

    // Populate the participants with user information
    await chat.populate(
      "participants.user",
      "firstName lastName username avatar status",
    );

    res.status(201).json({
      success: true,
      message: "Chat created successfully",
      data: { chat },
    });
  } catch (error) {
    console.error("Create chat error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Get chat by ID
router.get("/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    if (!chatId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid chat ID format",
      });
    }

    const chat = await Chat.findOne({
      _id: chatId,
      "participants.user": new mongoose.Types.ObjectId(userId),
    }).populate(
      "participants.user",
      "firstName lastName username avatar status",
    );

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found or access denied",
      });
    }

    res.json({
      success: true,
      data: { chat },
    });
  } catch (error) {
    console.error("Get chat error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update chat (name, etc.)
router.put(
  "/:chatId",
  [
    body("name")
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage("Chat name must be between 1 and 100 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { chatId } = req.params;
      const { name } = req.body;
      const userId = req.userId;

      if (!chatId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: "Invalid chat ID format",
        });
      }

      const chat = await Chat.findOneAndUpdate(
        {
          _id: chatId,
          "participants.user": new mongoose.Types.ObjectId(userId),
          type: "group", // Only allow updating group chats
        },
        { name },
        { new: true },
      ).populate("participants", "firstName lastName username avatar status");

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: "Chat not found or access denied",
        });
      }

      res.json({
        success: true,
        message: "Chat updated successfully",
        data: { chat },
      });
    } catch (error) {
      console.error("Update chat error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Add participants to group chat
router.post(
  "/:chatId/participants",
  [
    body("userIds")
      .isArray({ min: 1 })
      .withMessage("User IDs must be an array with at least 1 user"),
    body("userIds.*")
      .isMongoId()
      .withMessage("Each user ID must be a valid MongoDB ID"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { chatId } = req.params;
      const { userIds } = req.body;
      const userId = req.userId;

      if (!chatId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: "Invalid chat ID format",
        });
      }

      // Find the chat and verify user is participant
      const chat = await Chat.findOne({
        _id: chatId,
        "participants.user": new mongoose.Types.ObjectId(userId),
        type: "group",
      });

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: "Chat not found or access denied",
        });
      }

      // Validate that all new users exist
      const existingUsers = await User.find({ _id: { $in: userIds } });
      if (existingUsers.length !== userIds.length) {
        return res.status(400).json({
          success: false,
          message: "Some users do not exist",
        });
      }

      // Add new participants (avoid duplicates)
      const newParticipants = userIds.filter(
        (id) => !chat.participants.includes(id),
      );

      if (newParticipants.length === 0) {
        return res.status(400).json({
          success: false,
          message: "All users are already participants",
        });
      }

      chat.participants.push(...newParticipants);
      await chat.save();

      await chat.populate(
        "participants",
        "firstName lastName username avatar status",
      );

      res.json({
        success: true,
        message: "Participants added successfully",
        data: { chat },
      });
    } catch (error) {
      console.error("Add participants error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Leave chat
router.delete("/:chatId/leave", async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    if (!chatId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid chat ID format",
      });
    }

    const chat = await Chat.findOne({
      _id: chatId,
      "participants.user": new mongoose.Types.ObjectId(userId),
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found or access denied",
      });
    }

    // Remove user from participants
    chat.participants = chat.participants.filter(
      (id) => id.toString() !== userId,
    );

    // If no participants left, delete the chat
    if (chat.participants.length === 0) {
      await Chat.findByIdAndDelete(chatId);
      // Also delete all messages in this chat
      await Message.deleteMany({ chatId });
    } else {
      await chat.save();
    }

    res.json({
      success: true,
      message: "Left chat successfully",
    });
  } catch (error) {
    console.error("Leave chat error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Delete chat (only creator can delete)
router.delete("/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    if (!chatId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid chat ID format",
      });
    }

    const chat = await Chat.findOne({
      _id: chatId,
      createdBy: userId, // Only creator can delete
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found or access denied",
      });
    }

    // Delete the chat and all its messages
    await Chat.findByIdAndDelete(chatId);
    await Message.deleteMany({ chatId });

    res.json({
      success: true,
      message: "Chat deleted successfully",
    });
  } catch (error) {
    console.error("Delete chat error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Test route to create chat without validation
router.post("/test", async (req, res) => {
  try {
    console.log("Test route - creating chat with hardcoded data");

    const chat = new Chat({
      type: "direct",
      participants: [
        {
          user: "686d0da97f4813d328ec6e02",
          role: "member",
          joinedAt: new Date(),
        },
        {
          user: "686d0de47f4813d328ec6e0c",
          role: "member",
          joinedAt: new Date(),
        },
      ],
      createdBy: "686d0da97f4813d328ec6e02",
    });

    console.log("Chat object created:", chat);
    await chat.save();
    console.log("Chat saved successfully");

    res.json({
      success: true,
      message: "Test chat created successfully",
      data: { chat },
    });
  } catch (error) {
    console.error("Test chat creation error:", error);
    res.status(500).json({
      success: false,
      message: "Test chat creation failed",
      error: error.message,
    });
  }
});

export default router;
