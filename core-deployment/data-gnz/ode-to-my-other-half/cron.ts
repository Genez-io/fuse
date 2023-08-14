import { Configuration, OpenAIApi } from "openai";
import dotenv from "dotenv";
import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

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

export class SendMessageService {
    client: any;
    constructor() {
        require('dotenv').config();
        const accountSid: string | undefined = process.env.TWILIO_ACCOUNT_SID;
        const authToken: string | undefined = process.env.TWILIO_AUTH_TOKEN;
        console.log(accountSid, authToken);

        this.client = require('twilio')(accountSid, authToken);
    }

	async sendTestMessage(message: string | undefined, to: string | undefined): Promise<string> {
        const msg = await this.client.messages.create({
            body: message,
            from: "whatsapp:+14155238886",
            to: "whatsapp:" + to
        });

        console.log(msg.sid);
        return "Message sent!";
    }
}

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

export type AuthResponse = {
  success: boolean,
  msg?: string
}

export async function validatePassword(saltedPassword: string, password: string): Promise<boolean> {
  return new Promise((resolve) => {
    bcrypt.compare(password, saltedPassword, async function (err: any, res: any) {
      if (err) {
        throw err
      }
      if (res) {
        resolve(true)
      } else {
        resolve(false)
      }
    });
  });
}

export async function saltedPassword(password: string): Promise<string> {
  return new Promise((resolve) => {
    bcrypt.genSalt(2, function (err: any, salt: any) {
      if (err) {
        throw err
      }

      bcrypt.hash(password, salt, async function (err: any, hash: any) {
        if (err) {
          throw err
        }

        resolve(hash);
      });
    });
  });
}

export async function reqAuth(token: string): Promise<AuthResponse> {
  const session = await ActiveSession.find({ token: token });
  if (session.length == 1) {
    return { success: true };
  } else {
    return { success: false, msg: "User is not logged on" };
  }
}

export type UserSettings = {
    phone?: string | undefined,
    poemSettings?: {
        poemAdjective?: string | undefined,
        words: string[],
    },
    hour?: number | undefined,
}

export type User = {
    _id: string,
    name: string,
    email: string,
    settings: UserSettings,
    poems: string[],
}

export enum AuthResultStatus {
    Ok = "Ok",
    Fail = "Fail"
}

export type AuthResult = {
    status: AuthResultStatus,
    token?: string,
    user?: User,
    message?: string,
}


export class UserService {
    constructor() {
        this.#connect();
    }

    /**
     * Private method used to connect to the DB.
     */
    #connect() {
        mongoose.connect("mongodb+srv://genezio:genezio@cluster0.c6qmwnq.mongodb.net/?retryWrites=true&w=majority");
    }

    /**
     * Method that can be used to create a new user.
     *
     * The method will be exported via SDK using genezio.
     *
     * @param {*} name The user's name.
     * @param {*} email The user's email.
     * @param {*} password The user's password.
     * @returns An object containing a boolean property "success" which
     * is true if the creation was successfull, false otherwise.
     */
    async register(name: string, email: string, password: string): Promise<AuthResult> {
        console.log(`Registering user with name ${name} and email ${email}...`)

        const user = await UserModel.findOne({ email: email })
        if (user) {
            return { status: AuthResultStatus.Fail, message: "User already exists" }
        } else {
            const result = await saltedPassword(password)
            await UserModel.create({
                name: name,
                email: email,
                password: result,
                settings: {
                    phone: "",
                    poemSettings: {
                        poemAdjective: "",
                        words: []
                    },
                    hour: 12
                },
                poems: []
            });

            return { status: AuthResultStatus.Ok, message: "User created" }
        }
    }

    /**
     * Method that can be used to obtain a login token for a giving user.
     *
     * The method will be exported via SDK using genezio.
     *
     * @param {*} email The user's email.
     * @param {*} password The user's password.
     * @returns
     */
    async login(email: string, password: string): Promise<AuthResult> {
        console.log(`Loginn request received for user with email ${email}`)

        const user = await UserModel.findOne({ email: email });

        if (!user) {
            return { status: AuthResultStatus.Fail, message: "User not found" };
        }

        const isValid = await validatePassword(user.password!, password)

        if (isValid) {
            user.password = undefined;
            const token = jwt.sign(user.toJSON(), "secret", {
                expiresIn: 86400 // 1 week
            });

            await ActiveSession.create({ token: token, userId: user._id });
            return {
                status: AuthResultStatus.Ok, user: {
                    _id: user._id.toString(),
                    name: user.name!,
                    email: user.email!,
                    settings: user.settings!,
                    poems: user.poems!,
                }, token: token
            }
        } else {
            return { status: AuthResultStatus.Fail, message: "Incorrect user or password" }
        }
    }

    /**
     * Methods that receives a token and confirms if it is valid or not.
     *
     * @param {*} token The user's token.
     * @returns An object containing a boolean property "success" which is true if the token is valid, false otherwise.
     */
    async checkSession(token: string): Promise<AuthResult> {
        console.log("Check session request received...")

        const activeSession = await ActiveSession.findOne({ token: token });
        if (!activeSession) {
            return { status: AuthResultStatus.Fail, message: "Session not found" };
        }

        const user = await UserModel.findById(activeSession.userId);
        if (!user) {
            return { status: AuthResultStatus.Fail, message: "User not found" };
        }

        return { status: AuthResultStatus.Ok };
    }

    async setPreferences(userId: string, poemAdjective: string, words: string[], hour: number, phone: string): Promise<AuthResult> {
        const user = await UserModel.findById(userId);

        if (!user) {
            return { status: AuthResultStatus.Fail, message: "User not found" };
        }

        const settings: UserSettings = {
            phone, poemSettings: {
                poemAdjective, words
            }, hour
        }

        user.settings = settings;
        await user.save();

        return { status: AuthResultStatus.Ok };
    }

    async getPreferences(userId: string): Promise<UserSettings | AuthResult> {
        const user = await UserModel.findById(userId);

        if (!user) {
            return { status: AuthResultStatus.Fail, message: "User not found" };
        }

        return user.settings ? user.settings : { status: AuthResultStatus.Fail, message: "User not found" };
    }

    async addPoem(userId: string, poem: string): Promise<AuthResult> {
        const user = await UserModel.findById(userId);

        if (!user) {
            return { status: AuthResultStatus.Fail, message: "User not found" };
        }

        user.poems.push(poem);
        await user.save();

        return { status: AuthResultStatus.Ok, user: {
            _id: user._id.toString(),
            name: user.name!,
            email: user.email!,
            settings: user.settings!,
            poems: user.poems!,
        } };
    }

    async getPoems(userId: string): Promise<string[] | AuthResult> {
        const user = await UserModel.findById(userId);

        if (!user) {
            return { status: AuthResultStatus.Fail, message: "User not found" };
        }

        return user.poems ? user.poems : { status: AuthResultStatus.Fail, message: "User not found" };
    }
}

export class SendMessageCron {
    constructor() {
        mongoose.connect("");
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
