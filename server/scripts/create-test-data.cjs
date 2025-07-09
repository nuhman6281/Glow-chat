const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define schemas inline for simplicity
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  avatar: String,
  status: {
    type: String,
    enum: ["online", "away", "offline"],
    default: "offline",
  },
  lastSeen: { type: Date, default: Date.now },
});

const chatSchema = new mongoose.Schema({
  type: { type: String, enum: ["direct", "group"], required: true },
  name: String,
  description: String,
  participants: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      role: {
        type: String,
        enum: ["admin", "moderator", "member"],
        default: "member",
      },
    },
  ],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  lastActivity: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const messageSchema = new mongoose.Schema({
  chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: String,
  type: {
    type: String,
    enum: ["text", "image", "file", "voice", "video"],
    default: "text",
  },
  fileUrl: String,
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Chat = mongoose.model("Chat", chatSchema);
const Message = mongoose.model("Message", messageSchema);

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://admin:password123@localhost:27017/glow-chat?authSource=admin";

async function createTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Chat.deleteMany({});
    await Message.deleteMany({});
    console.log("Cleared existing data");

    // Create test users
    const hashedPassword = await bcrypt.hash("password123", 10);

    const user1 = new User({
      firstName: "John",
      lastName: "Doe",
      username: "johndoe",
      email: "john@example.com",
      password: hashedPassword,
      avatar: null,
      status: "online",
      lastSeen: new Date(),
    });

    const user2 = new User({
      firstName: "Jane",
      lastName: "Smith",
      username: "janesmith",
      email: "jane@example.com",
      password: hashedPassword,
      avatar: null,
      status: "online",
      lastSeen: new Date(),
    });

    const user3 = new User({
      firstName: "Bob",
      lastName: "Wilson",
      username: "bobwilson",
      email: "bob@example.com",
      password: hashedPassword,
      avatar: null,
      status: "away",
      lastSeen: new Date(Date.now() - 300000), // 5 minutes ago
    });

    await user1.save();
    await user2.save();
    await user3.save();
    console.log("Created test users");

    // Create a direct chat between user1 and user2
    const directChat = new Chat({
      type: "direct",
      participants: [
        { user: user1._id, role: "member", joinedAt: new Date() },
        { user: user2._id, role: "member", joinedAt: new Date() },
      ],
      lastActivity: new Date(),
      createdBy: user1._id,
    });

    await directChat.save();
    console.log("Created direct chat");

    // Create a group chat
    const groupChat = new Chat({
      type: "group",
      name: "Test Group",
      description: "A test group chat",
      participants: [
        { user: user1._id, role: "admin", joinedAt: new Date() },
        { user: user2._id, role: "member", joinedAt: new Date() },
        { user: user3._id, role: "member", joinedAt: new Date() },
      ],
      lastActivity: new Date(),
      createdBy: user1._id,
    });

    await groupChat.save();
    console.log("Created group chat");

    // Create some test messages
    const message1 = new Message({
      chat: directChat._id,
      sender: user1._id,
      content: "Hello Jane!",
      type: "text",
    });

    const message2 = new Message({
      chat: directChat._id,
      sender: user2._id,
      content: "Hi John! How are you?",
      type: "text",
    });

    const message3 = new Message({
      chat: groupChat._id,
      sender: user1._id,
      content: "Welcome to the group!",
      type: "text",
    });

    await message1.save();
    await message2.save();
    await message3.save();
    console.log("Created test messages");

    // Update chats with last message
    directChat.lastMessage = message2._id;
    groupChat.lastMessage = message3._id;
    await directChat.save();
    await groupChat.save();

    console.log("Test data created successfully!");
    console.log("Users:", {
      user1: user1._id,
      user2: user2._id,
      user3: user3._id,
    });
    console.log("Chats:", { direct: directChat._id, group: groupChat._id });
  } catch (error) {
    console.error("Error creating test data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

createTestData();
