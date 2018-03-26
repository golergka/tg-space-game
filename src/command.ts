import Db from "./db"
import TelegramBot from "node-telegram-bot-api"

export default abstract class Command {

    readonly bot: TelegramBot
    readonly db: Db
    readonly name: String

    constructor(name: String, bot: TelegramBot, db: Db) {
        this.bot = bot
        this.db = db
        this.name = name

        const regex = new RegExp("/" + name + "( (.+))*");
        this.bot.onText(regex, this.invoke.bind(this));
    }

    abstract async invoke(msg: TelegramBot.Message, match: RegExpExecArray|null): Promise<void>;
}