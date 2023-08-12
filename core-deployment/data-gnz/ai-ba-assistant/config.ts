import dotenv from "dotenv";
dotenv.config();

export const MONGO_DB_URI: string = process.env.MONGO_DB_URI || '';
export const TOKEN_SECRET: string = process.env.TOKEN_SECRET || '';
export const GOOGLE_CLIENT_ID: string = process.env.GOOGLE_CLIENT_ID || '';