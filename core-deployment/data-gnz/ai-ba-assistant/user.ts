import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
    },
    profilePicUrl: {
      type: String,
      required: true,
    },
    accountType: {
      type: String,
      required: true,
      default: 'google'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
  });

export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);