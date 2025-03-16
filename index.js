const fs = require("fs").promises;
const path = require("path");
const config = require("./config");
const connect = require("./lib/connection");
const { getandRequirePlugins } = require("./assets/database/plugins");
const { File } = require("megajs");

global.__basedir = __dirname; // Set the base directory for the project

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    getContentType,
    fetchLatestBaileysVersion,
    Browsers
} = require('@whiskeysockets/baileys');

const P = require('pino');
const qrcode = require('qrcode-terminal');

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

// Initialize WhatsApp connection
async function connectToWA() {
    console.log("Connecting to WhatsApp...");
    const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/auth_info_baileys/');
    const { version } = await fetchLatestBaileysVersion();

    const conn = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        browser: Browsers.macOS("Firefox"),
        auth: state,
        version
    });

    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            if (lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut) {
                connectToWA();
            }
        } else if (connection === 'open') {
            console.log('Installing plugins...');
            readAndRequireFiles(path.join(__dirname, "/assets/plugins/"));
            getandRequirePlugins();
            console.log('✅ Plugins Installed!');
            console.log('*Connected to WhatsApp*');
        }
    });

    conn.ev.on('creds.update', saveCreds);
}

// Main initialization function
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

        console.log("⬇ Installing Plugins...");
        await readAndRequireFiles(path.join(__dirname, "/assets/plugins/"));
        await getandRequirePlugins();
        console.log("✅ Plugins Installed!");

        // Start WhatsApp bot connection
        connectToWA();

        return await connect();
    } catch (error) {
        console.error("Initialization error:", error);
        return process.exit(1);
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
