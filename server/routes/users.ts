import express from "express";
import { body, query, validationResult, param } from "express-validator";
import User from "../models/User";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import rateLimit from "express-rate-limit";
import FriendRequest from "../models/FriendRequest";

const router = express.Router();

// Rate limiting for user routes
const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting and authentication to all user routes
router.use(userLimiter);
router.use(authenticate);

// Get current user profile
router.get("/me", async (req: AuthenticatedRequest, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: { user: user.toJSON() },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update current user profile
router.put(
  "/me",
  [
    body("firstName")
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage("First name must be between 1 and 50 characters"),
    body("lastName")
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage("Last name must be between 1 and 50 characters"),
    body("username")
      .optional()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be between 3 and 30 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        "Username can only contain letters, numbers, and underscores",
      ),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("bio")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Bio must be less than 500 characters"),
    body("phoneNumber")
      .optional()
      .custom((value) => {
        if (value === undefined || value === null || value === "") {
          return true; // Allow empty/undefined values
        }
        return /^[\+]?[\d\s\-\(\)]+$/.test(value);
      })
      .withMessage("Please provide a valid phone number"),
    body("location")
      .optional()
      .isLength({ max: 100 })
      .withMessage("Location must be less than 100 characters"),
    body("jobTitle")
      .optional()
      .isLength({ max: 100 })
      .withMessage("Job title must be less than 100 characters"),
    body("department")
      .optional()
      .isLength({ max: 100 })
      .withMessage("Department must be less than 100 characters"),
    body("settings")
      .optional()
      .isObject()
      .withMessage("Settings must be an object"),
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

      const {
        firstName,
        lastName,
        username,
        email,
        bio,
        phoneNumber,
        location,
        jobTitle,
        department,
        settings,
      } = req.body;
      const userId = req.userId;

      // Check if email or username is already taken by another user
      if (email || username) {
        const existingUser = await User.findOne({
          _id: { $ne: userId },
          $or: [
            ...(email ? [{ email }] : []),
            ...(username ? [{ username }] : []),
          ],
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message:
              existingUser.email === email
                ? "Email already taken"
                : "Username already taken",
          });
        }
      }

      // Update user
      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (username !== undefined) updateData.username = username;
      if (email !== undefined) updateData.email = email;
      if (bio !== undefined) updateData.bio = bio;
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
      if (location !== undefined) updateData.location = location;
      if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
      if (department !== undefined) updateData.department = department;
      if (settings !== undefined) updateData.settings = settings;

      const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: { user: user.toJSON() },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Search users
router.get(
  "/search",
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

      const { q: query, limit = 20 } = req.query;
      const currentUserId = req.userId;

      // Search users by username, email, firstName, or lastName
      const users = await User.find({
        _id: { $ne: currentUserId }, // Exclude current user
        $or: [
          { username: { $regex: query, $options: "i" } },
          { firstName: { $regex: query, $options: "i" } },
          { lastName: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ],
      })
        .limit(parseInt(limit))
        .select("-__v -createdAt -updatedAt");

      res.json({
        success: true,
        data: {
          users: users.map((user) => user.toJSON()),
          total: users.length,
        },
      });
    } catch (error) {
      console.error("Search users error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Get all users (for contacts list)
router.get(
  "/",
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
      const currentUserId = req.userId;

      // Get users excluding current user
      const users = await User.find({ _id: { $ne: currentUserId } })
        .select("-__v -createdAt -updatedAt")
        .sort({ lastName: 1, firstName: 1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments({ _id: { $ne: currentUserId } });

      res.json({
        success: true,
        data: {
          users: users.map((user) => user.toJSON()),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Get user by ID
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const user = await User.findById(userId).select(
      "-__v -createdAt -updatedAt",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: { user: user.toJSON() },
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update user status
router.patch(
  "/status",
  [
    body("status")
      .isIn(["online", "away", "busy", "offline"])
      .withMessage("Status must be one of: online, away, busy, offline"),
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

      const { status } = req.body;
      const userId = req.userId;

      const user = await User.findByIdAndUpdate(
        userId,
        {
          status,
          lastSeen: status === "offline" ? new Date() : undefined,
        },
        { new: true },
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "Status updated successfully",
        data: { user: user.toJSON() },
      });
    } catch (error) {
      console.error("Update status error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Friend Requests API
router.post("/friend-requests/send", [
  body("receiverId").isMongoId().withMessage("Invalid receiver ID"),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { receiverId } = req.body;
    const senderId = req.userId;

    // Check if users exist
    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId),
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "Friend request already exists",
      });
    }

    // Create friend request
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
      message: "Internal server error",
    });
  }
});

router.post("/friend-requests/accept/:requestId", [
  param("requestId").isMongoId().withMessage("Invalid request ID"),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { requestId } = req.params;
    const userId = req.userId;

    const friendRequest = await FriendRequest.findOne({
      _id: requestId,
      receiver: userId,
      status: "pending",
    });

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
    }

    // Update request status
    friendRequest.status = "accepted";
    friendRequest.acceptedAt = new Date();
    await friendRequest.save();

    // Add users to each other's contacts
    await Promise.all([
      User.findByIdAndUpdate(friendRequest.sender, {
        $addToSet: { contacts: friendRequest.receiver },
      }),
      User.findByIdAndUpdate(friendRequest.receiver, {
        $addToSet: { contacts: friendRequest.sender },
      }),
    ]);

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
      message: "Internal server error",
    });
  }
});

router.post("/friend-requests/reject/:requestId", [
  param("requestId").isMongoId().withMessage("Invalid request ID"),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { requestId } = req.params;
    const userId = req.userId;

    const friendRequest = await FriendRequest.findOne({
      _id: requestId,
      receiver: userId,
      status: "pending",
    });

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
    }

    friendRequest.status = "rejected";
    friendRequest.rejectedAt = new Date();
    await friendRequest.save();

    res.json({
      success: true,
      message: "Friend request rejected",
    });
  } catch (error) {
    console.error("Reject friend request error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.get("/friend-requests/received", async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const friendRequests = await FriendRequest.find({
      receiver: userId,
      status: "pending",
    })
      .populate("sender", "firstName lastName username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await FriendRequest.countDocuments({
      receiver: userId,
      status: "pending",
    });

    res.json({
      success: true,
      data: {
        friendRequests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get received friend requests error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.get("/friend-requests/sent", async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const friendRequests = await FriendRequest.find({
      sender: userId,
    })
      .populate("receiver", "firstName lastName username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await FriendRequest.countDocuments({
      sender: userId,
    });

    res.json({
      success: true,
      data: {
        friendRequests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get sent friend requests error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Contact Management API
router.post("/contacts/add/:userId", [
  param("userId").isMongoId().withMessage("Invalid user ID"),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { userId } = req.params;
    const currentUserId = req.userId;

    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "Cannot add yourself as a contact",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Add to contacts
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { contacts: userId },
    });

    res.json({
      success: true,
      message: "Contact added successfully",
    });
  } catch (error) {
    console.error("Add contact error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.delete("/contacts/remove/:userId", [
  param("userId").isMongoId().withMessage("Invalid user ID"),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { userId } = req.params;
    const currentUserId = req.userId;

    // Remove from contacts
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { contacts: userId },
    });

    res.json({
      success: true,
      message: "Contact removed successfully",
    });
  } catch (error) {
    console.error("Remove contact error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.get("/contacts", async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(userId).populate({
      path: "contacts",
      select: "firstName lastName username avatar status lastSeen",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const contacts = user.contacts || [];
    const total = contacts.length;

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get contacts error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// User Blocking API
router.post("/block/:userId", [
  param("userId").isMongoId().withMessage("Invalid user ID"),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { userId } = req.params;
    const currentUserId = req.userId;

    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "Cannot block yourself",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Add to blocked users
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { blockedUsers: userId },
      $pull: { contacts: userId }, // Remove from contacts if they were a contact
    });

    res.json({
      success: true,
      message: "User blocked successfully",
    });
  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.post("/unblock/:userId", [
  param("userId").isMongoId().withMessage("Invalid user ID"),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { userId } = req.params;
    const currentUserId = req.userId;

    // Remove from blocked users
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { blockedUsers: userId },
    });

    res.json({
      success: true,
      message: "User unblocked successfully",
    });
  } catch (error) {
    console.error("Unblock user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.get("/blocked", async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(userId).populate({
      path: "blockedUsers",
      select: "firstName lastName username avatar",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const blockedUsers = user.blockedUsers || [];
    const total = blockedUsers.length;

    res.json({
      success: true,
      data: {
        blockedUsers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get blocked users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
