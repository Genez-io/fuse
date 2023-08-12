import { mongoose } from "mongoose"
import { reqAuth, MONGO_DB_URI } from "./../config/helper"
import { wp_options, reqAuthAdmin } from "../models/wp_options"

/**
 * req: {token: "token", body: {}}
 * res: {success: true, msg: "success"} / { success: false, msg: "User is not logged on" }
 */

export class TagsController {
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

  // get all tags from the database
  async getTags(req) {
    const authObject = await reqAuth(req.token);
    if (!authObject.success) {
      return authObject;
    }

    return { success: true, msg: "success", data: await wp_tags.find() };
  }

  // get a single tag from the database
  async getTag(req) {
    const authObject = await reqAuth(req.token);
    if (!authObject.success) {
      return authObject;
    }

    return { success: true, msg: "success", data: await wp_tags.find({ _id: req.body.id }) };
  }

  // update a single tag in the database
  async updateTag(req) {
    const authObject = await reqAuth(req.token);
    if (!authObject.success) {
      return authObject;
    }

    await wp_tags.updateOne({ _id: req.body.id }, { tag_value: req.body.tag_value });
    return { success: true, msg: "success" };
  }

  // delete a single tag from the database
  async deleteTag(req) {
    const authObject = await reqAuth(req.token);
    if (!authObject.success) {
      return authObject;
    }

    await wp_options.deleteOne({ _id: req.body.id });
    return { success: true, msg: "success" };
  }

  // create a single tag in the database
  async createTag(req) {
    const authObject = await reqAuth(req.token);
    if (!authObject.success) {
      return authObject;
    }

    const newTag = await wp_tags.create({
      tag_value: req.body.tag_value,
    });

    // check if the tag was created
    if (!newTag) {
      return { success: false, msg: "Tag was not created" };
    }

    return { success: true, msg: "success" };
  }
}
