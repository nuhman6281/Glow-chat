import express from "express";
import { body, query, validationResult } from "express-validator";
import Message from "../models/Message";
import Chat from "../models/Chat";
import { authenticate } from "../middleware/auth";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Rate limiting for message routes
const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // limit each IP to 50 messages per minute
  message: "Too many messages, please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting and authentication to all message routes
router.use(messageLimiter);
router.use(authenticate);

// Get messages for a chat
router.get(
  "/chat/:chatId",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("before")
      .optional()
      .isISO8601()
      .withMessage("Before must be a valid ISO 8601 date"),
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
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const before = req.query.before as string;
      const userId = req.userId;

      if (!chatId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: "Invalid chat ID format",
        });
      }

      // Verify user is participant in the chat
      const chat = await Chat.findOne({
        _id: chatId,
        "participants.user": userId,
      });

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: "Chat not found or access denied",
        });
      }

      // Build query
      const query: any = { chat: chatId };
      if (before) {
        query.createdAt = { $lt: new Date(before) };
      }

      // Get messages with pagination
      const skip = (page - 1) * limit;
      const messages = await Message.find(query)
        .populate("sender", "firstName lastName username avatar")
        .sort({ createdAt: -1 }) // Most recent first
        .skip(skip)
        .limit(limit);

      const total = await Message.countDocuments(query);

      res.json({
        success: true,
        data: {
          messages: messages.reverse(), // Reverse to show oldest first
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + messages.length < total,
          },
        },
      });
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Send a new message
router.post(
  "/",
  [
    body("chatId")
      .isMongoId()
      .withMessage("Chat ID must be a valid MongoDB ID"),
    body("content")
      .isLength({ min: 1, max: 5000 })
      .withMessage("Message content must be between 1 and 5000 characters"),
    body("type")
      .optional()
      .isIn(["text", "image", "file", "audio", "video"])
      .withMessage(
        "Message type must be one of: text, image, file, audio, video",
      ),
    body("metadata")
      .optional()
      .isObject()
      .withMessage("Metadata must be an object"),
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

      const { chatId, content, type = "text", metadata } = req.body;
      const userId = req.userId;

      // Verify user is participant in the chat
      const chat = await Chat.findOne({
        _id: chatId,
        "participants.user": userId,
      });

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: "Chat not found or access denied",
        });
      }

      // Create new message
      const message = new Message({
        chat: chatId,
        sender: userId,
        content,
        type,
        metadata,
      });

      await message.save();

      // Update chat's last message and timestamp
      chat.lastMessage = message._id as any;
      chat.updatedAt = new Date();
      await chat.save();

      // Populate sender info before sending response
      await message.populate("sender", "firstName lastName username avatar");

      res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: { message },
      });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Get message by ID
router.get("/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    if (!messageId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID format",
      });
    }

    // Find message and verify user has access
    const message = await Message.findById(messageId).populate(
      "sender",
      "firstName lastName username avatar",
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Verify user is participant in the chat
    const chat = await Chat.findOne({
      _id: message.chat,
      participants: userId,
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      data: { message },
    });
  } catch (error) {
    console.error("Get message error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update message (edit)
router.put(
  "/:messageId",
  [
    body("content")
      .isLength({ min: 1, max: 5000 })
      .withMessage("Message content must be between 1 and 5000 characters"),
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

      const { messageId } = req.params;
      const { content } = req.body;
      const userId = req.userId;

      if (!messageId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: "Invalid message ID format",
        });
      }

      // Find message and verify ownership
      const message = await Message.findOne({
        _id: messageId,
        sender: userId,
      });

      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found or access denied",
        });
      }

      // Check if message is too old to edit (15 minutes)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      if (message.createdAt < fifteenMinutesAgo) {
        return res.status(400).json({
          success: false,
          message: "Message is too old to edit",
        });
      }

      // Update message
      message.content = content;
      message.isEdited = true;
      message.editedAt = new Date();
      await message.save();

      await message.populate("sender", "firstName lastName username avatar");

      res.json({
        success: true,
        message: "Message updated successfully",
        data: { message },
      });
    } catch (error) {
      console.error("Update message error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Delete message
router.delete("/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    if (!messageId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID format",
      });
    }

    // Find message and verify ownership
    const message = await Message.findOne({
      _id: messageId,
      sender: userId,
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found or access denied",
      });
    }

    // Delete message
    await Message.findByIdAndDelete(messageId);

    // Update chat's last message if this was the last message
    const chat = await Chat.findById(message.chat);
    if (chat && chat.lastMessage?.toString() === messageId) {
      const lastMessage = await Message.findOne({ chat: message.chat }).sort({
        createdAt: -1,
      });

      chat.lastMessage = (lastMessage?._id as any) || null;
      await chat.save();
    }

    res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Mark messages as read
