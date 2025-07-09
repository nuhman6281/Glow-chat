import mongoose, { Document, Schema } from 'mongoose';

export interface IFriendRequest extends Document {
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  acceptedAt?: Date;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const friendRequestSchema = new Schema<IFriendRequest>({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  acceptedAt: Date,
  rejectedAt: Date
}, {
  timestamps: true
});

// Indexes for better performance
friendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });
friendRequestSchema.index({ receiver: 1, status: 1 });
friendRequestSchema.index({ sender: 1, status: 1 });

// Validation: sender and receiver must be different
friendRequestSchema.pre('validate', function(next) {
  if (this.sender.toString() === this.receiver.toString()) {
    next(new Error('Cannot send friend request to yourself'));
  } else {
    next();
  }
});

export default mongoose.models.FriendRequest || mongoose.model<IFriendRequest>('FriendRequest', friendRequestSchema);