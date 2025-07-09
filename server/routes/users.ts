import express from "express";
import { body, query, validationResult } from "express-validator";
import User from "../models/User";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import rateLimit from "express-rate-limit";

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

export default router;
