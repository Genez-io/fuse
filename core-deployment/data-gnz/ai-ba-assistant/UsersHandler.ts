import { MONGO_DB_URI, GOOGLE_CLIENT_ID, TOKEN_SECRET } from "./config";
import mongoose from "mongoose";
import { LoginTicket, OAuth2Client, TokenPayload } from "google-auth-library";
import jwt from "jsonwebtoken";

import { UserModel } from "./models/user";
import { ActiveSession } from "./models/activeSession";


export type GoogleLoginResponse = {
  success: boolean;
  msg?: string;
  token?: string;
  user?: UserResponse;
};

export type UserResponse = {
  id: string;
  name: string;
  email: string;
  profilePicUrl: string;
  accountType: string;
  createdAt: Date;
};


export class UsersHandler {
  constructor() {
    this.#connect();
  }

  /**
   * Private method used to connect to the DB.
   */
  #connect() {
    mongoose.connect(MONGO_DB_URI).then(() => {
      console.log("Connected to MongoDB");
    }).catch((err) => {
      console.log("MONGO_CONNECT_ERR:" + err);
    });
  }


  async googleLogin(googleToken: string): Promise<GoogleLoginResponse> {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    if (!googleToken) {
      return { success: false, msg: "There was an error. Please try again" };
    }
  
    let payload: TokenPayload | undefined;
    try {
      const ticket: LoginTicket = await client.verifyIdToken({
        idToken: googleToken,
        audience: process.env.CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch (error: any) {
      console.log(error);
      return { success: false, msg: "There was an error. Please try again" };
    }
    if (!payload) {
      return { success: false, msg: "There was an error. Please try again" };
    }
    const { name, email, picture } = payload;

    let user: any = await UserModel.findOne({ email: email });

    if (!user) {
      const createQuery = {
        name: name,
        email: email,
        profilePicUrl: picture || "",
        accountType: "google"
      };
      const newUser: any = await UserModel.create(createQuery);
      if (!newUser) {
        return { success: false, msg: "There was an error. Please try again" };
      }
      user = newUser;
    }

    const token = jwt.sign(user.toJSON(), TOKEN_SECRET, {
      expiresIn: 4492800 // 52 weeks
    });

    const query = { userId: user._id, token: token };
    const createRes = ActiveSession.create(query);

    if (!createRes) {
      return { success: false, msg: "There was an error. Please try again" };
    }

    const userResponse: UserResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      profilePicUrl: user.profilePicUrl,
      accountType: user.accountType,
      createdAt: user.createdAt
    };

    return { success: true, token: token, user: userResponse };
  }
}