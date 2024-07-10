import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); // load the config.env file first
console.clear();
import { DataSource } from "typeorm";

import { connect } from "./src/db/data-source";

import app from "./app";
import { IncomingMessage, Server, ServerResponse } from "http";

process.on("uncaughtException", (err: Error) => {
  console.log("UNCAUGHT EXCEPTION! Shutting Down...");
  console.log(err.name, err.message);
  process.exit(1);
});

/* 
###############################################
#### Create NoSQL/Mongoose Connection Here ####
###############################################
*/

/* 
  ####################################
  #### Create SQL Connection Here ####
  ####################################
*/
async function createConnection() {
  try {
    const dataSource: DataSource = await connect;
    console.log(dataSource.isInitialized ? "[+] Connection Established" : "[-] Connection Failure");

    global.dataSource = dataSource;
  } catch (err) {
    console.log(err);
  }
}

/* 
  ##########################
  #### Start the Server ####
  ##########################
*/
let server: Server<typeof IncomingMessage, typeof ServerResponse>;
createConnection().then(() => {
  const port = process.env.PORT || 8000;
  server = app.listen(port, () => {
    console.log("Server started on port: " + port);
  });
});

process.on("unhandledRejection", (err: Error) => {
  console.log("UNHANDLED REJECTION! Shutting Down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
