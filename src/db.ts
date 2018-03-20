import { Connection } from "typeorm"
import TelegramBot from "node-telegram-bot-api"
import {User, UserRepository} from "./models/user"
import { StarSystemRepository } from "./models/starSystem";

export default class Db {

    readonly connection: Connection
    readonly userRepository: UserRepository
    readonly starSystemRepository: StarSystemRepository

    public constructor(connection: Connection) {
        this.connection = connection
        this.userRepository = new UserRepository(connection)
        this.starSystemRepository = new StarSystemRepository(connection)
    }

    public rememberUser = async (message: TelegramBot.Message) => {
        this.userRepository.rememberUser(message.chat.id)
    }

}