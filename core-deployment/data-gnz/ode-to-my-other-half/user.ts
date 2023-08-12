import mongoose from 'mongoose'
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    settings: {
        phone: String,
        poemSettings: {
            poemAdjective: String,
            words: [String],
        },
        hour: Number,
    },
    poems: [String]
  });

export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);