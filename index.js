const fs = require("fs").promises;
const path = require("path");
const config = require("./config");
const { getandRequirePlugins } = require("./assets/database/plugins");
const plugins = require("./lib/plugins");
const { File } = require("megajs");
const P = require("pino");
const express = require("express");

const { serialize, Greetings } = require("./lib/index");
const { loadMessage, saveMessage, saveChat, getName } = require("./assets/database/StoreDb");
const { PausedChats } = require("./assets/database");
const { Image, Message, Sticker, Video, AllMessage } = require("./lib/Messages");

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require("@whiskeysockets/baileys");

global.__basedir = __dirname;
const app = express();
const port = process.env.PORT || 8000;

async function fetchSessionFromMega(sessionPath) {
  if (!config.SESSION_ID) return console.log("SESSION_ID missing. QR login required."), false;
  await fs.mkdir(path.dirname(sessionPath), { recursive: true });
  try {
    let file = File.fromURL(`https://mega.nz/file/${config.SESSION_ID.replace(/KeikoBot⚡|𝐂𝐫𝐨𝐧𝐞𝐱𝐁𝐨𝐭~/, "").trim()}`);
    let sessionData = await new Promise((res, rej) => 
        file.download((err, data) => 
            err ? rej(err) : res(data.toString())));
    await fs.writeFile(sessionPath, sessionData);
    return console.log("✅ Session saved!"), true;
  } catch (error) {
    return console.error("❌ Failed to download:", error), false;
  }
}

async function connectToWA() {
  console.log("Connecting to WhatsApp...");
  const authFolder = path.join(__dirname, "/auth_info_baileys/");
  const sessionFile = path.join(authFolder, "creds.json");

  let sessionExists = await fs.stat(sessionFile).catch(() => false) || await fetchSessionFromMega(sessionFile);
  
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);
  const { version } = await fetchLatestBaileysVersion();
  const conn = makeWASocket({
    logger: P({ level: "silent" }),
    printQRInTerminal: !sessionExists,
    browser: Browsers.macOS("Firefox"),
    auth: state,
    version
  });

  conn.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "close") 
      return lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut 
        ? (console.log("Reconnecting..."), connectToWA()) 
        : console.log("Logged out. Scan QR to log in.");
    
    if (connection === "open") {
      getandRequirePlugins(conn);
      conn.sendMessage(conn.user.id, { text: `Connected` });
      console.log("*Connected to WhatsApp*");
    }
  });

  conn.ev.on("creds.update", saveCreds);
  conn.ev.on("messages.upsert", handleMessages.bind(null, conn));
  process.on("unhandledRejection", err => handleError(err, conn, "unhandledRejection"));
  process.on("uncaughtException", err => handleError(err, conn, "uncaughtException"));

  return conn;
}

async function handleMessages(conn, { type, messages }) {
  if (type !== "notify") return;
  const msg = await serialize(messages[0], conn);
  await saveMessage(messages[0], msg.sender);
  if (config.AUTO_READ) await conn.readMessages(msg.key);
  if (config.AUTO_STATUS_READ && msg.from === "status@broadcast") await conn.readMessages(msg.key);
  processMessage(msg, conn);
}

async function processMessage(msg, conn) {
  if (!msg?.body) return;
  const chatId = msg.from;
  if ((await PausedChats.getPausedChats()).some(chat => chat.chatId === chatId && !new RegExp(`${config.HANDLERS}( ?resume)`, "is").test(msg.body))) return;
  if (config.LOGS) logMessage(msg, conn);
  executeCommand(msg, conn);
}

async function logMessage(msg, conn) {
  console.log(`At: ${msg.from.endsWith("@g.us") ? (await conn.groupMetadata(msg.from)).subject : msg.from}\nFrom: ${await getName(msg.sender)}\nMessage: ${msg.body || msg}`);
}

/*function executeCommand(msg, conn) {
  plugins.commands.forEach(command => {
    if (!msg.sudo && (command.fromMe || config.WORK_TYPE === 'private')) return;
    const handleCommand = (Instance, args) => command.function(new Instance(conn, msg), ...args, msg, conn);
    const text_msg = msg.body;
    
    if (text_msg && command.pattern?.test(text_msg)) {
      const match = text_msg.match(command.pattern);
      msg.prefix = match[1];
      msg.command = `${match[1]}${match[2]}`;
      return handleCommand(Message, [match[3] || false]);
    }

    switch (command.on) {
      case "text": if (text_msg) handleCommand(Message, [text_msg]); break;
      case "image": if (msg.type === "imageMessage") handleCommand(Image, [text_msg]); break;
      case "sticker": if (msg.type === "stickerMessage") handleCommand(Sticker, []); break;
      case "video": if (msg.type === "videoMessage") handleCommand(Video, []); break;
      case "delete": 
        if (msg.type === "protocolMessage") 
          command.function(new Message(conn, msg, { messageId: msg.message.protocolMessage.key?.id }), msg, conn); 
        break;
      case "message": handleCommand(AllMessage, []); break;
    }
  });
}
*/
function executeCommand(msg, conn) {
    plugins.commands.forEach(command => {
      if (!msg.sudo && (command.fromMe || config.WORK_TYPE === 'private')) return;
  
      const handleCommand = (Instance, args) => command.function(new Instance(conn, msg), ...args, msg, conn);
  
      const text_msg = msg.body;
      if (typeof text_msg === "string" && command.pattern instanceof RegExp && command.pattern.test(text_msg)) {
        const match = text_msg.match(command.pattern);
        if (match) {
          msg.prefix = match[1];
          msg.command = `${match[1]}${match[2]}`;
      return handleCommand(Message, [match[3] || false]);
        }
        switch (command.on) {
      case "text": if (text_msg) handleCommand(Message, [text_msg]); break;
      case "image": if (msg.type === "imageMessage") handleCommand(Image, [text_msg]); break;
      case "sticker": if (msg.type === "stickerMessage") handleCommand(Sticker, []); break;
      case "video": if (msg.type === "videoMessage") handleCommand(Video, []); break;
      case "delete": 
        if (msg.type === "protocolMessage") 
          command.function(new Message(conn, msg, { messageId: msg.message.protocolMessage.key?.id }), msg, conn); 
        break;
      case "message": handleCommand(AllMessage, []); break;
      }
    });
            }

async function handleError(err, conn, type) {
  console.error(err);
  await conn.sendMessage(conn.user.id, { text: `\`\`\`X-asena ${type}: \n${err}\`\`\`` });
}

async function readAndRequireFiles(dir) {
  try {
    return Promise.all((await fs.readdir(dir)).filter(f => path.extname(f) === ".js").map(f => require(path.join(dir, f))));
  } catch (err) {
    console.error("Error loading files:", err);
    throw err;
  }
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
    
    app.get("/", (_, res) => res.send("KEIKO XD🧚🏻"));
    app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
    setTimeout(connectToWA, 4000);
  } catch (error) {
    console.error("Initialization error:", error);
    process.exit(1);
  }
}

initialize();
