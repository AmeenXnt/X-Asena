const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const config = require("./config");
const { getandRequirePlugins } = require("./assets/database/plugins");
const { File } = require("megajs");
const P = require("pino");

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    Browsers
} = require("@whiskeysockets/baileys");

global.__basedir = __dirname; 

const readAndRequireFiles = async (directory) => {
    try {
        const files = await fsPromises.readdir(directory);
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
const fetchSessionFromMega = async (sessionPath) => {
    if (!config.SESSION_ID) {
        console.log("SESSION_ID is missing. Proceeding with QR login.");
        return false;
    }

    console.log("Session Id Scaning...!");
    await fsPromises.mkdir(path.dirname(sessionPath), { recursive: true });

    try {
        const fileId = config.SESSION_ID.replace(/KeikoBot⚡|𝐂𝐫𝐨𝐧𝐞𝐱𝐁𝐨𝐭~/, "").trim();
        let file = File.fromURL(`https://mega.nz/file/${fileId}`);
        const sessionData = await new Promise((resolve, reject) => {
            file.download((err, data) => {
                if (err) return reject(err);
                resolve(data.toString());
            });
        });

        await fsPromises.writeFile(sessionPath, sessionData);
        console.log("✅ Session saved!");
        return true;
    } catch (error) {
        console.error("❌ Failed to download", error);
        return false;
    }
};
const express = require("express");
const app = express();
const port = process.env.PORT || 8000;
async function connectToWA() {
    console.log("Connecting to WhatsApp...");

    const authFolder = path.join(__dirname, "/auth_info_baileys/");
    const sessionFile = path.join(authFolder, "creds.json");

    let sessionExists = fs.existsSync(sessionFile);

    if (!sessionExists) {
        sessionExists = await fetchSessionFromMega(sessionFile);
    }

    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version } = await fetchLatestBaileysVersion();

    const conn = makeWASocket({
        logger: P({ level: "silent" }),
        printQRInTerminal: !sessionExists,
        browser: Browsers.macOS("Firefox"),
        auth: state,
        version
    });

    conn.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log("Reconnecting...");
                connectToWA();
            } else {
                console.log("Logged out. Scan the QR code to log in again.");
            }
        } else if (connection === "open") {
            console.log("Installing plugins...");
            readAndRequireFiles(path.join(__dirname, "/assets/plugins/"));
            getandRequirePlugins();
            console.log("✅ Plugins Installed!");
            console.log("*Connected to WhatsApp*");
            getandRequirePlugins(conn);
            conn.sendMessage(conn.user.id, { text: `Connected` });
        }
    });

    conn.ev.on("creds.update", saveCreds);
}
async function initialize() {
    console.log("KEIKO XD Initializing...💫");

    try {
        await readAndRequireFiles(path.join(__dirname, "/assets/database/"));
        console.log("Syncing Database...");
        await config.DATABASE.sync();

        console.log("⬇ Installing Plugins...");
        await readAndRequireFiles(path.join(__dirname, "/assets/plugins/"));
        await getandRequirePlugins();
        console.log("✅ Plugins Installed!");
        
        app.get("/", (req, res) => {
    res.send("KEIKO XD🧚🏻");
});
app.listen(port, () => console.log(`Server listening on port http://localhost:${port}`));
setTimeout(() => {
    connectToWA();
}, 4000);
    } catch (error) {
        console.error("Initialization error:", error);
        process.exit(1);
    }
}

initialize();
/*const fs = require("fs").promises;
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

      var fileId = config.SESSION_ID.replace(/KeikoBot⚡|𝐂𝐫𝐨𝐧𝐞𝐱𝐁𝐨𝐭~/, "").trim();
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

initialize();*/
