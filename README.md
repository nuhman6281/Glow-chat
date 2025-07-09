# 🌟 Glow Chat - Real-time Chat Application

A modern, feature-rich real-time chat application built with React, Node.js, MongoDB, and WebRTC. Supports text messaging, file sharing, voice/video calls, screen sharing, and more.

## ✨ Features

### 🔧 Core Features
- **Real-time Messaging** - Instant text messaging with typing indicators
- **User Authentication** - Secure JWT-based authentication system
- **Friend Requests** - Send, accept, reject, and manage friend requests
- **File Sharing** - Upload and share images, documents, and media files
- **User Profiles** - Customizable user profiles with avatars

### 📞 Communication Features
- **Voice Calls** - High-quality voice calling with WebRTC
- **Video Calls** - HD video calling with camera controls
- **Screen Sharing** - Share your screen during calls
- **Group Calls** - Multi-participant video/voice calls
- **Call Recording** - Record calls for later playback

### 🎨 User Experience
- **Dark/Light Theme** - Toggle between dark and light modes
- **Sound Notifications** - Customizable notification sounds
- **Message Search** - Search through chat history with highlighting
- **Typing Indicators** - See when others are typing
- **Read Receipts** - Know when messages are read
- **Online Status** - See who's online and offline

### 🔒 Privacy & Security
- **User Blocking** - Block unwanted users
- **Privacy Controls** - Control who can see your status and info
- **Secure File Upload** - Safe file sharing with validation
- **End-to-end Encryption** - Secure message transmission

## 🏗️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Socket.IO Client** for real-time communication
- **React Query** for state management
- **WebRTC** for peer-to-peer communication

### Backend
- **Node.js** with Express and TypeScript
- **MongoDB** with Mongoose ODM
- **Redis** for session storage and caching
- **Socket.IO** for WebSocket connections
- **JWT** for authentication
- **Multer** for file uploads
- **bcrypt** for password hashing

### Infrastructure
- **Docker** for containerization
- **Docker Compose** for orchestration
- **Nginx** for reverse proxy
- **Coturn** for TURN/STUN server
- **Prometheus** for monitoring (optional)
- **Grafana** for dashboards (optional)

## 🚀 Quick Start

### Prerequisites

- **Docker** and **Docker Compose**
- **Node.js 18+** (for local development)
- **Git**

### 1. Clone the Repository

```bash
git clone <repository-url>
cd glow-chat
```

### 2. Environment Setup

Copy the environment template and configure:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-secure-password
MONGO_DB_NAME=glow_chat

# Redis
REDIS_PASSWORD=your-redis-password

# JWT
JWT_SECRET=your-super-secret-jwt-key

# WebRTC (Optional - for production)
TURN_SERVER_URL=turn:your-domain.com:3478
TURN_USERNAME=your-turn-username
TURN_PASSWORD=your-turn-password
TURN_SECRET=your-turn-secret

# Frontend URLs
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
```

### 3. Start the Application

```bash
# Start all services
docker-compose up -d

# Or start with monitoring
docker-compose --profile monitoring up -d

# Or start with nginx reverse proxy
docker-compose --profile nginx up -d
```

### 4. Verify Deployment

Run the deployment test script:

```bash
./scripts/test-deployment.sh
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **API Documentation**: http://localhost:3000/api-docs (if enabled)
- **Monitoring**: http://localhost:3001 (Grafana, if using monitoring profile)

## 🔧 Development Setup

### Local Development

1. **Install Dependencies**

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

2. **Start Development Servers**

```bash
# Start MongoDB and Redis
docker-compose up mongodb redis -d

# Start backend (in server directory)
npm run dev

# Start frontend (in client directory)
npm run dev
```

3. **Database Setup**

```bash
# Seed database with test data
cd server
npm run seed
```

### Testing

```bash
# Run backend tests
cd server
npm test

# Run frontend tests
cd client
npm test

# Run E2E tests
npm run test:e2e

# Run deployment tests
./scripts/test-deployment.sh
```

## 📁 Project Structure

```
glow-chat/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilities and API
│   │   ├── pages/          # Page components
│   │   └── contexts/       # React contexts
│   ├── public/
│   │   └── sounds/         # Notification sounds
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── models/         # Database models
│   │   ├── middleware/     # Express middleware
│   │   ├── socket/         # Socket.IO handlers
│   │   └── config/         # Configuration files
│   └── package.json
├── shared/                 # Shared TypeScript types
├── scripts/                # Deployment and utility scripts
├── docker-compose.yml      # Docker orchestration
├── Dockerfile.server       # Server container
├── Dockerfile.client       # Client container
└── README.md
```

## 🔌 API Documentation

### Authentication Endpoints

```
POST /api/auth/register     # Register new user
POST /api/auth/login        # Login user
POST /api/auth/logout       # Logout user
POST /api/auth/refresh      # Refresh JWT token
```

### User Endpoints

```
GET    /api/users/me        # Get current user
PUT    /api/users/me        # Update current user
GET    /api/users           # Get all users
GET    /api/users/:id       # Get user by ID
POST   /api/users/block/:id # Block user
DELETE /api/users/block/:id # Unblock user
```

### Chat Endpoints

```
GET    /api/chats           # Get user's chats
POST   /api/chats           # Create new chat
GET    /api/chats/:id       # Get chat by ID
PUT    /api/chats/:id       # Update chat
DELETE /api/chats/:id       # Delete chat
```

### Message Endpoints

```
GET    /api/messages/:chatId    # Get chat messages
POST   /api/messages            # Send message
PUT    /api/messages/:id        # Update message
DELETE /api/messages/:id        # Delete message
```

### Friend Request Endpoints

