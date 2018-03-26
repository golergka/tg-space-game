import TelegramBot from "node-telegram-bot-api"
import Command from "../command";
import { Db, CommandContext } from "../db";

export default class Look extends Command {

    public constructor(bot: TelegramBot, db: Db) {
        super("look", bot, db)
    }

    async invoke(
        msg: TelegramBot.Message, 
        match: RegExpExecArray|null,
        context: CommandContext
    ): Promise<void> {
        const system = await context.user.system!
        this.bot.sendMessage(
            msg.chat.id, 
            "You are at system " + system.name + "\n")

    }
}