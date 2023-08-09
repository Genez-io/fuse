import * as fs from "fs";
import * as path from "path";

// Vector Support
import { FaissStore } from "langchain/vectorstores/faiss";

import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

// The LangChain component we'll use to get the documents
import { RetrievalQAChain } from "langchain/chains";

// Text splitters
import { TextLoader } from "langchain/document_loaders";

import { OpenAI } from "langchain/llms/openai";



export class LlmService {

	async callGpt() {
		const openai_api_key = "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";
		const llm = new OpenAI({
			modelName: "gpt-4",
			openAIApiKey: openai_api_key,
			verbose: true
		});

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
						const loader = new TextLoader(path.join(dirpath, filename), {
							encoding: "utf-8"
						});
						docs.push(...await loader.load());
					} catch (e) {
						// Handle exceptions
					}
				};
			}
		}

		console.log(`You have ${docs.length} documents\n`);
		console.log("------ Start Document ------");

		// Get your text splitter ready
		const text_splitter = new RecursiveCharacterTextSplitter({
			chunkSize: 1000,
			chunkOverlap: 0
		});


		// Split your documents into texts
		const texts = await text_splitter.splitDocuments(docs);

		// Turn your texts into embeddings
		embeddings = new OpenAIEmbeddings({ openAIApiKey: openai_api_key });

		const docsearch = await FaissStore.fromDocuments(texts, embeddings);

		// // Get our retriever ready
		// const qa = RetrievalQAChain.from_chain_type({
		// 	llm,
		// 	chain_type: "stuff",
		// 	retriever: docsearch.asRetriever(),
		// 	verbose: true
		// });

		const qa = RetrievalQAChain.fromLLM(llm, docsearch.asRetriever(), 
			{
			verbose: true,
			chainType: "stuff"
		});
		

		const classInfo = "EmailService";
		const dbOrm = "mongoose";
		const functionsList = "addEmail, deleteEmail, sendEmail, sendEmailToList";

		const query = `Write me a backend class that implements a ${classInfo}. Use ${dbOrm} orm to connect to the database. Use any npmjs package you need. The class should have the following methods with implementation included: ${functionsList}. Show me only the source code. Do not include anything else.`;

		const res = await qa.call({
			query: query,
		});


		console.log({ res });
		return {res};
	}
}