```
POST   /api/friend-requests/send/:userId     # Send friend request
POST   /api/friend-requests/accept/:id       # Accept friend request
POST   /api/friend-requests/reject/:id       # Reject friend request
DELETE /api/friend-requests/cancel/:id       # Cancel friend request
GET    /api/friend-requests/received         # Get received requests
GET    /api/friend-requests/sent             # Get sent requests
```

### Call Endpoints

```
POST   /api/calls           # Initiate call
GET    /api/calls/:id       # Get call details
PATCH  /api/calls/:id       # Update call status
GET    /api/calls/ongoing   # Get ongoing calls
```

### WebRTC Endpoints

```
GET    /api/webrtc/ice-servers   # Get ICE servers config
POST   /api/webrtc/test          # Test connectivity
GET    /api/webrtc/stats         # Get WebRTC statistics
POST   /api/webrtc/report-issue  # Report issues
```

## 🌐 Production Deployment

### Cloud Deployment Options

#### 1. AWS ECS/Fargate
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker build -f Dockerfile.server -t glow-chat-server .
docker tag glow-chat-server:latest <account>.dkr.ecr.us-east-1.amazonaws.com/glow-chat-server:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/glow-chat-server:latest
```

#### 2. Google Cloud Run
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT_ID/glow-chat-server
gcloud run deploy --image gcr.io/PROJECT_ID/glow-chat-server --platform managed
```

#### 3. DigitalOcean App Platform
```yaml
# app.yaml
name: glow-chat
services:
- name: backend
  source_dir: /
  dockerfile_path: Dockerfile.server
  instance_count: 1
  instance_size_slug: basic-xxs
- name: frontend
  source_dir: /
  dockerfile_path: Dockerfile.client
  instance_count: 1
  instance_size_slug: basic-xxs
```

### Environment Variables for Production

```env
# Production Environment
NODE_ENV=production

# Database (use managed service in production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/glow_chat

# Redis (use managed service in production)
REDIS_URL=redis://username:password@redis.provider.com:6379

# Security
JWT_SECRET=very-long-random-string-for-production
CORS_ORIGIN=https://yourdomain.com

# WebRTC (use TURN service like Twilio)
TURN_SERVER_URL=turn:global.turn.twilio.com:3478
TURN_USERNAME=your-twilio-username
TURN_PASSWORD=your-twilio-password

# Monitoring
ENABLE_LOGGING=true
LOG_LEVEL=info
```

### SSL/HTTPS Setup

For production deployment with SSL:

1. **Obtain SSL certificates** (Let's Encrypt, CloudFlare, etc.)
2. **Update nginx configuration** with SSL settings
3. **Use HTTPS URLs** in environment variables

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/nginx/certs/cert.pem;
    ssl_certificate_key /etc/nginx/certs/key.pem;
    
    # Your existing configuration...
}
```

## 📊 Monitoring and Logging

### Prometheus Metrics

The application exposes metrics at `/metrics` endpoint:

- **HTTP request duration**
- **Active WebSocket connections**
- **Database query performance**
- **Memory and CPU usage**

### Grafana Dashboards

Pre-configured dashboards for:

- **Application Performance**
- **Database Metrics**
- **WebRTC Call Quality**
- **User Activity**

Access Grafana at http://localhost:3001 (default: admin/admin)

### Log Aggregation

Logs are structured and can be easily integrated with:

- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Fluentd**
- **CloudWatch** (AWS)
- **Stackdriver** (Google Cloud)

## 🔧 Configuration

### Feature Flags

Enable/disable features via environment variables:

```env
ENABLE_FRIEND_REQUESTS=true
ENABLE_GROUP_CHAT=true
ENABLE_FILE_UPLOAD=true
ENABLE_VOICE_CALLS=true
ENABLE_VIDEO_CALLS=true
ENABLE_SCREEN_SHARE=true
```

### Rate Limiting

Configure API rate limiting:

```env
RATE_LIMIT_WINDOW=15        # Minutes
RATE_LIMIT_MAX=100          # Requests per window
```

### File Upload Limits

```env
MAX_FILE_SIZE=50mb          # Maximum file size
UPLOAD_DIR=/app/uploads     # Upload directory
```

## 🐛 Troubleshooting

### Common Issues

1. **WebRTC connections fail**
   - Check TURN server configuration
   - Verify firewall settings
   - Test with `./scripts/test-deployment.sh`

2. **Database connection errors**
   - Verify MongoDB URI
   - Check network connectivity
   - Ensure credentials are correct

3. **Frontend not loading**
   - Check if backend is running
   - Verify API URL configuration
   - Check browser console for errors

4. **File uploads failing**
   - Check upload directory permissions
   - Verify file size limits
   - Ensure proper CORS configuration

### Debug Mode

Enable debug mode for detailed logging:

```env
DEBUG=true
LOG_LEVEL=debug
```

### Health Checks

Monitor application health:

```bash
# API health
curl http://localhost:3000/api/health

# Database health
docker exec glow-chat-mongodb mongosh --eval "db.adminCommand('ping')"

# Redis health
docker exec glow-chat-redis redis-cli ping
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- **Follow TypeScript strict mode**
- **Write tests for new features**
- **Use conventional commit messages**
- **Update documentation**
- **Run linting before committing**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline comments
- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions

## 🎯 Roadmap

- [ ] **Mobile App** - React Native mobile application
- [ ] **AI Integration** - ChatGPT-like AI assistant
- [ ] **Message Encryption** - End-to-end encryption
- [ ] **Voice Messages** - Audio message support
- [ ] **Emoji Reactions** - React to messages with emojis
- [ ] **Message Threading** - Threaded conversations
- [ ] **Custom Themes** - User-created themes
- [ ] **Bot Framework** - Create and deploy chat bots

---

**Made with ❤️ by the Glow Chat Team**
