/**
* This is an auto generated code. This code should not be modified since the file can be overwriten
* if new genezio commands are executed.
*/

import { Remote } from "./remote";


export class LlmService {
  static remote = new Remote("http://127.0.0.1:8083/LlmService");

  static async callGpt(): Promise<any> {
    return await LlmService.remote.call("LlmService.callGpt");
  }
}

export { Remote };
