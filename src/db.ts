import { Connection, EntityManager } from "typeorm"
import TelegramBot from "node-telegram-bot-api"
import {User, UserRepository} from "./models/user"
import { StarSystemRepository, StarSystem } from "./models/starSystem";
import Command from "./command";
import { StarLink, StarLinkEdge } from "./models/starLink";
import { StarSegment } from "./models/starSegment";

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

    public getContext = async (message: TelegramBot.Message): Promise<CommandContext> => {
        const user = await this.getOrGenerateUser(message)
        return new CommandContext(user)
    }

    public travel = async (userId: number, linkId: number, direction: StarLinkEdge): Promise<void> => {
        await this.connection.transaction(async (manager: EntityManager): Promise<void> =>  {
            const linkRepository = manager.getRepository(StarLink)
            const link: StarLink = (await linkRepository.findOneById(linkId))!
            let segmentDestination = await link.segment(direction)
            while (segmentDestination) {
                await segmentDestination.tryGenerateChildren.apply(segmentDestination)
                segmentDestination = await link.segment(direction)
            }
            const systemDestination = await link.system(direction)!

            const userRepository = manager.getCustomRepository(UserRepository)
            const user = (await userRepository.findOneById(userId))!
            const systemOrigin = await user.system!

            await systemOrigin.tryRemoveOccupant(user)
            await systemDestination.pushOccupant(user)
            user.system = Promise.resolve(systemDestination)

            const systemRepository = manager.getCustomRepository(StarSystemRepository)
            await systemRepository.save(systemOrigin)
            await systemRepository.save(systemDestination)
            await userRepository.save(user)
        })
    }
}

export class CommandContext {
    public readonly user: User

    public constructor(user: User) {
        this.user = user
    }
}