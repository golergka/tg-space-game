import { PrimaryGeneratedColumn, ManyToMany, ManyToOne, Entity } from "typeorm";
import { StarSegment } from "./starSegment";
import { StarSystem } from "./starSystem";

export enum StarLinkEdge {
    A = 'A',
    B = 'B'
}

@Entity()
export class StarLink {

    @PrimaryGeneratedColumn()
    id?: number

    @ManyToOne(type => StarSegment, segment => segment.linksA)
    segmentA?: Promise<StarSegment>

    @ManyToOne(type => StarSegment, segment => segment.linksB)
    segmentB?: Promise<StarSegment>

    public segment(edge: StarLinkEdge): Promise<StarSegment> | undefined {
        switch(edge) {
            case StarLinkEdge.A:
                return this.segmentA
            case StarLinkEdge.B:
                return this.segmentB
        }
    }

    @ManyToOne(type => StarSystem, star => star.linksA)
    systemA?: Promise<StarSystem>

    @ManyToOne(type => StarSystem, star => star.linksB)
    systemB?: Promise<StarSystem>

    public system(edge: StarLinkEdge): Promise<StarSystem> | undefined {
        switch(edge) {
            case StarLinkEdge.A:
                return this.systemA
            case StarLinkEdge.B:
                return this.systemB
        }
    }
}