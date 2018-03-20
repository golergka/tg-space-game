import TelegramBot = require("node-telegram-bot-api")

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "180445993:AAHghLnBrO-e5HgD-1X_J9V1XBQ_qwslpL4";
console.log("TELEGRAM_TOKEN: " + TELEGRAM_TOKEN)
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
bot.onText(/\/echo (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    if (match)
    {
        const resp = match[1]
        bot.sendMessage(chatId, resp)
    }
});