router.patch(
  "/read",
  [
    body("messageIds")
      .isArray({ min: 1 })
      .withMessage("Message IDs must be an array with at least 1 ID"),
    body("messageIds.*")
      .isMongoId()
      .withMessage("Each message ID must be a valid MongoDB ID"),
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

      const { messageIds } = req.body;
      const userId = req.userId;

      // Find messages and verify user has access to them
      const messages = await Message.find({ _id: { $in: messageIds } });

      // Get unique chat IDs from messages
      const chatIds = [...new Set(messages.map((msg) => msg.chat.toString()))];

      // Verify user is participant in all chats
      const userChats = await Chat.find({
        _id: { $in: chatIds },
        participants: userId,
      });

      if (userChats.length !== chatIds.length) {
        return res.status(403).json({
          success: false,
          message: "Access denied to some messages",
        });
      }

      // Mark messages as read by adding user to readBy array
      await Message.updateMany(
        {
          _id: { $in: messageIds },
          readBy: { $ne: userId }, // Only update if not already read
        },
        {
          $addToSet: { readBy: userId },
        },
      );

      res.json({
        success: true,
        message: "Messages marked as read",
      });
    } catch (error) {
      console.error("Mark messages as read error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Search messages in a chat
router.get(
  "/chat/:chatId/search",
  [
    query("q")
      .isLength({ min: 1, max: 100 })
      .withMessage("Search query must be between 1 and 100 characters"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
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
      const { q: query, limit = 20 } = req.query;
      const userId = req.userId;

      if (!chatId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: "Invalid chat ID format",
        });
      }

      // Verify user is participant in the chat
      const chat = await Chat.findOne({
        _id: chatId,
        participants: userId,
      });

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: "Chat not found or access denied",
        });
      }

      // Search messages
      const messages = await Message.find({
        chatId,
        content: { $regex: query, $options: "i" },
      })
        .populate("senderId", "firstName lastName username avatar")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit as string));

      res.json({
        success: true,
        data: {
          messages,
          total: messages.length,
        },
      });
    } catch (error) {
      console.error("Search messages error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Add reaction to message
router.post(
  "/:messageId/reactions",
  [
    body("emoji")
      .isLength({ min: 1, max: 10 })
      .withMessage("Emoji must be between 1 and 10 characters"),
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

      const { messageId } = req.params;
      const { emoji } = req.body;
      const userId = req.userId;

      const message = await Message.findById(messageId);
      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      // Check if user already reacted with this emoji
      const existingReaction = message.reactions.find(
        (r) => r.emoji === emoji && r.users.includes(userId),
      );

      if (existingReaction) {
        return res.status(400).json({
          success: false,
          message: "You have already reacted with this emoji",
        });
      }

      // Add or update reaction
      const reactionIndex = message.reactions.findIndex(
        (r) => r.emoji === emoji,
      );
      if (reactionIndex >= 0) {
        message.reactions[reactionIndex].users.push(userId);
      } else {
        message.reactions.push({ emoji, users: [userId] });
      }

      await message.save();
      await message.populate("sender", "firstName lastName username avatar");

      res.json({
        success: true,
        message: "Reaction added successfully",
        data: { message },
      });
    } catch (error) {
      console.error("Add reaction error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Remove reaction from message
router.delete("/:messageId/reactions/:emoji", async (req, res) => {
  try {
    const { messageId, emoji } = req.params;
    const userId = req.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Find and remove user from reaction
    const reactionIndex = message.reactions.findIndex((r) => r.emoji === emoji);
    if (reactionIndex >= 0) {
      const userIndex = message.reactions[reactionIndex].users.indexOf(userId);
      if (userIndex >= 0) {
        message.reactions[reactionIndex].users.splice(userIndex, 1);

        // Remove reaction if no users left
        if (message.reactions[reactionIndex].users.length === 0) {
          message.reactions.splice(reactionIndex, 1);
        }
      }
    }

    await message.save();
    await message.populate("sender", "firstName lastName username avatar");

    res.json({
      success: true,
      message: "Reaction removed successfully",
      data: { message },
    });
  } catch (error) {
    console.error("Remove reaction error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Forward message to other chats
router.post(
  "/:messageId/forward",
  [
    body("targetChatIds")
      .isArray({ min: 1 })
      .withMessage("At least one target chat is required"),
    body("targetChatIds.*").isMongoId().withMessage("Invalid chat ID format"),
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

      const { messageId } = req.params;
      const { targetChatIds } = req.body;
      const userId = req.userId;

      const originalMessage = await Message.findById(messageId);
      if (!originalMessage) {
        return res.status(404).json({
          success: false,
          message: "Original message not found",
        });
      }

      // Verify user has access to target chats
      const targetChats = await Chat.find({
        _id: { $in: targetChatIds },
        "participants.user": userId,
      });

      if (targetChats.length !== targetChatIds.length) {
        return res.status(403).json({
          success: false,
          message: "Access denied to one or more target chats",
        });
      }

      // Create forwarded messages
      const forwardedMessages = [];
      for (const chatId of targetChatIds) {
        const forwardedMessage = new Message({
          chat: chatId,
          sender: userId,
          content: originalMessage.content,
          type: originalMessage.type,
          file: originalMessage.file,
          replyTo: originalMessage.replyTo,
          metadata: {
            ...originalMessage.metadata,
            forwardedFrom: {
              messageId: originalMessage._id,
              chatId: originalMessage.chat,
              sender: originalMessage.sender,
            },
          },
        });

        await forwardedMessage.save();
        await forwardedMessage.populate(
          "sender",
          "firstName lastName username avatar",
        );
        forwardedMessages.push(forwardedMessage);

        // Update chat's last message
        const chat = await Chat.findById(chatId);
        if (chat) {
          chat.lastMessage = forwardedMessage._id as any;
          chat.updatedAt = new Date();
          await chat.save();
        }
      }

      res.json({
        success: true,
        message: "Message forwarded successfully",
        data: { messages: forwardedMessages },
      });
    } catch (error) {
      console.error("Forward message error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Pin/unpin message
router.patch(
  "/:messageId/pin",
  [body("pinned").isBoolean().withMessage("Pinned must be a boolean value")],
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

      const { messageId } = req.params;
      const { pinned } = req.body;
      const userId = req.userId;

      const message = await Message.findById(messageId);
      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      // Check if user has permission to pin messages in this chat
      const chat = await Chat.findOne({
        _id: message.chat,
        "participants.user": userId,
      });

      if (!chat) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Update message pinned status
      message.metadata = {
        ...message.metadata,
        pinned,
        pinnedBy: pinned ? userId : undefined,
        pinnedAt: pinned ? new Date() : undefined,
      };

      await message.save();
      await message.populate("sender", "firstName lastName username avatar");

      res.json({
        success: true,
        message: `Message ${pinned ? "pinned" : "unpinned"} successfully`,
        data: { message },
      });
    } catch (error) {
      console.error("Pin message error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Get pinned messages for a chat
router.get("/chat/:chatId/pinned", async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    // Verify user is participant in the chat
    const chat = await Chat.findOne({
      _id: chatId,
      "participants.user": userId,
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found or access denied",
      });
    }

    const pinnedMessages = await Message.find({
      chat: chatId,
      "metadata.pinned": true,
    })
      .populate("sender", "firstName lastName username avatar")
      .sort({ "metadata.pinnedAt": -1 });

    res.json({
      success: true,
      data: { messages: pinnedMessages },
    });
  } catch (error) {
    console.error("Get pinned messages error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Search messages
router.get(
  "/search",
  [
    query("q").isLength({ min: 1 }).withMessage("Search query is required"),
    query("chatId")
      .optional()
      .isMongoId()
      .withMessage("Invalid chat ID format"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
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

      const { q: query, chatId, page = 1, limit = 20 } = req.query;
      const userId = req.userId;

      // Build search query
      const searchQuery: any = {
        $text: { $search: query as string },
      };

      if (chatId) {
        // Verify user has access to the chat
        const chat = await Chat.findOne({
          _id: chatId,
          "participants.user": userId,
        });

        if (!chat) {
          return res.status(403).json({
            success: false,
            message: "Access denied to chat",
          });
        }

        searchQuery.chat = chatId;
      } else {
        // Search across all user's chats
        const userChats = await Chat.find({
          "participants.user": userId,
        }).select("_id");

        searchQuery.chat = { $in: userChats.map((c) => c._id) };
      }

      const skip = (Number(page) - 1) * Number(limit);
      const messages = await Message.find(searchQuery)
        .populate("sender", "firstName lastName username avatar")
        .populate("chat", "name type")
        .sort({ score: { $meta: "textScore" } })
        .skip(skip)
        .limit(Number(limit));

      const total = await Message.countDocuments(searchQuery);

      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error("Search messages error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

export default router;
