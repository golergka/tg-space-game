import { Connection, EntityManager } from "typeorm"
import TelegramBot from "node-telegram-bot-api"
import {User, UserRepository} from "./models/user"
import { StarSystemRepository, StarSystem } from "./models/starSystem";
import Command from "./command";

export class Db {

    readonly connection: Connection
    readonly startId: number

    public constructor(connection: Connection, startSystem: StarSystem) {
        this.connection = connection
        this.startId = startSystem.id!
    }

    private tryGetUser = async (message: TelegramBot.Message): Promise<User|undefined> => {
        const username = message.from!.username
        const userRepository = this.connection.getCustomRepository(UserRepository)
        return await userRepository.findOne({ username: username })
    }

    private getOrGenerateUser = async (message: TelegramBot.Message): Promise<User> => {
        const oldUser = await this.tryGetUser(message)
        if (oldUser)
            return oldUser!
        return this.connection.transaction(async (entityManager: EntityManager) => {
            const userRepository = entityManager.getCustomRepository(UserRepository)
            
            // Create new user
            const newUser = userRepository.create()
            newUser.chatId = message.chat.id
            newUser.username = message.from!.username!

            // Put new user in the start system
            const systemRepository = entityManager.getCustomRepository(StarSystemRepository)
            const startSystem = await systemRepository.findOneById(this.startId)
            newUser.system = Promise.resolve(startSystem!)
            startSystem!.pushOccupant(newUser)
            
            await systemRepository.save(startSystem!)
            await userRepository.save(newUser)

            return newUser
        })
    }

    public getLocation = async (message: TelegramBot.Message): Promise<StarSystem> => {
        const user = await this.tryGetUser(message)
        return await user!.system!
    }

    public getContext = async (message: TelegramBot.Message): Promise<CommandContext> => {
        const user = await this.getOrGenerateUser(message)
        return new CommandContext(user)
    }

}

export class CommandContext {
    public readonly user: User

    public constructor(user: User) {
        this.user = user
    }
}