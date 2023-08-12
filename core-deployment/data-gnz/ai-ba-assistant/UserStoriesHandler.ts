import mongoose from "mongoose";
import { MONGO_DB_URI } from "./config";
import { reqAuth } from "./middlewares/reqAuth";
import { Configuration, CreateChatCompletionResponse, OpenAIApi } from "openai";
import { AxiosResponse } from "axios";
import { ChatHistoryModel } from "./models/chatHistory";
import { prompt1, prompt2, storyPrompt } from "./storyPrompt";

export type GenerateStoryResponse = {
  responseInfo: ResponseInfo;
  story?: string;
};

export type ChatHistoryResponse = {
  responseInfo: ResponseInfo;
  chatHistory?: ChatHistory[];
};

export type ChatHistory = {
  id: string;
  userId: string;
  questionAsA: string;
  questionIWantTo: string;
  answer: string;
  createdAt: Date;
};

export type ResponseInfo = {
  success: boolean;
  msg?: string;
  code?: number;
};

export class UserStoriesHandler {
  openai: OpenAIApi;

  constructor() {
    this.#connect();

    const configuration = new Configuration({
      apiKey: process.env.OPENAI_SECRET_KEY
    });
    this.openai = new OpenAIApi(configuration);
  }

  /**
   * Private method used to connect to the DB.
   */
  #connect() {
    mongoose
      .connect(MONGO_DB_URI)
      .then(() => {
        console.log("Connected to MongoDB");
      })
      .catch((err) => {
        console.log("MONGO_CONNECT_ERR:" + err);
      });
  }

  async #gptCaller(prompt: string): Promise<string>{
    const completion: any = await this.openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2048
    }); 

    return completion.data.choices[0].message.content as string || "";
  }


  async generateStory(
    token: string,
    questionAsA: string,
    questionIWantTo: string
  ): Promise<GenerateStoryResponse> {
    const auth = await reqAuth(token);
    if (!auth.success) {
      return { responseInfo: { success: false, msg: auth.msg, code: 401 } };
    }

    const prompt1Final = prompt1
      .replace("<AS_A_TEXT>", questionAsA)
      .replace("<I_WANT_TO_TEXT>", questionIWantTo);
    
    const prompt2Final = prompt2
      .replace("<AS_A_TEXT>", questionAsA)
      .replace("<I_WANT_TO_TEXT>", questionIWantTo);

    // const answer = await this.#gptCaller(prompt1Final) + await this.#gptCaller(prompt2Final);

    const answer = (await Promise.all([this.#gptCaller(prompt1Final), this.#gptCaller(prompt2Final)])).join("\n");

    const resp = await ChatHistoryModel.create({
      userId: auth.user.id,
      questionAsA: questionAsA,
      questionIWantTo: questionIWantTo,
      answer: answer
    });

    return {
      responseInfo: { success: true },
      story: answer
    };
  }

  async getChatHistory(token: string): Promise<ChatHistoryResponse> {
    const auth = await reqAuth(token);
    if (!auth.success) {
      return { responseInfo: { success: false, msg: auth.msg, code: 401 } };
    }

    const chatHistory: any = await ChatHistoryModel.find({
      userId: auth.user.id
    });

    return {
      responseInfo: { success: true },
      chatHistory: chatHistory.map((chat: any) => {
        return {
          id: chat._id,
          userId: chat.userId,
          questionAsA: chat.questionAsA,
          questionIWantTo: chat.questionIWantTo,
          answer: chat.answer,
          createdAt: chat.createdAt
        };
      })
    };
  }
}
