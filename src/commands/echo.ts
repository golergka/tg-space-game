import TelegramBot from "node-telegram-bot-api"
import Command from "../command"
import { Db, CommandContext } from "../db";

export default class Echo extends Command {

    public constructor(bot: TelegramBot, db: Db) {
        super("echo", bot, db)
    }

    async invoke(
        msg: TelegramBot.Message, 
        match: RegExpExecArray|null, 
        context: CommandContext
    ): Promise<void> {
        const chatId = msg.chat.id;
        if (match)
        {
            const resp = match[1]
            this.bot.sendMessage(chatId, resp)
        }
    }
}