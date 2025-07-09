import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import Chat from '../models/Chat';
import Message from '../models/Message';
import Call from '../models/Call';

interface AuthenticatedSocket extends Socket {
  user?: IUser;
}

interface UserSocket {
  userId: string;
  socketId: string;
  status: 'online' | 'away' | 'offline';
}

class SocketManager {
  private io: SocketIOServer;
  private connectedUsers: Map<string, UserSocket> = new Map();
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds[]

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:8080",
        methods: ["GET", "POST"]
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, jwtSecret) as { userId: string };
        
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: any) => {
      this.handleConnection(socket);
    });
  }

  private async handleConnection(socket: AuthenticatedSocket) {
    const user = socket.user!;
    const userId = user._id.toString();

    console.log(`User ${user.username} connected with socket ${socket.id}`);

    // Add user to connected users
    this.connectedUsers.set(socket.id, {
      userId,
      socketId: socket.id,
      status: 'online'
    });

    // Add socket to user's socket list
    const userSocketIds = this.userSockets.get(userId) || [];
    userSocketIds.push(socket.id);
    this.userSockets.set(userId, userSocketIds);

    // Update user status in database
    await User.findByIdAndUpdate(userId, { 
      status: 'online',
      lastSeen: new Date()
    });

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Join user's chat rooms
    const userChats = await Chat.find({
      'participants.user': userId
    }).select('_id');

    for (const chat of userChats) {
      socket.join(`chat:${chat._id}`);
    }

    // Emit user online status to contacts
    this.broadcastUserStatus(userId, 'online');

    // Set up event handlers
    this.setupChatHandlers(socket);
    this.setupCallHandlers(socket);
    this.setupUserHandlers(socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  private setupChatHandlers(socket: AuthenticatedSocket) {
    const user = socket.user!;
    const userId = user._id.toString();

    // Join chat room
    socket.on('join_chat', async (chatId: string) => {
      try {
        const chat = await Chat.findOne({
          _id: chatId,
          'participants.user': userId
        });

        if (chat) {
          socket.join(`chat:${chatId}`);
          socket.emit('joined_chat', { chatId });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Leave chat room
    socket.on('leave_chat', (chatId: string) => {
      socket.leave(`chat:${chatId}`);
      socket.emit('left_chat', { chatId });
    });

    // Send message
    socket.on('send_message', async (data: {
      chatId: string;
      content?: string;
      type: 'text' | 'image' | 'file' | 'voice' | 'video';
      file?: any;
      replyTo?: string;
    }) => {
      try {
        const chat = await Chat.findOne({
          _id: data.chatId,
          'participants.user': userId
        });

        if (!chat) {
          socket.emit('error', { message: 'Chat not found or access denied' });
          return;
        }

        const message = new Message({
          chat: data.chatId,
          sender: userId,
          type: data.type,
          content: data.content,
          file: data.file,
          replyTo: data.replyTo
        });

        await message.save();
        await message.populate(['sender', 'replyTo']);

        // Update chat's last message and activity
        chat.lastMessage = message._id as any;
        chat.lastActivity = new Date();
        await chat.save();

        // Emit to all participants in the chat
        this.io.to(`chat:${data.chatId}`).emit('new_message', message);

        // Send push notifications to offline users
        this.sendPushNotifications(chat, message);

      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Mark messages as read
    socket.on('mark_as_read', async (data: { chatId: string, messageIds: string[] }) => {
      try {
        await Message.updateMany(
          {
            _id: { $in: data.messageIds },
            chat: data.chatId,
            'readBy.user': { $ne: userId }
          },
          {
            $push: {
              readBy: {
                user: userId,
                readAt: new Date()
              }
            }
          }
        );

        // Emit read receipts to other chat participants
        socket.to(`chat:${data.chatId}`).emit('messages_read', {
          chatId: data.chatId,
          messageIds: data.messageIds,
          readBy: userId
        });

      } catch (error) {
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });

    // Typing indicators
    socket.on('typing_start', (data: { chatId: string }) => {
      socket.to(`chat:${data.chatId}`).emit('user_typing', {
        chatId: data.chatId,
        userId,
        username: user.username
      });
    });

    socket.on('typing_stop', (data: { chatId: string }) => {
      socket.to(`chat:${data.chatId}`).emit('user_stopped_typing', {
        chatId: data.chatId,
        userId
      });
    });
  }

  private setupCallHandlers(socket: AuthenticatedSocket) {
    const user = socket.user!;
    const userId = user._id.toString();

    // Initiate call
    socket.on('initiate_call', async (data: {
      participants: string[];
      type: 'voice' | 'video';
      chatId?: string;
    }) => {
      try {
        const call = new Call({
          type: data.type,
          initiator: userId,
          participants: data.participants.map(participantId => ({
            user: participantId,
            status: 'invited'
          })),
          chat: data.chatId,
          status: 'initiated'
        });

        await call.save();
        await call.populate('initiator participants.user');

        // Join call room
        socket.join(`call:${call._id}`);

        // Emit to all participants
        for (const participantId of data.participants) {
          this.io.to(`user:${participantId}`).emit('incoming_call', {
            call,
            from: user
          });
        }

        socket.emit('call_initiated', { call });

      } catch (error) {
        socket.emit('error', { message: 'Failed to initiate call' });
      }
    });

    // Answer call
    socket.on('answer_call', async (data: { callId: string }) => {
      try {
        const call = await Call.findById(data.callId);
        if (!call) {
          socket.emit('error', { message: 'Call not found' });
          return;
        }

        // Update participant status
        const participant = call.participants.find(p => p.user.toString() === userId);
        if (participant) {
          participant.status = 'joined';
          participant.joinedAt = new Date();
        }

        // Update call status if first to answer
        if (call.status === 'initiated' || call.status === 'ringing') {
          call.status = 'answered';
          call.startedAt = new Date();
        }

        await call.save();

        // Join call room
        socket.join(`call:${call._id}`);

        // Emit to all call participants
        this.io.to(`call:${call._id}`).emit('call_answered', {
          callId: call._id,
          userId,
          user
        });

      } catch (error) {
        socket.emit('error', { message: 'Failed to answer call' });
      }
    });

    // Decline call
    socket.on('decline_call', async (data: { callId: string }) => {
      try {
        const call = await Call.findById(data.callId);
        if (!call) return;

        // Update participant status
        const participant = call.participants.find(p => p.user.toString() === userId);
        if (participant) {
          participant.status = 'declined';
        }

        await call.save();

        // Emit to all call participants
        this.io.to(`call:${call._id}`).emit('call_declined', {
          callId: call._id,
          userId
        });

      } catch (error) {
        socket.emit('error', { message: 'Failed to decline call' });
      }
    });

    // End call
    socket.on('end_call', async (data: { callId: string }) => {
      try {
        const call = await Call.findById(data.callId);
        if (!call) return;

        call.status = 'ended';
        call.endedAt = new Date();

        // Update participant status
        const participant = call.participants.find(p => p.user.toString() === userId);
        if (participant && participant.status === 'joined') {
          participant.leftAt = new Date();
          participant.status = 'left';
        }

        await call.save();

        // Emit to all call participants
        this.io.to(`call:${call._id}`).emit('call_ended', {
          callId: call._id,
          endedBy: userId
        });

        // Clear call room
        this.io.in(`call:${call._id}`).socketsLeave(`call:${call._id}`);

      } catch (error) {
        socket.emit('error', { message: 'Failed to end call' });
      }
    });

    // WebRTC signaling
    socket.on('webrtc_signal', (data: {
      callId: string;
      targetUserId: string;
      signal: any;
    }) => {
      this.io.to(`user:${data.targetUserId}`).emit('webrtc_signal', {
        callId: data.callId,
        fromUserId: userId,
        signal: data.signal
      });
    });
  }

  private setupUserHandlers(socket: AuthenticatedSocket) {
    const user = socket.user!;
    const userId = user._id.toString();

    // Update user status
    socket.on('update_status', async (status: 'online' | 'away' | 'offline') => {
      try {
        await User.findByIdAndUpdate(userId, { 
          status,
          lastSeen: new Date()
        });

        const userSocket = this.connectedUsers.get(socket.id);
        if (userSocket) {
          userSocket.status = status;
        }

        this.broadcastUserStatus(userId, status);

      } catch (error) {
        socket.emit('error', { message: 'Failed to update status' });
      }
    });
  }

  private async handleDisconnection(socket: AuthenticatedSocket) {
    const user = socket.user;
    if (!user) return;

    const userId = user._id.toString();
    console.log(`User ${user.username} disconnected from socket ${socket.id}`);

    // Remove from connected users
    this.connectedUsers.delete(socket.id);

    // Remove socket from user's socket list
    const userSocketIds = this.userSockets.get(userId) || [];
    const updatedSocketIds = userSocketIds.filter(id => id !== socket.id);
    
    if (updatedSocketIds.length === 0) {
      // User has no more connections, mark as offline
      this.userSockets.delete(userId);
      
      await User.findByIdAndUpdate(userId, {
        status: 'offline',
        lastSeen: new Date()
      });

      this.broadcastUserStatus(userId, 'offline');
    } else {
      this.userSockets.set(userId, updatedSocketIds);
    }
  }

  private async broadcastUserStatus(userId: string, status: 'online' | 'away' | 'offline') {
    try {
      const user = await User.findById(userId).populate('contacts');
      if (!user) return;

      // Emit status to all contacts
      for (const contact of user.contacts) {
        this.io.to(`user:${contact._id}`).emit('contact_status_changed', {
          userId,
          status,
          lastSeen: user.lastSeen
        });
      }
    } catch (error) {
      console.error('Failed to broadcast user status:', error);
    }
  }

  private async sendPushNotifications(chat: any, message: any) {
    try {
      // Get all chat participants who are offline
      const participants = await User.find({
        _id: { $in: chat.participants },
        status: 'offline'
      });

      for (const participant of participants) {
        // Skip sending notification to the message sender
        if (participant._id.toString() === message.sender.toString()) continue;

        // Create notification payload
        const notification = {
          title: chat.type === 'direct' ? 
            `New message from ${message.senderName || 'Someone'}` : 
            `New message in ${chat.name || 'Group Chat'}`,
          body: message.type === 'text' ? 
            message.content?.substring(0, 100) || 'New message' : 
            `Sent a ${message.type}`,
          data: {
            chatId: chat._id.toString(),
            messageId: message._id.toString(),
            type: 'new_message'
          }
        };

        // TODO: Integrate with push notification services
        // Examples of services to integrate:
        // - Firebase Cloud Messaging (FCM)
        // - Apple Push Notification Service (APNs)
        // - Web Push Protocol
        // - OneSignal
        // - Pusher Beams
        
        // For now, log the notification that would be sent
        console.log(`[PUSH NOTIFICATION] Would send to user ${participant._id}:`, notification);
        
        // In a real implementation, you would:
        // 1. Store user device tokens in the User model
        // 2. Use a push notification service SDK
        // 3. Handle different platforms (iOS, Android, Web)
        // 4. Implement retry logic for failed sends
        // 5. Track delivery status
        
        // Example implementation structure:
        /*
        if (participant.deviceTokens?.length > 0) {
          for (const token of participant.deviceTokens) {
            try {
              await this.pushNotificationService.send({
                token,
                notification,
                data: notification.data
              });
            } catch (error) {
              console.error(`Failed to send push notification to ${participant._id}:`, error);
              // Handle token invalidation, retry logic, etc.
            }
          }
        }
        */
      }
    } catch (error) {
      console.error('Failed to send push notifications:', error);
    }
  }

  public getIO() {
    return this.io;
  }

  public getConnectedUsers() {
    return this.connectedUsers;
  }
}

export default SocketManager;
