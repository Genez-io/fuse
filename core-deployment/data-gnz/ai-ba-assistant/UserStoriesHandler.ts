import mongoose from "mongoose";
import { MONGO_DB_URI } from "./config";
import { Configuration, OpenAIApi } from "openai";

export const storyPrompt: string = `
Write me a user story using the template above for <I_WANT_TO_TEXT> as a <AS_A_TEXT>
The template below is a user story for a registered user who wants to access a login page:
User Story:
AS A registered user,
I WANT TO access the login page
SO THAT I can log in with my username and password and access the app.
Description:
This page requires user identification and authentication by entering the correct username and password combination. It contains the following elements:
Title page
Two fields for username and password
Login button
Remember me checkbox
Command button that initiates the password-checking action
Social Media Accounts Login CTA
Acceptance Criteria:
AC1: Login successfully
GIVEN I have access to the login page,
WHEN I enter the correct username and password combination,
AND I click on the Login button,
THEN I will be redirected to the Homepage.
AC1.1: Login failed - wrong username and/or password
GIVEN I have access to the login page,
WHEN I enter an incorrect username and/or password combination,
AND I click on the Login button,
THEN an error message will be displayed below the field corresponding to the mistake, saying “Wrong username and/or password. Please fill in the correct credentials.”
AC1.2: Login failed - empty username and/or password
GIVEN I have access to the login page,
WHEN I leave at least one of the username and password fields empty,
THEN the Login button will not be clickable.
AC2: Remember me
GIVEN I have access to the login page,
AND I enter the correct username and password combination,
WHEN I want the app to remember my credentials,
THEN I have to check the Remember me checkbox before clicking on the Login button.
AC3: Forgot my password
GIVEN I have access to the login page,
WHEN I click on the “Forgot your password?” link,
THEN I will be redirected to the Password reset page (functionality covered by the “Remember me” user story).
AC4: Login with a social media/email account
GIVEN I have access to the login page,
WHEN I select to log in with my Gmail/Facebook account,
THEN a new page will be displayed to get access to my credentials (functionality covered by the “Login with Social Accounts” user story).
When the user acceptance criteria is numbered AC1.1 or AC1.2 and so on, this means that this acceptance criteria are negative scenarios for the opposite one who is numbered as AC1. Keep the AS A/I WANT TO/ SO THAT structure for a user story and add as many negative scenarios as possible for acceptance criteria.

`;


export const prompt1: string = `write me description as a user story for <I_WANT_TO_TEXT> as a <AS_A_TEXT> using the following structure
AS A
I WANT TO
SO THAT`;

export const prompt2: string = `write user acceptance criteria for <I_WANT_TO_TEXT> as a <AS_A_TEXT> considering the following format:
AC1: Title
GIVEN
WHEN
THEN.
AC3.1, for example, will be listed after AC3 as a negative scenario for AC3.  Add as many negative scenarios as possible.`;

const activeSessionSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

export const ActiveSession = mongoose.models.ActiveSession || mongoose.model('ActiveSession', activeSessionSchema);

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

export const ChatHistoryModel = mongoose.models.chatHistory || mongoose.model("chatHistory", chatHistorySchema);


export type ReqAuthResponse = {
  success: boolean;
  msg?: string;
  user?: any;
};

export async function reqAuth(token: string): Promise<ReqAuthResponse> {
  const activeSession = await ActiveSession.findOne({ token: token });
  if (!activeSession) {
    return { success: false, msg: "You are not logged in" };
  }

  const user = await UserModel.findOne({ _id: activeSession.userId });
  if (!user) {
    return { success: false, msg: "You are not logged in" };
  }

  return { success: true, user: user };
}

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
