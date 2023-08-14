import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RetrievalQAChain } from "langchain/chains";
import { OpenAI } from "langchain/llms/openai";

import { connect } from "vectordb";
import { LanceDB } from "langchain/vectorstores/lancedb";

import dotenv from "dotenv";
dotenv.config();

export class LlmService {
	static async callGpt(classInfo: string, functionsList: string[]) {
		const openai_api_key = process.env.OPENAI_API_KEY;
		// check if openai api key is set
		if (!openai_api_key) {
			throw new Error("You need to provide an OpenAI API key. Go to https://platform.openai.com/account/api-keys to get one.");
		}

		const llm = new OpenAI({
			modelName: "gpt-4",
			openAIApiKey: openai_api_key,
			verbose: true
		});

		const db = await connect("vectordb");
		const table = await db.openTable("vectors");

		let embeddings = new OpenAIEmbeddings({ openAIApiKey: openai_api_key });

		//table to base retrievar
		const vectorStore = await LanceDB.fromDocuments(
			[],
			embeddings,
			{ table }
		);

		const retriever = vectorStore.asRetriever();

		const qa = RetrievalQAChain.fromLLM(llm, retriever);

		const dbOrm = "mongoose";
		const functionsListStr = functionsList.join(", ");

		const query = `Write me an backend class in typescript that implements a ${classInfo}. Start the class with 'export class <class_name> {. Use only types, without interfaces. Use ${dbOrm} orm to connect to the database and connect in a classic way with 'mongoose.connect("mongodb+srv://genezio:genezio@cluster0.c6qmwnq.mongodb.net/?retryWrites=true&w=majority")' and create classic models. Use any npmjs package you need, without any external file. The class should have the following methods with implementation included: ${functionsListStr}. Use DTOS for the output of the functions. Show me only the source code. Do not include anything else.`;

		const res = await qa.call({
			query: query,
		});

		// get the source code between ``` and ``` and remove the first line if it doesn't start with import
		let sourceCode = res.text.split("```")[1];
		const firstLine = sourceCode.split("\n")[0];
		if (!firstLine.startsWith("import")) {
			sourceCode = sourceCode.split("\n").slice(1).join("\n");
		}
		// get className from export class <class_name>
		const className = sourceCode.split("export class ")[1].split(" ")[0];


		console.log({ sourceCode, className });
		return {
			classCode: sourceCode,
			className: className,
		};
	}
}
