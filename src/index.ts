import "reflect-metadata"
import TelegramBot from "node-telegram-bot-api"
import {createConnection, Connection} from "typeorm"
import Db from "./db"
import Echo from "./commands/echo"

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "180445993:AAHghLnBrO-e5HgD-1X_J9V1XBQ_qwslpL4";
console.log("TELEGRAM_TOKEN: " + TELEGRAM_TOKEN)

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

bot.on('polling_error', (error: Error) => {
    console.log(error)
});

createConnection({
    type: "sqlite",
    entities: ["dist/models/**/*.js"],
    database: "testdb.sqlite3",
    logging: true,
    synchronize: true
}).then((connection: Connection) => {

    process.on('exit', () => connection.synchronize())

    const db = new Db(connection)

    bot.on("message", db.rememberUser)

    const echo = new Echo(bot, db);
})