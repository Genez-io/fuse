import { UserModel } from "../models/user";
import { OpenAIAssistant } from "../services/openAiAssistant";
import { SendMessageService } from "../services/sendSmsService";
import { UserService } from "./users";
import mongoose from "mongoose";
import { MONGO_DB_URI } from "../helper";
const _ = require('lodash')

export class SendMessageCron {
    constructor() {
        mongoose.connect(MONGO_DB_URI);
    }
    async sendMessage() {
        const openAIAssistant = new OpenAIAssistant();
        const sendMessageService = new SendMessageService();
        const users = await UserModel.find();
        const promises: Promise<any>[] = [];
        for (const user of users) {
            if (user.settings) {
                const hour = new Date().getHours();
                if (hour == user.settings.hour) {
                    console.log(`DEBUG: Send message to user ${user.name}`);

                    const words = _.sampleSize(user.settings?.poemSettings?.words, 3);
                    console.log(`Using words: ${words}`)

                    const request = `A ${user.settings?.poemSettings?.poemAdjective} poem for my partner about ${words.join(",")}`;
                    const openAIResponse = openAIAssistant.askChatGPT(request).then(async (response) => {
                        if (response) {
                            await sendMessageService.sendTestMessage(response, user.settings?.phone);
                            const userService = new UserService();
                            await userService.addPoem(user._id.toString(), response);
                        }
                    });
                    promises.push(openAIResponse);
                }
            }
        }
        await Promise.all(promises);
    }
}
