import TelegramBot, { KeyboardButton, SendMessageOptions } from "node-telegram-bot-api"
import Command from "../command";
import { Db, CommandContext } from "../db";

export default class Look extends Command {

    readonly regex: RegExp

    public constructor(bot: TelegramBot, db: Db) {
        super("👁️", bot, db)
        this.regex = new RegExp(/\u{1F441}$/u)
    }

    public async invoke(chatId: number, context: CommandContext) {
        const system = await context.user.system!
        const labelledLinks = await system.labelledLinks()

        const keyboard: KeyboardButton[][] = []
        for (const label in labelledLinks) {
            keyboard.push([{ text: "⏩" + label }])
        }
        
        const options: SendMessageOptions = {
            parse_mode: "Markdown",
            reply_markup: {
                keyboard: keyboard,
                resize_keyboard: true,
                one_time_keyboard: true
            }
        }

        this.bot.sendMessage(chatId, 
            "You are at system " + system.name + "\n", options)
    }

    public async tryInvoke(msg: TelegramBot.Message, context: CommandContext): Promise<boolean> {
        if (!msg.text)
            return false

        const match = this.regex.exec(msg.text!)
        if (!match)
            return false
        
        await this.invoke(msg.chat.id!, context)

        return true
    }

}