/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

// User types
export interface User {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  status: "online" | "away" | "offline";
  lastSeen: Date;
  contacts: string[];
  blockedUsers: string[];
  isEmailVerified: boolean;
  phoneNumber?: string;
  bio?: string;
  location?: string;
  jobTitle?: string;
  department?: string;
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
}

// Authentication types
export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
  };
  errors?: any[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// Chat types
export interface Chat {
  _id: string;
  type: "direct" | "group";
  name?: string;
  description?: string;
  avatar?: string;
  participants: {
    user: User | string;
    role: "admin" | "member";
    joinedAt: Date;
    lastReadMessage?: string;
  }[];
  lastMessage?: Message;
  lastActivity: Date;
  isArchived: boolean;
  settings: {
    notifications: boolean;
    pinned: boolean;
  };
  createdBy: string;
  unreadCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Message types
export interface Message {
  _id: string;
  chat: string;
  sender: User | string;
  type: "text" | "image" | "file" | "voice" | "video" | "system";
  content?: string;
  file?: {
    url: string;
    name: string;
    size: number;
    mimeType: string;
    duration?: number;
  };
  replyTo?: Message;
  reactions: {
    emoji: string;
    users: string[];
  }[];
  editedAt?: Date;
  isEdited: boolean;
  isDeleted: boolean;
  readBy: {
    user: string;
    readAt: Date;
  }[];
  deliveredTo: {
    user: string;
    deliveredAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Call types
export interface Call {
  _id: string;
  type: "voice" | "video";
  status:
    | "initiated"
    | "ringing"
    | "answered"
    | "ended"
    | "missed"
    | "declined";
  initiator: User | string;
  participants: {
    user: User | string;
    joinedAt?: Date;
    leftAt?: Date;
    status: "invited" | "joined" | "left" | "declined";
  }[];
  chat?: string;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
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

// Socket events
export interface SocketEvents {
  // Connection
  connect: () => void;
  disconnect: () => void;

  // Chat events
  join_chat: (chatId: string) => void;
  leave_chat: (chatId: string) => void;
  send_message: (data: {
    chatId: string;
    content?: string;
    type: "text" | "image" | "file" | "voice" | "video";
    file?: any;
    replyTo?: string;
  }) => void;
  new_message: (message: Message) => void;
  mark_as_read: (data: { chatId: string; messageIds: string[] }) => void;
  messages_read: (data: {
    chatId: string;
    messageIds: string[];
    readBy: string;
  }) => void;

  // Typing events
  typing_start: (data: { chatId: string }) => void;
  typing_stop: (data: { chatId: string }) => void;
  user_typing: (data: {
    chatId: string;
    userId: string;
    username: string;
  }) => void;
  user_stopped_typing: (data: { chatId: string; userId: string }) => void;

  // Call events
  initiate_call: (data: {
    participants: string[];
    type: "voice" | "video";
    chatId?: string;
  }) => void;
  incoming_call: (data: { call: Call; from: User }) => void;
  answer_call: (data: { callId: string }) => void;
  decline_call: (data: { callId: string }) => void;
  end_call: (data: { callId: string }) => void;
  call_answered: (data: { callId: string; userId: string; user: User }) => void;
  call_declined: (data: { callId: string; userId: string }) => void;
  call_ended: (data: { callId: string; endedBy: string }) => void;

  // WebRTC signaling
  webrtc_signal: (data: {
    callId: string;
    targetUserId?: string;
    fromUserId?: string;
    signal: any;
  }) => void;

  // User status
  update_status: (status: "online" | "away" | "offline") => void;
  contact_status_changed: (data: {
    userId: string;
    status: "online" | "away" | "offline";
    lastSeen: Date;
  }) => void;

  // Errors
  error: (data: { message: string }) => void;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

export interface UserResponse extends ApiResponse<{ user: User }> {}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ChatsResponse
  extends ApiResponse<{
    chats: Chat[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {}

export interface UsersResponse
  extends ApiResponse<{
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {}

export interface MessagesResponse
  extends ApiResponse<{
    messages: Message[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {}

export interface CallsResponse
  extends ApiResponse<{
    calls: Call[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {}

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// Message editing and reactions
export interface EditMessageRequest {
  content: string;
}

export interface EditMessageResponse
  extends ApiResponse<{ message: Message }> {}

export interface AddReactionRequest {
  emoji: string;
}

export interface AddReactionResponse
  extends ApiResponse<{ message: Message }> {}

export interface RemoveReactionRequest {
  emoji: string;
}

export interface RemoveReactionResponse
  extends ApiResponse<{ message: Message }> {}

// Message forwarding
export interface ForwardMessageRequest {
  targetChatIds: string[];
}

export interface ForwardMessageResponse
  extends ApiResponse<{ messages: Message[] }> {}

// Message search
export interface SearchMessagesRequest {
  query: string;
  chatId?: string;
  page?: number;
  limit?: number;
}

export interface SearchMessagesResponse
  extends ApiResponse<{
    messages: Message[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {}

// Message pinning
export interface PinMessageRequest {
  pinned: boolean;
}

export interface PinMessageResponse extends ApiResponse<{ message: Message }> {}

// Message scheduling
export interface ScheduleMessageRequest {
  content: string;
  scheduledAt: Date;
  type?: "text" | "image" | "file" | "voice" | "video";
  file?: any;
}

export interface ScheduleMessageResponse
  extends ApiResponse<{ message: Message }> {}

// Message translation
export interface TranslateMessageRequest {
  targetLanguage: string;
}

export interface TranslateMessageResponse
  extends ApiResponse<{
    originalText: string;
    translatedText: string;
    targetLanguage: string;
  }> {}

// Message export
export interface ExportMessagesRequest {
  format: "json" | "pdf" | "txt";
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ExportMessagesResponse
  extends ApiResponse<{
    downloadUrl: string;
    expiresAt: Date;
  }> {}

// Friend Request types
export interface FriendRequest {
  _id: string;
  sender: User | string;
  receiver: User | string;
  status: "pending" | "accepted" | "rejected";
  acceptedAt?: Date;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Contact types
export interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
  status: "online" | "away" | "offline";
  lastSeen: Date;
}

// Blocked User types
export interface BlockedUser {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
}

// Friend Request API responses
export interface FriendRequestResponse
  extends ApiResponse<{ friendRequest: FriendRequest }> {}

export interface FriendRequestsResponse
  extends ApiResponse<{
    friendRequests: FriendRequest[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {}

// Contact API responses
export interface ContactsResponse
  extends ApiResponse<{
    contacts: Contact[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {}

// Blocked Users API responses
export interface BlockedUsersResponse
  extends ApiResponse<{
    blockedUsers: BlockedUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {}

// Upload API responses
export interface UploadAvatarResponse
  extends ApiResponse<{ avatarUrl: string }> {}

export interface UploadMediaResponse
  extends ApiResponse<{
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    fileType: "image" | "file" | "voice" | "video";
  }> {}
