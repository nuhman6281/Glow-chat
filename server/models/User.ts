import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  status: "online" | "away" | "offline";
  lastSeen: Date;
  contacts: mongoose.Types.ObjectId[];
  blockedUsers: mongoose.Types.ObjectId[];
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  // New profile fields
  phoneNumber?: string;
  bio?: string;
  location?: string;
  jobTitle?: string;
  department?: string;
  // User settings
  settings?: {
    notifications?: {
      push?: boolean;
      sound?: boolean;
      readReceipts?: boolean;
      lastSeen?: "everyone" | "contacts" | "nobody";
    };
    appearance?: {
      darkMode?: boolean;
      themeColor?: string;
      fontSize?: "small" | "medium" | "large";
    };
    privacy?: {
      messageEncryption?: boolean;
      screenLock?: boolean;
      disappearingMessages?: boolean;
    };
    chat?: {
      mediaAutoDownload?: "always" | "wifi" | "never";
      chatBackup?: boolean;
      messageSearch?: boolean;
    };
    calls?: {
      quality?: "low" | "medium" | "high";
      backgroundBlur?: boolean;
      noiseCancellation?: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    avatar: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["online", "away", "offline"],
      default: "offline",
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    contacts: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    blockedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    // New profile fields
    phoneNumber: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    jobTitle: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    department: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    // User settings
    settings: {
      notifications: {
        push: { type: Boolean, default: true },
        sound: { type: Boolean, default: true },
        readReceipts: { type: Boolean, default: true },
        lastSeen: {
          type: String,
          enum: ["everyone", "contacts", "nobody"],
          default: "everyone",
        },
      },
      appearance: {
        darkMode: { type: Boolean, default: false },
        themeColor: { type: String, default: "primary" },
        fontSize: {
          type: String,
          enum: ["small", "medium", "large"],
          default: "medium",
        },
      },
      privacy: {
        messageEncryption: { type: Boolean, default: true },
        screenLock: { type: Boolean, default: false },
        disappearingMessages: { type: Boolean, default: false },
      },
      chat: {
        mediaAutoDownload: {
          type: String,
          enum: ["always", "wifi", "never"],
          default: "wifi",
        },
        chatBackup: { type: Boolean, default: false },
        messageSearch: { type: Boolean, default: true },
      },
      calls: {
        quality: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "high",
        },
        backgroundBlur: { type: Boolean, default: true },
        noiseCancellation: { type: Boolean, default: true },
      },
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.emailVerificationToken;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  return userObject;
};

export default mongoose.models.User ||
  mongoose.model<IUser>("User", userSchema);
