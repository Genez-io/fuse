
<div align="center">

<h1> FUSE - Full Stack Software Engine </h1>
<h2>AI-driven platform that generates working web applications</h2>
<h3> <u><a href="https://fuse.app.genez.io"> FUSE Demo - Try it out yourself! </a></u> </h3>
</div>

<div align="center">

[![build](https://github.com/genez-io/fuse/actions/workflows/deploy-to-ec2.yml/badge.svg)](https://github.com/Genez-io/fuse/actions/workflows/deploy-to-ec2.yml)

</div>

FUSE is an AI-driven platform that generates out-of-the-box, live web applications from a simple description of the desired functionality. The platform is designed to help developers write and deploy code faster by describing the application in natural language.

Using LanceDB OSS, `langchain` and OpenAI API, the platform generates a working web application.
Further, the web application is is deployed using a single command to the cloud with `genezio`.

## FUSE Demo - Walkthrough

Head over to https://fuse.genez.io and go through the following steps:

1. Provide a detailed description of the backend class you wish to generate and deploy.
2. Add the names of the methods that the class should have.
3. Add a genezio token to the form to deploy your application using genezio.

![Complete FUSE form to generate your application](https://github.com/Genez-io/fuse/blob/main/images/screenshot_request.png)

You are now ready to hit the generate button and wait for the application to be implemented for you.

![FUSE is generating your application](https://github.com/Genez-io/fuse/blob/main/images/screenshot_generating.png)

Lastly, you can test the backend code using the genezio dashboard and you can also download the source code to your local machine.

![Your backend class was deployed successfully](https://github.com/Genez-io/fuse/blob/main/images/screehshot_code.png)

## Technology Stack

FUSE is built using TypeScript and React.

Under the hood, FUSE uses LanceDB, Langchain and OpenAI API to generate backend code suitable to be deployed on function-as-a-service platforms.

The generated code is deployed using genezio because it is easy and doesn't require a complex configuration. It's a single command to deploy the code to the cloud.

More than that genezio generates an SDK that can be used by the client/frontend to call the deployed code. This simplifies the development process of the web application even more.

For the first version of this project, FUSE is able to generate only code written in TypeScript. In the future, we plan to add support for other languages as well.

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
