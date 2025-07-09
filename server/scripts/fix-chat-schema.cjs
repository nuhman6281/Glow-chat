const mongoose = require("mongoose");

// Define the correct chat schema
const chatSchema = new mongoose.Schema({
  type: { type: String, enum: ["direct", "group"], required: true },
  name: String,
  description: String,
  participants: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      role: {
        type: String,
        enum: ["admin", "member"],
        default: "member",
      },
      joinedAt: { type: Date, default: Date.now },
      lastReadMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    },
  ],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  lastActivity: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Chat = mongoose.model("Chat", chatSchema);

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/glow-chat";

async function fixChatSchema() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Get all chats
    const chats = await Chat.find({});
    console.log(`Found ${chats.length} chats to process`);

    for (const chat of chats) {
      console.log(`Processing chat: ${chat._id}`);

      // Check if participants need to be fixed
      let needsUpdate = false;
      const fixedParticipants = [];

      for (const participant of chat.participants) {
        if (typeof participant === "string") {
          // Convert string to object
          fixedParticipants.push({
            user: participant,
            role: "member",
            joinedAt: new Date(),
          });
          needsUpdate = true;
          console.log(`  Fixed participant: ${participant}`);
        } else if (participant && typeof participant === "object") {
          // Already correct format, but ensure all required fields exist
          const fixedParticipant = {
            user: participant.user,
            role: participant.role || "member",
            joinedAt: participant.joinedAt || new Date(),
          };
          if (participant.lastReadMessage) {
            fixedParticipant.lastReadMessage = participant.lastReadMessage;
          }
          fixedParticipants.push(fixedParticipant);

          // Check if any fields are missing
          if (!participant.role || !participant.joinedAt) {
            needsUpdate = true;
            console.log(`  Fixed participant object: ${participant.user}`);
          }
        }
      }

      if (needsUpdate) {
        // Update the chat with fixed participants
        await Chat.updateOne(
          { _id: chat._id },
          {
            $set: {
              participants: fixedParticipants,
              lastActivity: chat.lastActivity || new Date(),
            },
          },
        );
        console.log(`  Updated chat: ${chat._id}`);
      } else {
        console.log(`  Chat ${chat._id} is already correct`);
      }
    }

    console.log("Schema migration completed successfully!");
  } catch (error) {
    console.error("Error fixing chat schema:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

fixChatSchema();
