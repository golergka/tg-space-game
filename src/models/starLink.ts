import { PrimaryGeneratedColumn, ManyToMany, ManyToOne, Entity } from "typeorm";
import { StarSegment } from "./starSegment";
import { StarSystem } from "./starSystem";

@Entity()
export class StarLink {

    @PrimaryGeneratedColumn()
    id?: number

    @ManyToOne(type => StarSegment, segment => segment.linksA)
    segmentA?: Promise<StarSegment>

    @ManyToOne(type => StarSegment, segment => segment.linksB)
    segmentB?: Promise<StarSegment>

    @ManyToOne(type => StarSystem, star => star.linksA)
    systemA?: Promise<StarSystem>

    @ManyToOne(type => StarSystem, star => star.linksB)
    systemB?: Promise<StarSystem>
}