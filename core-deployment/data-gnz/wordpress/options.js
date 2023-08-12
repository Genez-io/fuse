import { mongoose } from "mongoose"
import { reqAuthAdmin, reqAuth, MONGO_DB_URI } from "./../config/helper"
import { wp_options } from "../models/wp_options"

/**
 * req: {token: "token", body: {}}
 * res: {success: true, msg: "success"} / { success: false, msg: "User is not logged on" }
 */

export class OptionsController {
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

  // get all options from the database
  async getOptions(req) {
    const authObject = await reqAuth(req.token);
    if (!authObject.success) {
      return authObject;
    }

    return { success: true, msg: "success", data: await wp_options.find() };
  }

  // get a single option from the database
  async getOption(req) {
    const authObject = await reqAuth(req.token);
    if (!authObject.success) {
      return authObject;
    }

    return { success: true, msg: "success", data: await wp_options.find({ option_name: req.body.option_name }) };
  }

  // update a single option in the database
  async updateOption(req) {
    const authObject = await reqAuthAdmin(req.token);
    if (!authObject.success) {
      return authObject;
    }

    await wp_options.updateOne({ option_name: req.body.option_name }, { option_value: req.body.option_value });
    return { success: true, msg: "success" };
  }

  // delete a single option from the database
  async deleteOption(req) {
    const authObject = await reqAuthAdmin(req.token);
    if (!authObject.success) {
      return authObject;
    }

    await wp_options.deleteOne({ option_name: req.body.option_name });
    return { success: true, msg: "success" };
  }

  // create a single option in the database
  async createOption(req) {
    const authObject = await reqAuthAdmin(req.token);
    if (!authObject.success) {
      return authObject;
    }

    // check if option already exists
    const optionExists = await wp_options.find({ option_name: req.body.option_name });
    if (optionExists.length > 0) {
      return { success: false, msg: "Option already exists" };
    }

    // create new option
    const newOption = await wp_options.create({
      option_name: req.body.option_name,
      option_value: req.body.option_value,
    });

    // check if option was created
    if (!newOption) {
      return { success: false, msg: "Option could not be created" };
    }

    return { success: true, msg: "success" };
  }
}
