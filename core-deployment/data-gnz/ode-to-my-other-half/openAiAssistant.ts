import { Configuration, OpenAIApi } from "openai";
import dotenv from "dotenv";

export class OpenAIAssistant {
  openai: OpenAIApi;

  constructor() {
    dotenv.config();
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_SECRET_KEY
    });
    const openai = new OpenAIApi(configuration);
    this.openai = openai;
  }

  async askChatGPT(requestText: string) {
    const completion = await this.openai.createCompletion({
      model: "text-davinci-003",
      prompt: requestText,
      "temperature": 0.8,
      max_tokens: 2048
    });
    console.log(
      `DEBUG: request: ${requestText}, response: ${completion.data.choices[0]
        .text}`
    );
    return completion.data.choices[0].text;
  }
}
