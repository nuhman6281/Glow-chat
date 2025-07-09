import mongoose from "mongoose";
import User from "../models/User";
import Chat from "../models/Chat";
import Message from "../models/Message";
import bcrypt from "bcryptjs";

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
      phoneNumber: "+1234567890",
      bio: "Software Developer",
      location: "San Francisco, CA",
      jobTitle: "Senior Developer",
      department: "Engineering",
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
      phoneNumber: "+1234567891",
      bio: "Product Manager",
      location: "New York, NY",
      jobTitle: "Product Manager",
      department: "Product",
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
      phoneNumber: "+1234567892",
      bio: "Designer",
      location: "Los Angeles, CA",
      jobTitle: "UI/UX Designer",
      department: "Design",
    });

    const user4 = new User({
      firstName: "Alice",
      lastName: "Johnson",
      username: "alicejohnson",
      email: "alice@example.com",
      password: hashedPassword,
      avatar: null,
      status: "offline",
      lastSeen: new Date(Date.now() - 3600000), // 1 hour ago
      phoneNumber: "+1234567893",
      bio: "Marketing Specialist",
      location: "Chicago, IL",
      jobTitle: "Marketing Manager",
      department: "Marketing",
    });

    const user5 = new User({
      firstName: "Charlie",
      lastName: "Brown",
      username: "charliebrown",
      email: "charlie@example.com",
      password: hashedPassword,
      avatar: null,
      status: "online",
      lastSeen: new Date(),
      phoneNumber: "+1234567894",
      bio: "Data Scientist",
      location: "Seattle, WA",
      jobTitle: "Data Scientist",
      department: "Analytics",
    });

    await user1.save();
    await user2.save();
    await user3.save();
    await user4.save();
    await user5.save();
    console.log("Created test users");

    // Create direct chats
    const directChat1 = new Chat({
      type: "direct",
      participants: [
        { user: user1._id, role: "member" },
        { user: user2._id, role: "member" },
      ],
      lastActivity: new Date(),
      createdBy: user1._id,
    });

    const directChat2 = new Chat({
      type: "direct",
      participants: [
        { user: user1._id, role: "member" },
        { user: user3._id, role: "member" },
      ],
      lastActivity: new Date(Date.now() - 600000), // 10 minutes ago
      createdBy: user1._id,
    });

    const directChat3 = new Chat({
      type: "direct",
      participants: [
        { user: user2._id, role: "member" },
        { user: user4._id, role: "member" },
      ],
      lastActivity: new Date(Date.now() - 1800000), // 30 minutes ago
      createdBy: user2._id,
    });

    await directChat1.save();
    await directChat2.save();
    await directChat3.save();
    console.log("Created direct chats");

    // Create group chats
    const groupChat1 = new Chat({
      type: "group",
      name: "Development Team",
      description: "Team chat for developers",
      participants: [
        { user: user1._id, role: "admin" },
        { user: user2._id, role: "member" },
        { user: user3._id, role: "member" },
        { user: user5._id, role: "member" },
      ],
      lastActivity: new Date(),
      createdBy: user1._id,
    });

    const groupChat2 = new Chat({
      type: "group",
      name: "Marketing Team",
      description: "Marketing team discussions",
      participants: [
        { user: user2._id, role: "admin" },
        { user: user4._id, role: "member" },
        { user: user1._id, role: "member" },
      ],
      lastActivity: new Date(Date.now() - 900000), // 15 minutes ago
      createdBy: user2._id,
    });

    const groupChat3 = new Chat({
      type: "group",
      name: "General",
      description: "General company chat",
      participants: [
        { user: user1._id, role: "admin" },
        { user: user2._id, role: "member" },
        { user: user3._id, role: "member" },
        { user: user4._id, role: "member" },
        { user: user5._id, role: "member" },
      ],
      lastActivity: new Date(Date.now() - 7200000), // 2 hours ago
      createdBy: user1._id,
    });

    await groupChat1.save();
    await groupChat2.save();
    await groupChat3.save();
    console.log("Created group chats");

    // Create test messages for direct chats
    const message1 = new Message({
      chat: directChat1._id,
      sender: user1._id,
      content: "Hello Jane! How's the project going?",
      type: "text",
    });

    const message2 = new Message({
      chat: directChat1._id,
      sender: user2._id,
      content: "Hi John! It's going great. We're on track for the deadline.",
      type: "text",
    });

    const message3 = new Message({
      chat: directChat1._id,
      sender: user1._id,
      content: "That's fantastic! Let's catch up tomorrow.",
      type: "text",
    });

    const message4 = new Message({
      chat: directChat2._id,
      sender: user1._id,
      content: "Hey Bob, can you review the new design?",
      type: "text",
    });

    const message5 = new Message({
      chat: directChat2._id,
      sender: user3._id,
      content: "Sure! I'll take a look at it this afternoon.",
      type: "text",
    });

    const message6 = new Message({
      chat: directChat3._id,
      sender: user2._id,
      content: "Alice, the marketing campaign is ready for review.",
      type: "text",
    });

    await message1.save();
    await message2.save();
    await message3.save();
    await message4.save();
    await message5.save();
    await message6.save();

    // Create test messages for group chats
    const groupMessage1 = new Message({
      chat: groupChat1._id,
      sender: user1._id,
      content: "Welcome everyone to the Development Team chat!",
      type: "text",
    });

    const groupMessage2 = new Message({
      chat: groupChat1._id,
      sender: user2._id,
      content: "Thanks John! Looking forward to working with everyone.",
      type: "text",
    });

    const groupMessage3 = new Message({
      chat: groupChat1._id,
      sender: user3._id,
      content: "The new UI design is ready for implementation.",
      type: "text",
    });

    const groupMessage4 = new Message({
      chat: groupChat2._id,
      sender: user2._id,
      content: "Marketing team meeting tomorrow at 10 AM.",
      type: "text",
    });

    const groupMessage5 = new Message({
      chat: groupChat2._id,
      sender: user4._id,
      content: "I'll prepare the presentation slides.",
      type: "text",
    });

    const groupMessage6 = new Message({
      chat: groupChat3._id,
      sender: user1._id,
      content: "Company-wide announcement: New office opening next month!",
      type: "text",
    });

    await groupMessage1.save();
    await groupMessage2.save();
    await groupMessage3.save();
    await groupMessage4.save();
    await groupMessage5.save();
    await groupMessage6.save();

    console.log("Created test messages");

    // Update chats with last message
    directChat1.lastMessage = message3._id;
    directChat2.lastMessage = message5._id;
    directChat3.lastMessage = message6._id;
    groupChat1.lastMessage = groupMessage3._id;
    groupChat2.lastMessage = groupMessage5._id;
    groupChat3.lastMessage = groupMessage6._id;

    await directChat1.save();
    await directChat2.save();
    await directChat3.save();
    await groupChat1.save();
    await groupChat2.save();
    await groupChat3.save();

    console.log("Test data created successfully!");
    console.log("Users:", {
      user1: user1._id,
      user2: user2._id,
      user3: user3._id,
      user4: user4._id,
      user5: user5._id,
    });
    console.log("Direct Chats:", {
      chat1: directChat1._id,
      chat2: directChat2._id,
      chat3: directChat3._id,
    });
    console.log("Group Chats:", {
      devTeam: groupChat1._id,
      marketing: groupChat2._id,
      general: groupChat3._id,
    });
  } catch (error) {
    console.error("Error creating test data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

createTestData();
