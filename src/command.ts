import { Db, CommandContext } from "./db"
import TelegramBot from "node-telegram-bot-api"

export default abstract class Command {

    readonly bot: TelegramBot
    readonly db: Db
    readonly name: String

    constructor(name: String, bot: TelegramBot, db: Db) {
        this.bot = bot
        this.db = db
        this.name = name

        /*
        const regex = new RegExp("/" + name + "(?: (.+))*")
        this.bot.onText(regex, async (msg: TelegramBot.Message, match: RegExpExecArray|null) => {
            const context = await db.getContext(msg)
            this.invoke.bind(this)(msg, match, context)
        });
        */
    }

    public abstract async tryInvoke(
        msg: TelegramBot.Message, 
        context: CommandContext
    ): Promise<boolean>;

    /*
    abstract async invoke(
        msg: TelegramBot.Message, 
        match: RegExpExecArray|null,
        context: CommandContext
    ): Promise<void>;
    */
}