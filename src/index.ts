import "reflect-metadata"
import TelegramBot from "node-telegram-bot-api"
import {createConnection, Connection} from "typeorm"
import { Db } from "./db"
import { StarSegment } from "./models/starSegment";
import Look from "./commands/look";
import Command from "./command";
import Move from "./commands/move";
import { StarSystem } from "./models/starSystem";
import { StarLink } from "./models/starLink";
import { User } from "./models/user";

process.on('unhandledRejection', up => { throw up })

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "180445993:AAEG4kcOf8siJw8M11FobH_PX8NCcu5Q8CU";
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
    entities: [
        StarSegment,
        StarLink,
        User,
        StarSystem 
    ],
    synchronize: true,
    dropSchema: true
}).then(async (connection: Connection) => {

    const debug = process.env["DEBUG"]
    console.log("DEBUG", debug)

    process.on('exit', () => connection.synchronize())

    const starSegmentRepository = connection.getTreeRepository(StarSegment)

    let iterator: StarSegment|null = starSegmentRepository.create()
    iterator.expectedRadius = 2
    //iterator.expectedRadius = 20000
    iterator.expectedStars = 10
    //iterator.expectedStars = 1e10
    await starSegmentRepository.save(iterator)

    // Generating down to the start system
    while(!iterator.generatedChildren) {
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

    // Finding start system
    const systems = await iterator.childrenSystems!
    const sortedSystems = systems.sort((a, b) => b.totalLinkCount() - a.totalLinkCount())
    for (const s of systems)
        console.log("Child system " + s.name + " has " + s.totalLinkCount() + " links")
    
    const startSystem = sortedSystems[0]
    console.log("Start system: " + startSystem)

    // Creating db
    const db = new Db(connection, startSystem!)

    // Create and set up bot
    const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

    bot.on('polling_error', (error: Error) => {
        console.log(error)
    });

    // Initialize commands
    const look = new Look(bot, db)
    const move = new Move(bot, db, look)
    const commands: Command[] = [
        look,
        move
    ]

    // Initialize command responder
    bot.on('message', async (msg: TelegramBot.Message) => {
        const context = await db.getContext(msg)
        for (const cmd of commands) {
            if (await cmd.tryInvoke(msg, context)) {
                return
            }
        }
        bot.sendMessage(msg.chat.id, "Это что-то мне непонятное.")
    })
})