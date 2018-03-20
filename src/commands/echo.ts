import TelegramBot from "node-telegram-bot-api"
import Command from "../command"
import Db from "../db";

export default class Echo extends Command {

    public constructor(bot: TelegramBot, db: Db) {
        super("echo", bot, db)
    }

    invoke(msg: TelegramBot.Message, match: RegExpExecArray|null): void {
        const chatId = msg.chat.id;
        if (match)
        {
            const resp = match[1]
            this.bot.sendMessage(chatId, resp)
        }
    }
}