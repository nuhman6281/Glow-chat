import {
  User,
  Chat,
  Message,
  Call,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ApiResponse,
  UserResponse,
  PaginatedResponse,
  ChatsResponse,
  UsersResponse,
  MessagesResponse,
  CallsResponse,
} from "@shared/api";

// API Configuration
const API_BASE_URL =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:3000/api";

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem("auth_token");
};

// Helper function to make authenticated requests
const makeRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> => {
  const token = getAuthToken();

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      // Handle different error statuses
      if (response.status === 401) {
        // Unauthorized - clear auth data
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        window.location.href = "/login";
        throw new Error("Authentication required");
      }

      if (response.status === 403) {
        throw new Error("Access forbidden");
      }

      if (response.status === 404) {
        throw new Error("Resource not found");
      }

      if (response.status >= 500) {
        throw new Error("Server error occurred");
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        message: error.message,
        errors: [error.message],
      };
    }

    return {
      success: false,
      message: "An unexpected error occurred",
      errors: ["Network error"],
    };
  }
};

// Helper function for paginated requests
const makePaginatedRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<PaginatedResponse<T>> => {
  const result = await makeRequest<any>(endpoint, options);
  return result as unknown as PaginatedResponse<T>;
};

// Auth API
export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const result: AuthResponse = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const result: AuthResponse = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  },

  logout: async (): Promise<ApiResponse> => {
    return makeRequest("/auth/logout", { method: "POST" });
  },

  refresh: async (): Promise<AuthResponse> => {
    return makeRequest("/auth/refresh", { method: "POST" });
  },

  forgotPassword: async (email: string): Promise<ApiResponse> => {
    return makeRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (
    token: string,
    password: string,
  ): Promise<ApiResponse> => {
    return makeRequest("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  },
};

// Users API
export const usersApi = {
  getMe: async (): Promise<UserResponse> => {
    return makeRequest("/users/me");
  },

  updateMe: async (userData: Partial<User>): Promise<UserResponse> => {
    return makeRequest("/users/me", {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },

  getAllUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<UsersResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);

    const endpoint = `/users${queryParams.toString() ? `?${queryParams}` : ""}`;
    return makeRequest(endpoint);
  },

  getUserById: async (userId: string): Promise<UserResponse> => {
    return makeRequest(`/users/${userId}`);
  },

  searchUsers: async (
    query: string,
  ): Promise<ApiResponse<{ users: User[]; total: number }>> => {
    return makeRequest(`/users/search?q=${encodeURIComponent(query)}`);
  },

  updateStatus: async (
    status: "online" | "away" | "offline",
  ): Promise<ApiResponse> => {
    return makeRequest("/users/status", {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};

// Chats API
export const chatsApi = {
  getChats: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<ChatsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const endpoint = `/chats${queryParams.toString() ? `?${queryParams}` : ""}`;
    return makeRequest(endpoint);
  },

  getChatById: async (chatId: string): Promise<ApiResponse<Chat>> => {
    return makeRequest(`/chats/${chatId}`);
  },

  createChat: async (chatData: {
    type: "direct" | "group";
    participants: string[];
    name?: string;
    description?: string;
  }): Promise<ApiResponse<{ chat: Chat }>> => {
    return makeRequest("/chats", {
      method: "POST",
      body: JSON.stringify(chatData),
    });
  },

  updateChat: async (
    chatId: string,
    updates: {
      name?: string;
      description?: string;
    },
  ): Promise<ApiResponse<Chat>> => {
    return makeRequest(`/chats/${chatId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  addParticipants: async (
    chatId: string,
    participants: string[],
  ): Promise<ApiResponse<Chat>> => {
    return makeRequest(`/chats/${chatId}/participants`, {
      method: "POST",
      body: JSON.stringify({ participants }),
    });
  },

  leaveChat: async (chatId: string): Promise<ApiResponse> => {
    return makeRequest(`/chats/${chatId}/leave`, { method: "DELETE" });
  },

  removeParticipant: async (
    chatId: string,
    userId: string,
  ): Promise<ApiResponse> => {
    return makeRequest(`/chats/${chatId}/participants/${userId}`, {
      method: "DELETE",
    });
  },

  updateParticipantRole: async (
    chatId: string,
    userId: string,
    role: string,
  ): Promise<ApiResponse> => {
    return makeRequest(`/chats/${chatId}/participants/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  },

  deleteChat: async (chatId: string): Promise<ApiResponse> => {
    return makeRequest(`/chats/${chatId}`, { method: "DELETE" });
  },
};

// Messages API
export const messagesApi = {
  getMessages: async (
    chatId: string,
    params?: {
      page?: number;
      limit?: number;
      before?: string;
    },
  ): Promise<MessagesResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.before) queryParams.append("before", params.before);

    const endpoint = `/messages/chat/${chatId}${queryParams.toString() ? `?${queryParams}` : ""}`;
    return makeRequest(endpoint);
  },

  sendMessage: async (messageData: {
    chatId: string;
    content?: string;
    type: "text" | "image" | "file" | "voice" | "video";
    file?: File;
    replyTo?: string;
  }): Promise<ApiResponse<Message>> => {
    if (messageData.file) {
      // Handle file upload
      const formData = new FormData();
      formData.append("chatId", messageData.chatId);
      formData.append("type", messageData.type);
      formData.append("file", messageData.file);
      if (messageData.content) formData.append("content", messageData.content);
      if (messageData.replyTo) formData.append("replyTo", messageData.replyTo);

      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      return response.json();
    }

    return makeRequest("/messages", {
      method: "POST",
      body: JSON.stringify(messageData),
    });
  },

  getMessage: async (messageId: string): Promise<ApiResponse<Message>> => {
    return makeRequest(`/messages/${messageId}`);
  },

  editMessage: async (
    messageId: string,
    content: string,
  ): Promise<ApiResponse<Message>> => {
    return makeRequest(`/messages/${messageId}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    });
  },

  deleteMessage: async (messageId: string): Promise<ApiResponse> => {
    return makeRequest(`/messages/${messageId}`, { method: "DELETE" });
  },

  markAsRead: async (messageIds: string[]): Promise<ApiResponse> => {
    return makeRequest("/messages/read", {
      method: "PATCH",
      body: JSON.stringify({ messageIds }),
    });
  },

  addReaction: async (
    messageId: string,
    emoji: string,
  ): Promise<ApiResponse<Message>> => {
    return makeRequest(`/messages/${messageId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ emoji }),
    });
  },

  removeReaction: async (
    messageId: string,
    emoji: string,
  ): Promise<ApiResponse<Message>> => {
    return makeRequest(
      `/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
      {
        method: "DELETE",
      },
    );
  },

  // Enhanced message features
  forwardMessage: async (
    messageId: string,
    targetChatIds: string[],
  ): Promise<ApiResponse<{ messages: Message[] }>> => {
    return makeRequest(`/messages/${messageId}/forward`, {
      method: "POST",
      body: JSON.stringify({ targetChatIds }),
    });
  },

  pinMessage: async (
    messageId: string,
    pinned: boolean,
  ): Promise<ApiResponse<Message>> => {
    return makeRequest(`/messages/${messageId}/pin`, {
      method: "PATCH",
      body: JSON.stringify({ pinned }),
    });
  },

  scheduleMessage: async (messageData: {
    chatId: string;
    content: string;
    scheduledAt: Date;
    type?: "text" | "image" | "file" | "voice" | "video";
    file?: File;
  }): Promise<ApiResponse<Message>> => {
    if (messageData.file) {
      const formData = new FormData();
      formData.append("chatId", messageData.chatId);
      formData.append("content", messageData.content);
      formData.append("scheduledAt", messageData.scheduledAt.toISOString());
      formData.append("type", messageData.type || "text");
      formData.append("file", messageData.file);

      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/messages/schedule`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      return response.json();
    }

    return makeRequest("/messages/schedule", {
      method: "POST",
      body: JSON.stringify(messageData),
    });
  },

  translateMessage: async (
    messageId: string,
    targetLanguage: string,
  ): Promise<
    ApiResponse<{
      originalText: string;
      translatedText: string;
      targetLanguage: string;
    }>
  > => {
    return makeRequest(`/messages/${messageId}/translate`, {
      method: "POST",
      body: JSON.stringify({ targetLanguage }),
    });
  },

  exportMessages: async (
    chatId: string,
    format: "json" | "pdf" | "txt",
    dateRange?: { start: Date; end: Date },
  ): Promise<ApiResponse<{ downloadUrl: string; expiresAt: Date }>> => {
    return makeRequest(`/messages/chat/${chatId}/export`, {
      method: "POST",
      body: JSON.stringify({ format, dateRange }),
    });
  },

  searchMessages: async (
    query: string,
    chatId?: string,
    params?: { page?: number; limit?: number },
  ): Promise<
    ApiResponse<{
      messages: Message[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  > => {
    const queryParams = new URLSearchParams();
    queryParams.append("q", query);
    if (chatId) queryParams.append("chatId", chatId);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    return makeRequest(`/messages/search?${queryParams}`);
  },

  getPinnedMessages: async (
    chatId: string,
  ): Promise<ApiResponse<Message[]>> => {
    return makeRequest(`/messages/chat/${chatId}/pinned`);
  },

  getScheduledMessages: async (
    chatId: string,
  ): Promise<ApiResponse<Message[]>> => {
    return makeRequest(`/messages/chat/${chatId}/scheduled`);
  },
};

// Calls API
export const callsApi = {
  getCalls: async (params?: {
    page?: number;
    limit?: number;
    type?: "audio" | "video";
    status?: "pending" | "ongoing" | "ended" | "missed" | "declined";
  }): Promise<CallsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.type) queryParams.append("type", params.type);
    if (params?.status) queryParams.append("status", params.status);

    const endpoint = `/calls${queryParams.toString() ? `?${queryParams}` : ""}`;
    return makeRequest(endpoint);
  },

  startCall: async (callData: {
    receiverId: string;
    type: "audio" | "video";
  }): Promise<ApiResponse<Call>> => {
    return makeRequest("/calls", {
      method: "POST",
      body: JSON.stringify(callData),
    });
  },

  getCall: async (callId: string): Promise<ApiResponse<Call>> => {
    return makeRequest(`/calls/${callId}`);
  },

  updateCallStatus: async (
    callId: string,
    status: "ongoing" | "ended" | "missed" | "declined",
    endReason?: string,
  ): Promise<ApiResponse<Call>> => {
    return makeRequest(`/calls/${callId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, endReason }),
    });
  },

  endCall: async (
    callId: string,
    endReason?: string,
  ): Promise<ApiResponse<Call>> => {
    return makeRequest(`/calls/${callId}/end`, {
      method: "PATCH",
      body: JSON.stringify({ endReason }),
    });
  },

  getOngoingCalls: async (): Promise<ApiResponse<Call[]>> => {
    return makeRequest("/calls/ongoing/active");
  },

  getCallStats: async (): Promise<ApiResponse<any>> => {
    return makeRequest("/calls/stats/summary");
  },
};

// Friend Requests API
export const friendRequestsApi = {
  sendFriendRequest: async (receiverId: string): Promise<ApiResponse<any>> => {
    return makeRequest("/users/friend-requests/send", {
      method: "POST",
      body: JSON.stringify({ receiverId }),
    });
  },

  acceptFriendRequest: async (requestId: string): Promise<ApiResponse<any>> => {
    return makeRequest(`/users/friend-requests/accept/${requestId}`, {
      method: "POST",
    });
  },

  rejectFriendRequest: async (requestId: string): Promise<ApiResponse<any>> => {
    return makeRequest(`/users/friend-requests/reject/${requestId}`, {
      method: "POST",
    });
  },

  getReceivedFriendRequests: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const endpoint = `/users/friend-requests/received${queryParams.toString() ? `?${queryParams}` : ""}`;
    return makeRequest(endpoint);
  },

  getSentFriendRequests: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const endpoint = `/users/friend-requests/sent${queryParams.toString() ? `?${queryParams}` : ""}`;
    return makeRequest(endpoint);
  },

  cancelFriendRequest: async (requestId: string): Promise<ApiResponse<any>> => {
    return makeRequest(`/users/friend-requests/cancel/${requestId}`, {
      method: "DELETE",
    });
  },
};

// Contacts API
export const contactsApi = {
  addContact: async (userId: string): Promise<ApiResponse<any>> => {
    return makeRequest(`/users/contacts/add/${userId}`, {
      method: "POST",
    });
  },

  removeContact: async (userId: string): Promise<ApiResponse<any>> => {
    return makeRequest(`/users/contacts/remove/${userId}`, {
      method: "DELETE",
    });
  },

  getContacts: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const endpoint = `/users/contacts${queryParams.toString() ? `?${queryParams}` : ""}`;
    return makeRequest(endpoint);
  },
};

// User Blocking API
export const blockingApi = {
  blockUser: async (userId: string): Promise<ApiResponse<any>> => {
    return makeRequest(`/users/block/${userId}`, {
      method: "POST",
    });
  },

  unblockUser: async (userId: string): Promise<ApiResponse<any>> => {
    return makeRequest(`/users/unblock/${userId}`, {
      method: "POST",
    });
  },

  getBlockedUsers: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const endpoint = `/users/blocked${queryParams.toString() ? `?${queryParams}` : ""}`;
    return makeRequest(endpoint);
  },
};

// Health check
export const healthApi = {
  check: async (): Promise<ApiResponse> => {
    return makeRequest("/health");
  },
};

// Upload API
export const uploadApi = {
  uploadAvatar: async (file: File): Promise<ApiResponse<{ avatarUrl: string }>> => {
    const formData = new FormData();
    formData.append("avatar", file);

    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/upload/avatar`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    return response.json();
  },

  uploadMedia: async (file: File): Promise<ApiResponse<{
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    fileType: "image" | "file" | "voice" | "video";
  }>> => {
    const formData = new FormData();
    formData.append("media", file);

    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/upload/media`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    return response.json();
  },
};

// WebRTC API
export const webrtcApi = {
  getIceServers: async (): Promise<ApiResponse<{
    iceServers: RTCIceServer[];
    iceTransportPolicy: string;
    bundlePolicy: string;
    rtcpMuxPolicy: string;
    iceCandidatePoolSize: number;
  }>> => {
    return makeRequest("/webrtc/ice-servers");
  },

  testConnectivity: async (testData: {
    candidateType: string;
    protocol: string;
    address: string;
    port: number;
  }): Promise<ApiResponse<any>> => {
    return makeRequest("/webrtc/test", {
      method: "POST",
      body: JSON.stringify(testData),
    });
  },

  getStats: async (): Promise<ApiResponse<{
    totalCalls: number;
    activeCalls: number;
    averageCallDuration: number;
    connectionSuccess: number;
    turnServerUsage: { stun: number; turn: number };
    networkTypes: { wifi: number; cellular: number; ethernet: number };
  }>> => {
    return makeRequest("/webrtc/stats");
  },

  reportIssue: async (issueData: {
    issueType: string;
    description: string;
    callId?: string;
    errorMessage?: string;
    browserInfo?: any;
    networkInfo?: any;
  }): Promise<ApiResponse<{ reportId: string }>> => {
    return makeRequest("/webrtc/report-issue", {
      method: "POST",
      body: JSON.stringify(issueData),
    });
  },
};

// Export all APIs
export const api = {
  auth: authApi,
  users: usersApi,
  chats: chatsApi,
  messages: messagesApi,
  calls: callsApi,
  friendRequests: friendRequestsApi,
  contacts: contactsApi,
  blocking: blockingApi,
  upload: uploadApi,
  health: healthApi,
  webrtc: webrtcApi,
};

export default api;
