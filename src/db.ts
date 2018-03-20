import { Connection } from "typeorm"
import TelegramBot from "node-telegram-bot-api"
import User from "./models/user"

export default class Db {

    readonly connection: Connection

    public constructor(connection: Connection) {
        this.connection = connection
    }

    public rememberUser = async (message: TelegramBot.Message) => {
        const chatId = message.chat.id;
        const userRepository = this.connection.getRepository(User)
        const oldUser = await userRepository.findOne({ chatId: chatId})

        if (!oldUser)
        {
            const newUser = userRepository.create({ chatId: chatId })
            userRepository.save(newUser)
        }
    }

}