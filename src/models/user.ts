import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, BaseEntity, Repository, Connection, EntityRepository} from "typeorm"
import {StarSystem} from "./starSystem";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id?: number

    @Column("integer")
    chatId: number = 0

    @Column()
    username: string = ""

    @Column()
    fuel: number = 0

    @ManyToOne(type => StarSystem, starSystem => starSystem.occupants, { eager: true })
    system?: Promise<StarSystem>
}

@EntityRepository(User)
export class UserRepository extends Repository<User> {

}