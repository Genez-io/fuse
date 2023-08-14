import mongoose from "mongoose";
const _ = require('lodash')

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

import { Configuration, OpenAIApi } from "openai";
import dotenv from "dotenv";

export class OpenAIAssistant {
  openai: OpenAIApi;

  constructor() {
    dotenv.config();
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_SECRET_KEY
    });
    const openai = new OpenAIApi(configuration);
    this.openai = openai;
  }

  async askChatGPT(requestText: string) {
    const completion = await this.openai.createCompletion({
      model: "text-davinci-003",
      prompt: requestText,
      "temperature": 0.8,
      max_tokens: 2048
    });
    console.log(
      `DEBUG: request: ${requestText}, response: ${completion.data.choices[0]
        .text}`
    );
    return completion.data.choices[0].text;
  }
}

export class PoemPreview {
    openAIAssistant: OpenAIAssistant

    constructor() {
        mongoose.connect("mongodb+srv://genezio:genezio@cluster0.c6qmwnq.mongodb.net/?retryWrites=true&w=majority");
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
