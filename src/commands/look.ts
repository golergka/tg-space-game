import TelegramBot from "node-telegram-bot-api"
import Command from "../command";
import Db from "../db";

export default class Look extends Command {

    public constructor(bot: TelegramBot, db: Db) {
        super("look", bot, db)
    }

    async invoke(msg: TelegramBot.Message, match: RegExpExecArray|null): Promise<void> {
        const location = await this.db.getLocation(msg)
        this.bot.sendMessage(
            msg.chat.id, 
            "You are at system " + location.name + "\n")

    }
}