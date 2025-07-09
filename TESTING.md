# GlowChat Testing Guide

## Current Status

The GlowChat application is now functional with mock data while we resolve backend schema issues.

### ✅ Working Features (Frontend with Mock Data)

1. **Authentication**

   - Login page with form validation
   - Mock authentication flow
   - Protected routes

2. **Chat Interface**

   - Chat sidebar with mock conversations
   - Direct and group chat support
   - Message list with mock messages
   - Message input (UI only, no backend integration)
   - Real-time UI updates

3. **User Management**

   - Add contact dialog
   - Create group dialog
   - Group management dialog
   - Contact management page
   - User roles and permissions UI

4. **UI Components**
   - Responsive design
   - Dark/light theme support
   - Mobile-friendly layout
   - Modern UI with shadcn/ui components

### 🔧 Backend Status

**Issues:**

- Chat schema mismatch causing internal server errors
- Participants field expects objects but receives strings
- Database queries failing due to schema inconsistency

**Working:**

- Authentication endpoints
- Health check endpoint
- Database connection
- Socket.IO setup

### 🧪 Testing Instructions

1. **Start the Application**

   ```bash
   # Start backend services
   docker compose up -d mongo redis backend

   # Start frontend (in another terminal)
   DISABLE_EXPRESS_PLUGIN=true yarn dev
   ```

2. **Test Frontend Features**

   - Open http://localhost:8080
   - Login with any credentials (mock auth)
   - Navigate through chat sidebar
   - Test direct and group chats
   - Try adding contacts and creating groups
   - Test responsive design on mobile

3. **Test Backend (Limited)**

   ```bash
   # Health check
   curl http://localhost:3000/api/health

   # Login (works)
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"john@example.com","password":"password123"}'

   # Chats endpoint (fails due to schema issue)
   curl -X GET http://localhost:3000/api/chats \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### 🚧 Next Steps

1. **Fix Backend Schema Issues**

   - Resolve participants field schema mismatch
   - Update database queries to handle both old and new schemas
   - Test chat creation and retrieval

2. **Connect Frontend to Backend**

   - Replace mock data with real API calls
   - Implement real-time messaging
   - Add proper error handling

3. **Additional Features**
   - File uploads
   - Voice/video calls
   - Message reactions
   - User status updates

### 📁 Key Files

- `client/components/chat/ChatSidebar.tsx` - Chat list with mock data
- `client/components/chat/MessageList.tsx` - Messages with mock data
- `client/pages/Index.tsx` - Main chat page with mock data
- `server/models/Chat.ts` - Chat model with schema issues
- `server/routes/chats.ts` - Chat API routes (failing)

### 🔍 Debugging

To check backend logs:

```bash
docker compose logs backend --tail=20
```

To recreate test data:

```bash
docker compose exec backend node server/scripts/create-test-data.cjs
```

The application is now in a working state with a fully functional frontend using mock data, while the backend schema issues are being resolved.
