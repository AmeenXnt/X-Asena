const fs = require("fs").promises;
const path = require("path");
const config = require("./config");
const connect = require("./lib/connection");
const io = require("socket.io-client");
const { getandRequirePlugins } = require("./assets/database/plugins");
const { File } = require("megajs");

global.__basedir = __dirname; // Set the base directory for the project

const readAndRequireFiles = async (directory) => {
  try {
    const files = await fs.readdir(directory);
    return Promise.all(
      files
        .filter((file) => path.extname(file).toLowerCase() === ".js")
        .map((file) => require(path.join(directory, file)))
    );
  } catch (error) {
    console.error("Error reading and requiring files:", error);
    throw error;
  }
};

async function initialize() {
  console.log("X-Asena");
  try {
    if (config.SESSION_ID && !(await fs.stat("session").catch(() => false))) {
      console.log("Fetching session from Mega.nz...");
      await fs.mkdir("session", { recursive: true });

      const fileId = config.SESSION_ID.replace(/KeikoBot⚡|𝐂𝐫𝐨𝐧𝐞𝐱𝐁𝐨𝐭~/, "").trim();
      let file = File.fromURL(`https://mega.nz/file/${fileId}`);
      const sessionData = await new Promise((resolve, reject) => {
        file.download((err, data) => {
          if (err) return reject(err);
          resolve(data.toString());
        });
      });

      await fs.writeFile("./session/creds.json", sessionData);
      console.log("✅ Session credentials saved!");
    }

    await readAndRequireFiles(path.join(__dirname, "/assets/database/"));
    console.log("Syncing Database");

    await config.DATABASE.sync();

    console.log("⬇  Installing Plugins...");
    await readAndRequireFiles(path.join(__dirname, "/assets/plugins/"));
    await getandRequirePlugins();
    console.log("✅ Plugins Installed!");

    const ws = io("https://socket.xasena.me/", { reconnection: true });
    ws.on("connect", () => console.log("Connected to server"));
    ws.on("disconnect", () => console.log("Disconnected from server"));

    return await connect();
  } catch (error) {
    console.error("Initialization error:", error);
    return process.exit(1);
  }
}

initialize();
