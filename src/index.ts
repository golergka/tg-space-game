import "reflect-metadata"
import TelegramBot from "node-telegram-bot-api"
import {createConnection, Connection} from "typeorm"
import Db from "./db"
import Echo from "./commands/echo"
import { StarSegment } from "./models/starSegment";

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "180445993:AAHghLnBrO-e5HgD-1X_J9V1XBQ_qwslpL4";
console.log("TELEGRAM_TOKEN: " + TELEGRAM_TOKEN)

const sqliteSetup = {
    type: "sqlite",
    entities: ["dist/models/**/*.js"],
    database: "testdb.sqlite3",
    logging: true,
    synchronize: true
}

createConnection({
    type: "postgres",
    url: "postgresql://localhost",
    username: "maxyankov",
    database: "maxyankov",
    entities: ["dist/models/**/*.js"],
    logging: true,
    synchronize: true,
    dropSchema: true
}).then(async (connection: Connection) => {

    process.on('exit', () => connection.synchronize())

    const starSegmentRepository = connection.getTreeRepository(StarSegment)

    let iterator: StarSegment|null = starSegmentRepository.create()
    iterator.expectedRadius = 1000
    iterator.expectedStars = 1000000
    await starSegmentRepository.save(iterator)

    while(iterator != null)
    {
        await iterator.tryGenerateChildren.apply(iterator)
        if (iterator.childrenSegments.length > 0)
            iterator = iterator.childrenSegments[0]
        else
            iterator = null
    }

    const db = new Db(connection)

    const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

    bot.on('polling_error', (error: Error) => {
        console.log(error)
    });

    bot.on('message', db.rememberUser)

    const echo = new Echo(bot, db);
})