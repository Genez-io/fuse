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

  if (!classInfo || !functionsList ) {
    return res.status(400).json({
      message: "Missing required parameters",
    });
  }

  if (!genezioToken) {
    console.log("Warning: no genezio token provided. We will use the default token for this demo.");
  }

  const folderName = `genezio-${Math.random().toString(36).substring(7)}`;
  const folderPath = path.join(os.tmpdir(), folderName);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }

  console.log("Folder path:", folderPath);

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
      }).catch((err) => {
        console.log("npm i -D err", err);
      }),
      exec(`npm i -D @types/node`, {
        cwd: folderPath,
        log: false
      }).catch((err) => {
        console.log("npm i -D err", err);
      })
    ]).catch((err) => {
      console.log("npm i -D err", err);
    });


    const output = await exec(`GENEZIO_TOKEN=${genezioToken} genezio deploy --install-deps`, {
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

    const projectFiles: {content: string, name: string}[] = fs.readdirSync(folderPath).filter((file) => {
      // check if the file is not a folder
      if (fs.lstatSync(path.join(folderPath, file)).isDirectory()) {
        return false;
      }
      return true;
    }).map((file) => {
      const fileContent = fs.readFileSync(path.join(folderPath, file));
      return {content: fileContent.toString()
        , name: file};
    });

    return res.json({
      link,
      sdkFiles,
      projectFiles
    });
  }

  return res.status(400).json({
    message: "Error generating and deploying the project. This is just a proof of concept, so it might not work all the time.",
  });
});

export default router;
