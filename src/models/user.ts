import {Entity, PrimaryGeneratedColumn, Column} from "typeorm"

@Entity()
export default class User {

    public constructor() {
        this.chatId = 0
    }

    @PrimaryGeneratedColumn()
    id?: number

    @Column()
    chatId: number
}