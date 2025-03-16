const { command } = require("../../lib");

command(
  {
    pattern: "test",
    fromMe: true,
    desc: "Check if the bot is working",
    type: "user",
  },
  async (message, match, conn) => {
    await conn.sendMessage(message.chat, { text: "Pong!" }, { quoted: message });
  }
);
