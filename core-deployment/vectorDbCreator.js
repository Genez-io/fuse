import * as fs from "fs";
import * as path from "path";

import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { TextLoader } from "langchain/document_loaders/fs/text";

import { connect } from "vectordb";
import { LanceDB } from "langchain/vectorstores/lancedb";

import dotenv from "dotenv";
dotenv.config();

async function createdTestDb() {
  const openai_api_key = process.env.OPENAI_API_KEY;

  // check if openai api key is set
  if (!openai_api_key) {
    throw new Error("You need to provide an OpenAI API key. Go to https://platform.openai.com/account/api-keys to get one.");
  }

  try {
    fs.mkdirSync("vectordb");
  } catch (e) {
    // Handle exceptions
  }

  const db = await connect("vectordb");

  let embeddings = new OpenAIEmbeddings({ openAIApiKey: openai_api_key });

  const root_dir = "data-gnz";
  const docs = [];

  // Go through each folder
  const elems = fs.readdirSync(root_dir, { withFileTypes: true });

  for (const dirent of elems) {
    if (dirent.isDirectory()) {
      const dirpath = path.join(root_dir, dirent.name);
      const files = fs.readdirSync(dirpath);
      for (const filename of files) {
        try {
          // Load up the file as a doc and split
          const loader = new TextLoader(path.join(dirpath, filename));
          docs.push(...await loader.load());
        } catch (e) {
          // Handle exceptions
          console.log(e);
        }
      };
    }
  }

  console.log(`You have ${docs.length} documents\n`);

  const table = await db.createTable("vectors", [
    { vector: Array(1536), text: "sample", source: "a" },
  ]);

  const vectorStore = await LanceDB.fromDocuments(
    docs,
    embeddings,
    { table }
  );

  return vectorStore;
}

(async () => {
  console.log("Creating LanceDB vector table..");
  const db = await createdTestDb();
  console.log("Successfully created LanceDB vector table.");
})();
