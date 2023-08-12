import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import { UserModel } from "../models/user"
import { ActiveSession } from "../models/activeSession"
import { MONGO_DB_URI, saltedPassword, validatePassword } from "../helper"

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

/**
 * The User server class that will be deployed on the genezio infrastructure.
 */
export class UserService {
    constructor() {
        this.#connect();
    }

    /**
     * Private method used to connect to the DB.
     */
    #connect() {
        mongoose.connect(MONGO_DB_URI);
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