import TelegramBot from "node-telegram-bot-api"

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "180445993:AAHghLnBrO-e5HgD-1X_J9V1XBQ_qwslpL4";
console.log("TELEGRAM_TOKEN: " + TELEGRAM_TOKEN)

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
bot.on('polling_error', (error: Error) => {
    console.log(error)
});

import Db from "./db"
const db = new Db();

import Echo from "./commands/echo"
const echo = new Echo(bot, db);