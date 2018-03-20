import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, BaseEntity, Repository, Connection} from "typeorm"
import {StarSystem} from "./starSystem";

@Entity()
export class User {

    public constructor() {
        this.chatId = 0
        this.fuel = 0
    }

    @PrimaryGeneratedColumn()
    id?: number

    @Column("integer")
    chatId: number

    @Column()
    fuel: number

    @ManyToOne(type => StarSystem, starSystem => starSystem.users, { eager: true })
    system?: StarSystem
}

export class UserRepository {
    readonly repository: Repository<User>

    public constructor(connection: Connection) {
        this.repository = connection.getRepository(User)
    }

    public rememberUser = async (chatId: number) => {
        const oldUser = await this.repository.findOne({ chatId: chatId })

        if (!oldUser)
        {
            const user = this.repository.create()
            user.chatId = chatId
            this.repository.save(user)
        }
    }
}