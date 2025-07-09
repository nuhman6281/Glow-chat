# Glow Chat - Production-Ready Real-time Chat Application

A modern, full-stack real-time chat application with voice and video calling capabilities, built with React, Node.js, Socket.IO, and MongoDB.

## 🚀 Features

### ✅ Authentication & Security
- JWT-based authentication
- User registration and login
- Password hashing with bcrypt
- Rate limiting for API endpoints
- CORS protection

### 💬 Real-time Chat
- One-on-one messaging
- Group chat support
- Real-time message delivery
- Typing indicators
- Message read receipts
- Message reactions
- File and image sharing
- Voice messages
- Reply to messages
- Message editing and deletion

### 📞 Voice & Video Calls
- WebRTC-based calling
- Voice and video calls
- Group calls support
- Call recording capability
- Call history and statistics
- Screen sharing (ready for implementation)

### 👥 Contact Management
- Add and manage contacts
- User status indicators (online, away, offline)
- Contact search and filtering
- Block/unblock users
- User profiles with avatars

### 🎨 Modern UI/UX
- Responsive design
- Dark/light theme support
- Beautiful animations with Framer Motion
- Modern component library with Radix UI
- Tailwind CSS for styling
- Mobile-first approach

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type safety and better DX
- **Vite** - Fast build tool and dev server
- **Socket.IO Client** - Real-time communication
- **React Router** - Client-side routing
- **TanStack Query** - Server state management
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Socket.IO** - Real-time bidirectional communication
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Express Rate Limit** - Rate limiting middleware
- **Helmet** - Security middleware

### DevOps & Tools
- **TypeScript** - Static type checking
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Yarn** - Package management
- **Docker** - Containerization (optional)

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **MongoDB** (v4.4 or higher)
- **Yarn** (v4.x)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd glow-lab
```

### 2. Install Dependencies
```bash
yarn install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/glow-chat

# JWT Secret (change in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=3000
NODE_ENV=development

# Client URL for CORS
CLIENT_URL=http://localhost:8080

# Optional: File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Optional: Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional: WebRTC Configuration
TURN_SERVER_URL=turn:your-turn-server.com
TURN_USERNAME=your-turn-username
TURN_CREDENTIAL=your-turn-credential
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# On macOS with Homebrew
brew services start mongodb/brew/mongodb-community

# On Ubuntu/Debian
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 5. Development
Start the development server:
```bash
yarn dev
```

This will start:
- Frontend development server on `http://localhost:8080`
- Backend API server on `http://localhost:3000`

### 6. Production Build
```bash
# Build the application
yarn build

# Start production server
yarn start
```

## 🏗 Project Structure

```
glow-lab/
├── client/                 # Frontend React application
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Basic UI components (shadcn/ui)
│   │   ├── chat/          # Chat-specific components
│   │   └── layout/        # Layout components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   ├── lib/               # Utility functions
│   └── global.css         # Global styles
├── server/                # Backend Node.js application
│   ├── config/            # Configuration files
│   ├── middleware/        # Express middleware
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── socket/            # Socket.IO handlers
│   └── index.ts           # Server entry point
├── shared/                # Shared types and utilities
│   └── api.ts            # API type definitions
├── public/               # Static assets
├── dist/                 # Production build output
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### Chat (Protected Routes)
- `GET /api/chats` - Get user's chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/:id/messages` - Get chat messages
- `POST /api/chats/:id/messages` - Send message
- `PUT /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message

### Users (Protected Routes)
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/contacts` - Get user contacts
- `POST /api/users/contacts` - Add contact
- `DELETE /api/users/contacts/:id` - Remove contact

### Calls (Protected Routes)
- `GET /api/calls` - Get call history
- `POST /api/calls` - Initiate call
- `PUT /api/calls/:id` - Update call status

## 🔌 Socket.IO Events

### Connection Events
- `connect` - User connected
- `disconnect` - User disconnected

### Chat Events
- `join_chat` - Join chat room
- `leave_chat` - Leave chat room
- `send_message` - Send message
- `new_message` - Receive new message
- `typing_start` - User started typing
- `typing_stop` - User stopped typing
- `mark_as_read` - Mark messages as read

### Call Events
- `initiate_call` - Start a call
- `incoming_call` - Receive call invitation
- `answer_call` - Answer call
- `decline_call` - Decline call
- `end_call` - End call
- `webrtc_signal` - WebRTC signaling

### User Events
- `update_status` - Update user status
- `contact_status_changed` - Contact status changed

## 🎯 Usage

### 1. User Registration/Login
- Navigate to the login page
- Create a new account or sign in with existing credentials
- You'll be redirected to the main chat interface

### 2. Starting Conversations
- Click on "Contacts" to view your contacts
- Click "Add Contact" to add new users
- Start chatting by clicking on a contact

### 3. Making Calls
- In any chat, click the phone or video icon to start a call
- Answer incoming calls from the notification

### 4. Group Chats
- Create group chats from the sidebar
- Add multiple participants
- Enjoy group messaging and calls

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Passwords are hashed using bcrypt
- **Rate Limiting** - Prevents abuse of API endpoints
- **CORS Protection** - Controls cross-origin requests
- **Input Validation** - Server-side validation using express-validator
- **Helmet Security** - Sets various HTTP headers for security

## 🚀 Deployment

### Using Docker (Recommended)
```bash
# Build the application
yarn build

# Run with Docker Compose
docker-compose up -d
```

### Manual Deployment
1. Set up a production MongoDB instance
2. Configure environment variables for production
3. Build the application: `yarn build`
4. Start the production server: `yarn start`
5. Set up a reverse proxy (nginx) for SSL and load balancing

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db-url
JWT_SECRET=your-super-secure-jwt-secret
PORT=3000
CLIENT_URL=https://your-domain.com
```

## 🧪 Testing

```bash
# Run tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run type checking
yarn typecheck
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) section
2. Create a new issue with detailed information
3. Join our community discussions

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - The web framework used
- [Socket.IO](https://socket.io/) - Real-time communication
- [MongoDB](https://www.mongodb.com/) - Database
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Radix UI](https://www.radix-ui.com/) - Component primitives

---

Built with ❤️ by the Glow Chat team
