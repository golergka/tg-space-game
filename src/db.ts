import { Connection, EntityManager } from "typeorm"
import TelegramBot from "node-telegram-bot-api"
import {User, UserRepository} from "./models/user"
import { StarSystemRepository, StarSystem } from "./models/starSystem";

export default class Db {

    readonly connection: Connection
    readonly startId: number

    public constructor(connection: Connection, startSystem: StarSystem) {
        this.connection = connection
        this.startId = startSystem.id!
    }

    public rememberUser = async (message: TelegramBot.Message) => {
        if (await this.getUser(message))
            return
        await this.connection.transaction(async (entityManager: EntityManager) => {
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
        })
    }

    public getUser = async (message: TelegramBot.Message): Promise<User|undefined> => {
        const username = message.from!.username
        const userRepository = this.connection.getCustomRepository(UserRepository)
        return await userRepository.findOne({ username: username })
    }

    public getLocation = async (message: TelegramBot.Message): Promise<StarSystem> => {
        const user = await this.getUser(message)
        return await user!.system!
    }

}