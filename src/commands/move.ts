import TelegramBot from "node-telegram-bot-api"
import Command from "../command";
import { Db, CommandContext } from "../db";
import { StarLink, StarLinkEdge } from "../models/starLink";
import Look from "./look";

export default class Move extends Command {

    /* ⏩
     * Black right-pointing double triangle
     * Unicode: U+23E9, UTF-8: E2 8F A9
     */
    readonly regex: RegExp = new RegExp(/(?:\u{23E9}(.*))$/u)
    readonly look: Look

    public constructor(bot: TelegramBot, db: Db, look: Look) {
        super("move", bot, db)
        this.look = look
    }

    public async tryInvoke(msg: TelegramBot.Message, context: CommandContext): Promise<boolean> {
        if (!msg.text)
            return false

        // Matching
        const match = this.regex.exec(msg.text!)
        if (!match)
            return false

        // Searching for appropriate label
        const label = match[1]
        const system = await context.user.system!
        const labelledLinks = await system.labelledLinks()
        if (!(label in labelledLinks))
            return false

        const link = labelledLinks[label]
        await this.db.travel(context.user.id!, link.link.id!, link.direction)

        await this.look.invoke(msg.chat.id, await this.db.getContext(msg))
        return true
    }

}