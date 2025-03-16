const { command, isPrivate } = require("../../lib/plugins");

command(
  {
    pattern: "ping",
    fromMe: isPrivate,
    desc: "To check if the bot is awake",
    type: "user",
  },
  async (message, match, conn) => {
    const start = new Date().getTime();
    
    await conn.sendMessage(
      message.chat, 
      { text: "```Is this thing on?```" }, 
      { quoted: message }
    );

    const end = new Date().getTime();

    return await conn.sendMessage(
      message.chat,
      { text: `*Boing!*\n\`\`\`${end - start}\`\`\` *milliseconds of my life wasted*` },
      { quoted: message }
    );
  }
);
/*const { fromBuffer, mimeTypes } = require("file-type");
const { command, isPrivate } = require("../../lib/");
command(
  {
    pattern: "ping",
    fromMe: isPrivate,
    desc: "To check if the bot is awake",
    type: "user",
  },
  async (message, match) => {
    const start = new Date().getTime();
    await message.sendMessage(message.jid, "```Is this thing on?```");
    const end = new Date().getTime();
    return await message.sendMessage(
      message.jid,
      "*Boing!*\n ```" + (end - start) + "``` *milliseconds of my life wasted*"
    );
  }
);*/
