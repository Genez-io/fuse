import * as dotenv from "dotenv";
dotenv.config();

import bodyParser from "body-parser";
import compression from "compression";
import http from "http";
import cors from "cors";
import winston from "winston";
import express from 'express';

import * as router from "./routes/deployment.js";

const deploymentRoute = router.default;

// Instantiate express
const app = express();
app.use(compression());

// logger
const consoleTransport = new winston.transports.Console();
const myWinstonOptions = {
  transports: [consoleTransport]
};
const logger = winston.createLogger(myWinstonOptions);

function logRequest(req: { url: any; }, _res: any, next: () => void) {
  logger.info(req.url);
  next();
}
app.use(logRequest);

function logError(err: any, _req: any, _res: any, next: () => void) {
  logger.error(err);
  next();
}
app.use(logError);

app.use(cors());

// Express body parser
app.use("/public", express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Initialize routes middleware
app.use("/api/v1/deploy", deploymentRoute);

app.get("/", (_req, res) => {
  res.send("Hello World");
});

const PORT = process.env.PORT;
// check if PORT is defined
if (!PORT) {
  throw new Error("PORT is not defined");
}

http.createServer(app).listen(PORT, function () {
  console.log(
    "App listening on port " + PORT + "! Go to http://localhost:" + PORT + "/"
  );
});


app.enable("trust proxy");
