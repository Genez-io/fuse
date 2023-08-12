import bcrypt from "bcryptjs"
import { ActiveSession } from "./../models/activeSession";
import { wp_users } from "./../models/wp_users";

export const MONGO_DB_URI = process.env.MONGO_DB_URI;

export async function reqAuth(token) {
  const session = await ActiveSession.find({ token: token });
  if (session.length == 1) {
    return { success: true, session: session[0] };
  } else {
    return { success: false, msg: "User is not logged on" };
  }
}

export async function reqAuthAdmin(token) {
  const session = await ActiveSession.find({ token: token });
  console.log("Session length ", session.length)
  if (session.length < 1) {
    return { success: false, msg: "User is not logged on" };
  }

  const user = await wp_users.find({ _id: session[0].userId });

  if (user.length != 1) {
    return { success: false, msg: "User is not logged on" };
  }

  if (user[0].user_type != "admin") {
    return { success: false, msg: "User is not logged on" };
  }

  return { success: true, session: session[0] };
}

export async function validatePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

export async function saltPassword(password) {
  const salt = await bcrypt.genSalt(10);
  const saltedPassword = await bcrypt.hash(password, salt);
  return saltedPassword;
}
