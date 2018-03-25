import { PrimaryGeneratedColumn, ManyToMany, ManyToOne, Entity } from "typeorm";
import { StarSegment } from "./starSegment";

@Entity()
export class StarLink {

    @PrimaryGeneratedColumn()
    id?: number

    @ManyToOne(type => StarSegment, segment => segment.linksA)
    segmentA?: Promise<StarSegment>

    @ManyToOne(type => StarSegment, segment => segment.linksB)
    segmentB?: Promise<StarSegment>
}