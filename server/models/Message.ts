import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  chat: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  type: 'text' | 'image' | 'file' | 'voice' | 'video' | 'system';
  content?: string;
  file?: {
    url: string;
    name: string;
    size: number;
    mimeType: string;
    duration?: number; // for voice/video messages
  };
  replyTo?: mongoose.Types.ObjectId;
  reactions: {
    emoji: string;
    users: mongoose.Types.ObjectId[];
  }[];
  editedAt?: Date;
  isEdited: boolean;
  isDeleted: boolean;
  readBy: {
    user: mongoose.Types.ObjectId;
    readAt: Date;
  }[];
  deliveredTo: {
    user: mongoose.Types.ObjectId;
    deliveredAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  chat: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'voice', 'video', 'system'],
    required: true,
    default: 'text'
  },
  content: {
    type: String,
    trim: true,
    maxlength: 4000
  },
  file: {
    url: String,
    name: String,
    size: Number,
    mimeType: String,
    duration: Number
  },
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  reactions: [{
    emoji: {
      type: String,
      required: true
    },
    users: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  editedAt: Date,
  isEdited: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  readBy: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  deliveredTo: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better performance
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ 'readBy.user': 1 });

// Text index for search functionality
messageSchema.index({ content: 'text' }, {
  weights: {
    content: 10
  },
  name: 'message_text_search'
});

// Compound index for chat search
messageSchema.index({ chat: 1, content: 'text' }, {
  weights: {
    content: 10
  },
  name: 'chat_message_search'
});

// Validation: either content or file must be present for non-system messages
messageSchema.pre('validate', function(next) {
  if (this.type !== 'system' && !this.content && !this.file) {
    next(new Error('Either content or file must be provided for non-system messages'));
  } else {
    next();
  }
});

export default mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);
