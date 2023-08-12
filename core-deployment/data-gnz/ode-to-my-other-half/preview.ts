import mongoose from "mongoose";
import { MONGO_DB_URI } from "../helper";
import { UserModel } from "../models/user";
import { OpenAIAssistant } from "../services/openAiAssistant"
const _ = require('lodash')

export class PoemPreview {
    openAIAssistant: OpenAIAssistant

    constructor() {
        mongoose.connect(MONGO_DB_URI);
        this.openAIAssistant = new OpenAIAssistant()
    }

    async generatePoemPreview(userId: string, token: string) {
        const user = await UserModel.findOne({ _id: userId });

        console.log(user)
        if (user.settings) {
            console.log(`DEBUG: Send message to user ${user.name}`);

            const words = _.sampleSize(user.settings?.poemSettings?.words, 3);
            console.log(`Using words: ${words}`)

            const request = `A ${user.settings?.poemSettings?.poemAdjective} poem for my partner about ${words.join(",")}`;
            const response = await this.openAIAssistant.askChatGPT(request)
            return response;
        }

        return "no"
    }
}