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
		const mongoose_URI = `mongoose.connect("mongodb+srv://genezio:genezio@cluster0.c6qmwnq.mongodb.net/?retryWrites=true&w=majority")`

		const query = `
Your task is to write a ${classInfo} class in TypeScript that implements the following functions: ${functionsListStr} by following the next steps:

1. Write a TypeScript backend class that implements a ${classInfo}. Begin the class declaration by using the following line: \`export class <class_name>\`.

2. Within the class, ensure that you utilize type annotations for every variable and parameter. This helps maintain strong typing throughout your implementation.

3. Utilize the ${dbOrm} ORM to establish a connection to a database. Connect to the database as follows: \`${mongoose_URI}\`.

4. Use any necessary npmjs packages for your implementation. Feel free to leverage these packages as needed to enhance the functionality of your class. However, refrain from relying on any external files.

5. Your class should include specific methods such as ${functionsListStr}. Ensure that you provide the implementation for each of these methods. For the return values of these methods, utilize DTOs (Data Transfer Objects) to organize and structure the output.

6. When presenting your source code, make sure to format it within triple backticks \`\`\`. This formatting helps maintain clarity and readability. Include only the source code itself within the triple backticks, without adding any additional text.
`;

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
