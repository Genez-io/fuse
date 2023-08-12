import { ActiveSession } from "../models/activeSession";
import { UserModel } from "../models/user";


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