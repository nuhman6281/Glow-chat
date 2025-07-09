import express from "express";
import { body, param, query } from "express-validator";
import { authenticate } from "../middleware/auth";
import FriendRequest from "../models/FriendRequest";
import User from "../models/User";
import { validateRequest } from "../middleware/validation";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Send friend request
router.post(
  "/send",
  [
    body("receiverId")
      .isMongoId()
      .withMessage("Invalid receiver ID format"),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { receiverId } = req.body;
      const senderId = req.user._id;

      // Check if receiver exists
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if sender is trying to send request to themselves
      if (senderId.toString() === receiverId) {
        return res.status(400).json({
          success: false,
          message: "Cannot send friend request to yourself",
        });
      }

      // Check if friend request already exists
      const existingRequest = await FriendRequest.findOne({
        $or: [
          { sender: senderId, receiver: receiverId },
          { sender: receiverId, receiver: senderId },
        ],
      });

      if (existingRequest) {
        if (existingRequest.status === "pending") {
          return res.status(400).json({
            success: false,
            message: "Friend request already sent",
          });
        } else if (existingRequest.status === "accepted") {
          return res.status(400).json({
            success: false,
            message: "Users are already friends",
          });
        }
      }

      // Create new friend request
      const friendRequest = new FriendRequest({
        sender: senderId,
        receiver: receiverId,
        status: "pending",
      });

      await friendRequest.save();
      await friendRequest.populate([
        { path: "sender", select: "firstName lastName username avatar" },
        { path: "receiver", select: "firstName lastName username avatar" },
      ]);

      res.status(201).json({
        success: true,
        message: "Friend request sent successfully",
        data: { friendRequest },
      });
    } catch (error) {
      console.error("Send friend request error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send friend request",
      });
    }
  }
);

// Accept friend request
router.post(
  "/accept/:requestId",
  [
    param("requestId")
      .isMongoId()
      .withMessage("Invalid request ID format"),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const userId = req.user._id;

      const friendRequest = await FriendRequest.findOne({
        _id: requestId,
        receiver: userId,
        status: "pending",
      });

      if (!friendRequest) {
        return res.status(404).json({
          success: false,
          message: "Friend request not found or already processed",
        });
      }

      // Update friend request status
      friendRequest.status = "accepted";
      friendRequest.acceptedAt = new Date();
      await friendRequest.save();

      // Add users to each other's contacts
      const senderId = friendRequest.sender;
      const receiverId = friendRequest.receiver;

      await User.findByIdAndUpdate(senderId, {
        $addToSet: { contacts: receiverId },
      });

      await User.findByIdAndUpdate(receiverId, {
        $addToSet: { contacts: senderId },
      });

      await friendRequest.populate([
        { path: "sender", select: "firstName lastName username avatar" },
        { path: "receiver", select: "firstName lastName username avatar" },
      ]);

      res.json({
        success: true,
        message: "Friend request accepted",
        data: { friendRequest },
      });
    } catch (error) {
      console.error("Accept friend request error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to accept friend request",
      });
    }
  }
);

// Reject friend request
router.post(
  "/reject/:requestId",
  [
    param("requestId")
      .isMongoId()
      .withMessage("Invalid request ID format"),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const userId = req.user._id;

      const friendRequest = await FriendRequest.findOne({
        _id: requestId,
        receiver: userId,
        status: "pending",
      });

      if (!friendRequest) {
        return res.status(404).json({
          success: false,
          message: "Friend request not found or already processed",
        });
      }

      // Update friend request status
      friendRequest.status = "rejected";
      friendRequest.rejectedAt = new Date();
      await friendRequest.save();

      await friendRequest.populate([
        { path: "sender", select: "firstName lastName username avatar" },
        { path: "receiver", select: "firstName lastName username avatar" },
      ]);

      res.json({
        success: true,
        message: "Friend request rejected",
        data: { friendRequest },
      });
    } catch (error) {
      console.error("Reject friend request error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reject friend request",
      });
    }
  }
);

// Cancel friend request (sender can cancel pending request)
router.post(
  "/cancel/:requestId",
  [
    param("requestId")
      .isMongoId()
      .withMessage("Invalid request ID format"),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const userId = req.user._id;

      const friendRequest = await FriendRequest.findOne({
        _id: requestId,
        sender: userId,
        status: "pending",
      });

      if (!friendRequest) {
        return res.status(404).json({
          success: false,
          message: "Friend request not found or cannot be cancelled",
        });
      }

      await FriendRequest.findByIdAndDelete(requestId);

      res.json({
        success: true,
        message: "Friend request cancelled",
      });
    } catch (error) {
      console.error("Cancel friend request error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cancel friend request",
      });
    }
  }
);

// Get received friend requests
router.get(
  "/received",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const friendRequests = await FriendRequest.find({
        receiver: userId,
        status: "pending",
      })
        .populate("sender", "firstName lastName username avatar status lastSeen")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await FriendRequest.countDocuments({
        receiver: userId,
        status: "pending",
      });

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          friendRequests,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        },
      });
    } catch (error) {
      console.error("Get received friend requests error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get friend requests",
      });
    }
  }
);

// Get sent friend requests
router.get(
  "/sent",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const friendRequests = await FriendRequest.find({
        sender: userId,
        status: { $in: ["pending", "accepted", "rejected"] },
      })
        .populate("receiver", "firstName lastName username avatar status lastSeen")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await FriendRequest.countDocuments({
        sender: userId,
        status: { $in: ["pending", "accepted", "rejected"] },
      });

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          friendRequests,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        },
      });
    } catch (error) {
      console.error("Get sent friend requests error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get sent friend requests",
      });
    }
  }
);

// Get friend request by ID
router.get(
  "/:requestId",
  [
    param("requestId")
      .isMongoId()
      .withMessage("Invalid request ID format"),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const userId = req.user._id;

      const friendRequest = await FriendRequest.findOne({
        _id: requestId,
        $or: [{ sender: userId }, { receiver: userId }],
      }).populate([
        { path: "sender", select: "firstName lastName username avatar" },
        { path: "receiver", select: "firstName lastName username avatar" },
      ]);

      if (!friendRequest) {
        return res.status(404).json({
          success: false,
          message: "Friend request not found",
        });
      }

      res.json({
        success: true,
        data: { friendRequest },
      });
    } catch (error) {
      console.error("Get friend request error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get friend request",
      });
    }
  }
);

export default router;