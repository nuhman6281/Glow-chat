import mongoose, { Document, Schema } from 'mongoose';

export interface ICall extends Document {
  type: 'voice' | 'video';
  status: 'initiated' | 'ringing' | 'answered' | 'ended' | 'missed' | 'declined';
  initiator: mongoose.Types.ObjectId;
  participants: {
    user: mongoose.Types.ObjectId;
    joinedAt?: Date;
    leftAt?: Date;
    status: 'invited' | 'joined' | 'left' | 'declined';
  }[];
  chat?: mongoose.Types.ObjectId; // Associated chat for group calls
  startedAt?: Date;
  acceptedAt?: Date;
  endedAt?: Date;
  duration?: number; // in seconds
  endReason?: 'ended' | 'declined' | 'missed' | 'failed' | 'timeout';
  recording?: {
    url: string;
    size: number;
    duration: number;
  };
  metadata: {
    quality?: string;
    bandwidth?: number;
    server?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const callSchema = new Schema<ICall>({
  type: {
    type: String,
    enum: ['voice', 'video'],
    required: true
  },
  status: {
    type: String,
    enum: ['initiated', 'ringing', 'answered', 'ended', 'missed', 'declined'],
    default: 'initiated'
  },
  initiator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: Date,
    leftAt: Date,
    status: {
      type: String,
      enum: ['invited', 'joined', 'left', 'declined'],
      default: 'invited'
    }
  }],
  chat: {
    type: Schema.Types.ObjectId,
    ref: 'Chat'
  },
  startedAt: Date,
  acceptedAt: Date,
  endedAt: Date,
  duration: {
    type: Number,
    default: 0
  },
  endReason: {
    type: String,
    enum: ['ended', 'declined', 'missed', 'failed', 'timeout']
  },
  recording: {
    url: String,
    size: Number,
    duration: Number
  },
  metadata: {
    quality: String,
    bandwidth: Number,
    server: String
  }
}, {
  timestamps: true
});

// Indexes
callSchema.index({ initiator: 1, createdAt: -1 });
callSchema.index({ 'participants.user': 1, createdAt: -1 });
callSchema.index({ status: 1 });
callSchema.index({ type: 1 });

// Calculate duration before saving
callSchema.pre('save', function(next) {
  if (this.acceptedAt && this.endedAt) {
    this.duration = Math.floor((this.endedAt.getTime() - this.acceptedAt.getTime()) / 1000);
  }
  next();
});

export default mongoose.models.Call || mongoose.model<ICall>('Call', callSchema);
