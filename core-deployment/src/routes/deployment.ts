import express from "express";
import Exec from "await-exec-typescript";
import fs from "fs";
import path from "path";
import os from "os";
import { LlmService } from "./../LlmService.js";
import { tsconfigStr } from "./../utils/tsconfig.js";
import { generateGenezioYaml } from "./../utils/genezioYaml.js";
import { getUsedNodeModules } from "./../utils/getNodeModules.js";

const router = express.Router();

const exec = Exec.default;





router.post("/", async (req, res) => {
  const { classInfo, functionsList, genezioToken } = req.body;
  // const { genezioToken, classCode, className } = req.body;

  // if (!genezioToken || !classCode || !className) {
  //   return res.status(400).json({
  //     message: "Missing required parameters",
  //   });
  // }

  // const genezioToken = "9e4eda8cc8540b48b18765b012495bd8a46730ef40b97c6725e9376e94fc19bdd93b8d0a09da143d92003d81b19a517dd3e7debbf1a135b5d0d785f12c12cc08";
  const folderName = `genezio-${Math.random().toString(36).substring(7)}`;
  const folderPath = path.join(os.tmpdir(), folderName);

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }

  let link;
  let sdkFiles;

  for (let i = 0; i < 4; i++) {
    const {classCode, className} = await LlmService.callGpt(classInfo, functionsList);
    // write the class code in the folder
    fs.writeFileSync(path.join(folderPath, className + ".ts"), classCode);

    // write to folder genezio.yaml and tsconfig.json
    fs.writeFileSync(path.join(folderPath, "genezio.yaml"), generateGenezioYaml(folderName, className));
    fs.writeFileSync(path.join(folderPath, "tsconfig.json"), tsconfigStr);

    // get all node modules used in the class
    const nodeModules = getUsedNodeModules(path.join(folderPath, className + ".ts"));

    // run npm i for each node module
    const { stdout, stderr } = await exec(
      `npm i ${nodeModules.join(" ")}`,
      {
        cwd: folderPath,
        log: false
      }
    );
    console.log("npm i stdout", stdout);
    console.log("npm i stderr", stderr);

    const devNodeModules = nodeModules.map((nodeModule) => {
      return `@types/${nodeModule}`;
    });

    // npm i all dev dependencies as well (for typescript)
    await Promise.all([
      exec(`npm i -D ${devNodeModules.join(" ")}`, {
        cwd: folderPath,
        log: false
      }),
      exec(`npm i -D @types/node`, {
        cwd: folderPath,
        log: false
      }),
    ]).catch((err) => {
      console.log("npm i -D err", err);
    });


    const output = await exec(`genezio deploy --install-deps`, {
      cwd: folderPath,
      log: false
    }).catch((err: any) => {
      console.log("genezio deploy err", err);
      return err;
    });

    console.log(output);


    if (!output.stdout?.includes("Your backend project has been deployed")) {
      console.log("CONTINUE WITH NEXT ITERATION");
      continue;
    }


    // get the link from the output between 'available at ' and '\n'
    link = output.stdout.split("available at ")[1].split("\n")[0];

    // read all files from the folderPath + sdk and add them to an array
    const filesSdk = fs.readdirSync(path.join(folderPath, "sdk"));

    // for each file, read the file and add it to the output
    sdkFiles = filesSdk.map((file) => {
      const fileContent = fs.readFileSync(path.join(folderPath, "sdk", file));
      return {content: fileContent.toString()
        , name: file};
    });
    return res.json({
      link,
      sdkFiles
    });
  }

  return res.status(400).json({
    message: "Error generating and deploying the project. This is just a proof of concept, so it might not work all the time.",
  });


  

  
});


export default router;