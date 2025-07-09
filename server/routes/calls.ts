import express from "express";
import { body, query, validationResult } from "express-validator";
import Call from "../models/Call";
import User from "../models/User";
import { authenticate } from "../middleware/auth";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Rate limiting for call routes
const callLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting and authentication to all call routes
router.use(callLimiter);
router.use(authenticate);

// Get call history for current user
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
    query("type")
      .optional()
      .isIn(["voice", "video"])
      .withMessage("Type must be either voice or video"),
    query("status")
      .optional()
      .isIn(["initiated", "ringing", "answered", "ended", "missed", "declined"])
      .withMessage(
        "Status must be one of: initiated, ringing, answered, ended, missed, declined",
      ),
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
      const type = req.query.type as string;
      const status = req.query.status as string;
      const skip = (page - 1) * limit;
      const userId = req.userId;

      // Build query - find calls where user is either initiator or participant
      const query: any = {
        $or: [{ initiator: userId }, { "participants.user": userId }],
      };

      if (type) query.type = type;
      if (status) query.status = status;

      // Get calls with pagination
      const calls = await Call.find(query)
        .populate("initiator", "firstName lastName username avatar")
        .populate("participants.user", "firstName lastName username avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Call.countDocuments(query);

      res.json({
        success: true,
        data: {
          calls,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("Get call history error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Start a new call
router.post(
  "/",
  [
    body("participants")
      .isArray({ min: 1 })
      .withMessage("At least one participant is required"),
    body("participants.*")
      .isMongoId()
      .withMessage("Each participant must be a valid MongoDB ID"),
    body("type")
      .isIn(["voice", "video"])
      .withMessage("Call type must be either voice or video"),
    body("chatId")
      .optional()
      .isMongoId()
      .withMessage("Chat ID must be a valid MongoDB ID"),
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

      const { participants, type, chatId } = req.body;
      const initiatorId = req.userId;

      // Validate that all participants exist
      const participantUsers = await User.find({ _id: { $in: participants } });
      if (participantUsers.length !== participants.length) {
        return res.status(404).json({
          success: false,
          message: "One or more participants not found",
        });
      }

      // Check if there's already an ongoing call with these participants
      const existingCall = await Call.findOne({
        $or: [
          {
            initiator: initiatorId,
            "participants.user": { $in: participants },
            status: { $in: ["initiated", "ringing", "answered"] },
          },
          {
            initiator: { $in: participants },
            "participants.user": initiatorId,
            status: { $in: ["initiated", "ringing", "answered"] },
          },
        ],
      });

      if (existingCall) {
        return res.status(400).json({
          success: false,
          message: "There is already an ongoing call with these participants",
        });
      }

      // Create participants array
      const participantsArray = participants.map((participantId: string) => ({
        user: participantId,
        status: "invited",
      }));

      // Create new call
      const call = new Call({
        initiator: initiatorId,
        participants: participantsArray,
        type,
        status: "initiated",
        chat: chatId,
        startedAt: new Date(),
      });

      await call.save();

      // Populate initiator and participants info
      await call.populate("initiator", "firstName lastName username avatar");
      await call.populate(
        "participants.user",
        "firstName lastName username avatar",
      );

      res.status(201).json({
        success: true,
        message: "Call initiated successfully",
        data: { call },
      });
    } catch (error) {
      console.error("Start call error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Get call by ID
router.get("/:callId", async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.userId;

    if (!callId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid call ID format",
      });
    }

    const call = await Call.findOne({
      _id: callId,
      $or: [{ initiator: userId }, { "participants.user": userId }],
    })
      .populate("initiator", "firstName lastName username avatar")
      .populate("participants.user", "firstName lastName username avatar");

    if (!call) {
      return res.status(404).json({
        success: false,
        message: "Call not found",
      });
    }

    res.json({
      success: true,
      data: { call },
    });
  } catch (error) {
    console.error("Get call by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update call status (answer, end, decline)
router.patch(
  "/:callId/status",
  [
    body("status")
      .isIn(["ringing", "answered", "ended", "missed", "declined"])
      .withMessage("Invalid status"),
    body("participantId")
      .optional()
      .isMongoId()
      .withMessage("Participant ID must be a valid MongoDB ID"),
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

      const { callId } = req.params;
      const { status, participantId } = req.body;
      const userId = req.userId;

      const call = await Call.findOne({
        _id: callId,
        $or: [{ initiator: userId }, { "participants.user": userId }],
      });

      if (!call) {
        return res.status(404).json({
          success: false,
          message: "Call not found",
        });
      }

      // Update call status
      call.status = status;

      // Update participant status if provided
      if (participantId) {
        const participant = call.participants.find(
          (p) => p.user.toString() === participantId,
        );
        if (participant) {
          participant.status =
            status === "answered"
              ? "joined"
              : status === "declined"
                ? "declined"
                : status === "ended"
                  ? "left"
                  : "invited";

          if (status === "answered") {
            participant.joinedAt = new Date();
          } else if (status === "ended" || status === "declined") {
            participant.leftAt = new Date();
          }
        }
      }

      // Set timestamps
      if (status === "answered") {
        call.acceptedAt = new Date();
      } else if (["ended", "missed", "declined"].includes(status)) {
        call.endedAt = new Date();
      }

      await call.save();

      // Populate for response
      await call.populate("initiator", "firstName lastName username avatar");
      await call.populate(
        "participants.user",
        "firstName lastName username avatar",
      );

      res.json({
        success: true,
        message: "Call status updated successfully",
        data: { call },
      });
    } catch (error) {
      console.error("Update call status error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Join call
router.post("/:callId/join", async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.userId;

    const call = await Call.findOne({
      _id: callId,
      "participants.user": userId,
      status: { $in: ["initiated", "ringing"] },
    });

    if (!call) {
      return res.status(404).json({
        success: false,
        message: "Call not found or not available to join",
      });
    }

    // Update participant status
    const participant = call.participants.find(
      (p) => p.user.toString() === userId,
    );
    if (participant) {
      participant.status = "joined";
      participant.joinedAt = new Date();
    }

    // Update call status
    call.status = "answered";
    call.acceptedAt = new Date();

    await call.save();

    // Populate for response
    await call.populate("initiator", "firstName lastName username avatar");
    await call.populate(
      "participants.user",
      "firstName lastName username avatar",
    );

    res.json({
      success: true,
      message: "Joined call successfully",
      data: { call },
    });
  } catch (error) {
    console.error("Join call error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Leave call
router.post("/:callId/leave", async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.userId;

    const call = await Call.findOne({
      _id: callId,
      $or: [{ initiator: userId }, { "participants.user": userId }],
      status: { $in: ["answered", "ringing"] },
    });

    if (!call) {
      return res.status(404).json({
        success: false,
        message: "Call not found or not active",
      });
    }

    // Update participant status
    const participant = call.participants.find(
      (p) => p.user.toString() === userId,
    );
    if (participant) {
      participant.status = "left";
      participant.leftAt = new Date();
    }

    // Check if all participants have left
    const activeParticipants = call.participants.filter(
      (p) => p.status === "joined",
    );
    if (activeParticipants.length === 0) {
      call.status = "ended";
      call.endedAt = new Date();
    }

    await call.save();

    // Populate for response
    await call.populate("initiator", "firstName lastName username avatar");
    await call.populate(
      "participants.user",
      "firstName lastName username avatar",
    );

    res.json({
      success: true,
      message: "Left call successfully",
      data: { call },
    });
  } catch (error) {
    console.error("Leave call error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get ongoing calls for user
router.get("/ongoing/active", async (req, res) => {
  try {
    const userId = req.userId;

    const ongoingCalls = await Call.find({
      $or: [{ initiator: userId }, { "participants.user": userId }],
      status: { $in: ["initiated", "ringing", "answered"] },
    })
      .populate("initiator", "firstName lastName username avatar")
      .populate("participants.user", "firstName lastName username avatar")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { calls: ongoingCalls },
    });
  } catch (error) {
    console.error("Get ongoing calls error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get call statistics
router.get("/stats/summary", async (req, res) => {
  try {
    const userId = req.userId;

    const stats = await Call.aggregate([
      {
        $match: {
          $or: [{ initiator: userId }, { "participants.user": userId }],
        },
      },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          audioCallsCount: {
            $sum: { $cond: [{ $eq: ["$type", "audio"] }, 1, 0] },
          },
          videoCallsCount: {
            $sum: { $cond: [{ $eq: ["$type", "video"] }, 1, 0] },
          },
          completedCalls: {
            $sum: { $cond: [{ $eq: ["$status", "ended"] }, 1, 0] },
          },
          missedCalls: {
            $sum: { $cond: [{ $eq: ["$status", "missed"] }, 1, 0] },
          },
          totalDuration: { $sum: "$duration" },
        },
      },
    ]);

    const result = stats[0] || {
      totalCalls: 0,
      audioCallsCount: 0,
      videoCallsCount: 0,
      completedCalls: 0,
      missedCalls: 0,
      totalDuration: 0,
    };

    res.json({
      success: true,
      data: { stats: result },
    });
  } catch (error) {
    console.error("Get call stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
