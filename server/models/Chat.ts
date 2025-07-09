import mongoose, { Document, Schema } from 'mongoose';

export interface IChat extends Document {
  type: 'direct' | 'group';
  name?: string;
  description?: string;
  avatar?: string;
  participants: {
    user: mongoose.Types.ObjectId;
    role: 'admin' | 'member';
    joinedAt: Date;
    lastReadMessage?: mongoose.Types.ObjectId;
  }[];
  lastMessage?: mongoose.Types.ObjectId;
  lastActivity: Date;
  isArchived: boolean;
  settings: {
    notifications: boolean;
    pinned: boolean;
  };
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>({
  type: {
    type: String,
    enum: ['direct', 'group'],
    required: true
  },
  name: {
    type: String,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  avatar: {
    type: String,
    default: null
  },
  participants: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastReadMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    }
  }],
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    pinned: {
      type: Boolean,
      default: false
    }
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ lastActivity: -1 });
chatSchema.index({ type: 1 });

// Virtual for unread message count (to be calculated in queries)
chatSchema.virtual('unreadCount').get(function() {
  return 0; // This will be calculated in the service layer
});

export default mongoose.models.Chat || mongoose.model<IChat>('Chat', chatSchema);
