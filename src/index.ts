import "reflect-metadata"
import TelegramBot from "node-telegram-bot-api"
import {createConnection, Connection} from "typeorm"
import Db from "./db"
import Echo from "./commands/echo"
import { StarSegment } from "./models/starSegment";
import Look from "./commands/look";

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
    synchronize: true,
    dropSchema: true
}).then(async (connection: Connection) => {

    process.on('exit', () => connection.synchronize())

    const starSegmentRepository = connection.getTreeRepository(StarSegment)

    let iterator: StarSegment|null = starSegmentRepository.create()
    iterator.expectedRadius = 2
    //iterator.expectedRadius = 20000
    iterator.expectedStars = 10
    //iterator.expectedStars = 1e10
    await starSegmentRepository.save(iterator)

    while(!iterator.generatedChildren)
    {
        console.log("Generating segment " + iterator.id! + " with " + iterator.expectedStars + " stars")
        await iterator.tryGenerateChildren.apply(iterator)
        const children: StarSegment[] = await iterator.childrenSegments!
        if (children.length > 0) {
            const sortedChildren = children.sort((a, b) => b.totalLinkCount() - a.totalLinkCount())
            for (const s of sortedChildren)
                console.log("Child segment " + s.id! + " has " + s.totalLinkCount() + " links")
            iterator = sortedChildren[0]
        }
        console.log("Done")
    }

    const systems = await iterator.childrenSystems!
    const sortedSystems = systems.sort((a, b) => b.totalLinkCount() - a.totalLinkCount())
    for (const s of systems)
        console.log("Child system " + s.name + " has " + s.totalLinkCount() + " links")
    
    const startSystem = sortedSystems[0]
    console.log("Start system: " + startSystem)

    const db = new Db(connection, startSystem!)

    const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

    bot.on('polling_error', (error: Error) => {
        console.log(error)
    });

    bot.on('message', db.rememberUser)

    const echo = new Echo(bot, db)
    const look = new Look(bot, db)
})