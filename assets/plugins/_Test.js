const { command } = require("../../lib");
/*
command(
  {
    pattern: "test",
    fromMe: true,
    desc: "Check if the bot is working",
    type: "user",
  },
  async (message, match) => {
    await message.sendMessage(message.chat, { text: "Pong!" }, { quoted: message });
  }
);
*/
command(
  {
    pattern: 'e',
    fromMe: true,
    desc: 'Runs server code',
    type: "user"
  },
  async (message, match, m) => {
    if (typeof match !== 'string') return message.reply('Invalid input');
    if (match.startsWith('=>')) {

      try {
        const res = await eval(`(async () => { return ${match.slice(3)} })()`);
        return message.reply(res); 
      } catch (e) {
        message.reply(String(e));
      }

    } else if (match.startsWith('>')) {
      try {
        let evaled = await eval(match.slice(2));
        if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);
        await message.reply(evaled);
      } catch (err) {
        await message.reply(String(err));
      }
    } else if (match.startsWith('$')) {
      exec(match.slice(2), (err, stdout) => {
        if (err) return message.reply(err);
        if (stdout) return message.reply(stdout);
      });
    }
  }
);
