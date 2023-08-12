import { mongoose } from "mongoose"
import jwt from "jsonwebtoken"
import { wp_users } from "../models/wp_users"
import { ActiveSession } from "../models/activeSession"
import { MONGO_DB_URI, validatePassword, saltPassword , reqAuthAdmin, reqAuth} from "../config/helper"

/**
 * req: {token: "token", body: {}}
 * res: {success: true, msg: "success"} / { success: false, msg: "User is not logged on" }
 */

export class UsersController {
  constructor() {
    this.#connect();
  }

  /**
   * Private method used to connect to the DB.
   */
  #connect() {
    mongoose.set('strictQuery', true);
    mongoose.connect(MONGO_DB_URI);
  }

  async register(req) {
    if (!req.body.email || !req.body.password || !req.body.nicename) {
      return { success: false, msg: "Error: missing required parameters" }
    }

    console.log(`Registering user with email ${req.body.email}...`)

    const user = await wp_users.find()

    if (user.length == 0 ) {
      return await this.registerAdmin(req.body.email, req.body.password, req.body.nicename)
    } else if (user.length > 0) {
      if (!req.token) {
        return { success: false, msg: "Error: Not Authorized, token is missing" }
      }

      const authObject = await reqAuthAdmin(req.token);
      if (!authObject.success) {
        return authObject;
      }

      if (!req.body.type) {
        return { success: false, msg: "Error: Invalid user data" }
      }

      if (req.body.type === "admin") {
        return await this.registerAdmin(req.body.email, req.body.password, req.body.nicename)
      } else if (req.body.type === "editor") {
        return await this.registerEditor(req.body.email, req.body.password, req.body.nicename)
      } else {
        return { success: false, msg: "Error: Invalid user type. We support admin or editor" }
      }
    }
  }

  async registerAdmin(email, password, nicename) {
    console.log(`Registering admin with name ${nicename} and email ${email}...`)

    const user = await wp_users.findOne({ user_email: email });
    if (user) {
      return { success: false, msg: "Error: User already exists" }
    } else {
      const saltedPassword = await saltPassword(password)
      await wp_users.create({
        user_email: email,
        user_nicename: nicename,
        user_pass: saltedPassword,
        user_type: "admin",
      });

      return { success: true, msg: "success" };
    }
  }

  async registerEditor(email, password, nicename) {
    console.log(`Registering user with name ${nicename} and email ${email}...`)

    const user = await wp_users.findOne({ user_email: email });
    if (user) {
      return { success: false, msg: "User already exists" }
    } else {
      const saltedPassword = await saltPassword(password)
      await wp_users.create({
        user_email: email,
        user_nicename: nicename,
        user_pass: saltedPassword,
        user_type: "editor",
      });

      return { success: true, msg: "success" };
    }
  }

  async getAllUsers(req) {
    console.log("Get all users...")

    if (!req.token) {
      return { success: false, msg: "Error: Not Authorized, token is missing" }
    }

    const authObject = await reqAuth(req.token);
    if (!authObject.success) {
      return authObject;
    }

    return {success: true, msg: "success", data: await wp_users.find()}
  }

  async updateUser(req) {
    if (!req.body.email) {
      return { success: false, msg: "Error: No email provided" }
    }

    console.log(`Update user with email ${email}...`)

    if (!req.token) {
      return { success: false, msg: "Error: Not Authorized, token is missing" }
    }

    const authObject = await reqAuthAdmin(req.token);
    if (!authObject.success) {
      return authObject;
    }

    if (req.body.nicename) {
      await wp_users.updateOne({ user_email: req.body.email }, { user_nicename: req.body.nicename})
    }
    if (req.body.password) {
      await wp_users.updateOne({ user_email: req.body.email }, { user_pass: req.body.password})
    }
    if (req.body.type) {
      await wp_users.updateOne({ user_email: req.body.email }, { user_type: req.body.type})
    }
  }

  async deleteUser(req) {
    if(!req.body.email) {
      return { success: false, msg: "Error: No email provided" }
    }

    console.log(`Delete user with email ${req.body.email}...`)

    const authObject = await reqAuthAdmin(req.token);
    if (!authObject.success) {
      return authObject;
    }

    await wp_users.deleteOne({ user_email: req.body.email })

    return { success: true, msg: "success" }
  }

  async logout(req) {
    console.log("Logout request received...")
    const authObject = await reqAuth(req.token);
    if (!authObject.success) {
      return authObject;
    }

    console.log("Logout not implemented yet...")
  }


  async login(req) {
    if (!req.body.email || !req.body.password) {
      return { success: false, msg: "Error: Missing parameters" }
    }

    console.log(`Password: ${req.body.password}`, `Email ${req.body.email}`)

    const user = await wp_users.findOne({ user_email: req.body.email });

    if (!user) {
      return { success: false, msg: "User not found" };
    }

    const isValid = await validatePassword(req.body.password, user.user_pass)

    if (isValid) {
      user.user_pass = null;
      const token = jwt.sign(user.toJSON(), "secret", {
        expiresIn: 86400 // 1 week
      });

      await ActiveSession.create({ token: token, userId: user._id });
      return { success: true, user: user, token: token }
    } else {
      return { success: false, msg: "Incorrect user or password" }
    }

  }

  async checkSession(req) {
    console.log("Check session request received...")

    if (!req.token) {
      return { success: false, msg: "Error: Not Authorized, token is missing" }
    }

    const authObject = await reqAuth(req.token);
    if (!authObject.success) {
      return authObject;
    }

    const token = req.token

    const activeSession = await ActiveSession.findOne({ token: token });
    if (!activeSession) {
      return { success: false };
    }

    console.log(activeSession.userId)

    const user = await wp_users.findById(activeSession.userId);
    if (!user) {
      return { success: false };
    }

    return { success: true, msg: "success" };
  }
}
