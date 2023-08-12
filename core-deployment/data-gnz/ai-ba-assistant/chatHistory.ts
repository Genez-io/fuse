import mongoose from "mongoose";

const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  questionAsA: {
    type: String,
    required: true
  },
  questionIWantTo: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const ChatHistoryModel =
  mongoose.models.chatHistory ||
  mongoose.model("chatHistory", chatHistorySchema);
