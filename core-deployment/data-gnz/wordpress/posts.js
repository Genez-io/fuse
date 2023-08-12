import { mongoose } from "mongoose"
import { wp_posts } from "../models/wp_posts"
import { MONGO_DB_URI, reqAuth} from "../config/helper"

/**
 * req: {token: "token", body: {}}
 * res: {success: true, msg: "success"} / { success: false, msg: "User is not logged on" }
 */

export class PostsController {
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

    async createPost(req) {
        console.log("Create a post...")

        if(!req.body || !req.body.post_title || !req.body.post_author || !req.body.post_content || !req.body.post_excerpt || !req.body.post_tags) {
            return { success: false, msg: "Missing required fields" };
        }

        if(!req.token) {
            return { success: false, msg: "Error: Not Authorized, token is missing" };
        }

        const authObject = await reqAuth(req.token);
        if (!authObject.success) {
          return authObject;
        }

        const post = await wp_posts.findOne({"post_title": req.body.post_title, "post_author": req.body.post_author});
        console.log(post)
        if (post) {
            return { success: false, msg: "Post already exists" };
        } else {
            await wp_posts.create({
                post_author: req.body.post_author,
                post_title: req.body.post_title,
                post_content: req.body.post_content,
                post_excerpt: req.body.post_excerpt,
                post_tags: req.body.post_tags,
            })
            return { success: true, msg: "success" };
        }
    }

    async updatePost(req) {
        console.log("Update a post...")

        console.log("UpdatePost not implemented yet...")
    }

    async getAPost(req) {
        console.log("Get a post...")

        if(!req.body || !req.body.post_title || !req.body.post_author) {
            return { success: false, msg: "Missing required fields" };
        }

        const post = await wp_posts.findOne({"post_title": req.body.post_title});

        if (!post) {
            return { success: false, msg: "Post does not exist" };
        } else {
            return { success: true, msg: "success", data: post };
        }
    }

    async getAllPosts() {
        console.log("Get all posts...")

        const posts = await wp_posts.find();

        if (posts.length == 0) {
            return { success: false, msg: "There is no post to be fetched" };
        } else {
            return {success: true, msg: "success", data: posts};
        }
    }
}
