# FUSE - Full Stack Software Engine

<div align="center">
<h2>AI-driven platform that generates working web applications</h2>
<h3> <u><a href="https://fuse.app.genez.io"> FUSE Demo - Try it out yourself! </a></u> </h3>
</div>

<div align="center">

[![build](https://github.com/genez-io/fuse/actions/workflows/deploy-to-ec2.yml/badge.svg)](https://github.com/Genez-io/fuse/actions/workflows/deploy-to-ec2.yml)

</div>

FUSE is an AI-driven platform that generates out-of-the-box, live web applications from a simple description of the desired functionality. The platform is designed to help developers write and deploy code faster by describing the application in natural language.

Using LanceDB OSS, `langchain` and OpenAI API, the platform generates a working web application.
Further, the web application is is deployed using a single command to the cloud with `genezio`.

## FUSE Demo - Try it out

FUSE is live and deploy to the cloud. You can try it out [here](https://fuse.genez.io).

## Technology Stack

FUSE is built using TypeScript and React.
### LanceDB OSS

[LanceDB](https://lancedb.com) is a lightweight, vector database focused on handling LLM embeddings.
The great advantage of LanceDB is that it can enhance the LLM experience with custom data from the user.

### LangChain
[Langchain](https://python.langchain.com/docs/get_started/introduction.html#use-cases) is a framework for developing applications powered by language models.

### Genezio

[genezio](https://github.com/Genez-io/genezio) is a platform for developers that help them write and deploy serverless applications.

The developers are writing their backend logic in classes and deploy them to genezio serverless infrastructure. An SDK is auto-generated for them to be imported in the frontend part of the application. The SDK is used to call the backend logic in a very natural way.

With a single command `genezio deploy` both the backend and the frontend are deployed to the cloud making the application available for all the end-users.


### OpenAI API

The [OpenAI API](https://platform.openai.com/docs/introduction) can be used to programmatically interact with the GPT LLMs. FUSE uses the GPT-4 model because it yields the best results.
