import {Entity, Column, PrimaryGeneratedColumn, ManyToMany, Repository, Connection} from "typeorm"
import Coord from "./coord";
import { StarSystem } from "./starSystem";
const pd = require("probability-distributions")

/**
 * Used as placeholder to delay world generation. Upon first travel through the link, the
 * segment is expanded into sub-segments recursively, until link is created with a concrete
 * star.
 */
@Entity()
export class StarSegment {

    public constructor() {
        this.expectedStars = 0
        this.expectedRadius = 0
        this.expectedLinks = 0.5
        this.coord = new Coord()
        this.neighbourSystems = []
        this.neighbourSegments = []
    }

    @PrimaryGeneratedColumn()
    id?: number

    @Column()
    expectedStars: number

    @Column()
    expectedRadius: number

    /**
     * How much links do we expect inside this segment
     */
    @Column()
    expectedLinks: number

    public get linkProbability(): number {
        return this.expectedLinks / 
            Math.pow(this.expectedStars, 2)
    }

    @Column(type => Coord)
    coord: Coord

    @ManyToMany(type => StarSystem, starSystem => starSystem.neighbourSegments)
    neighbourSystems: StarSystem[]

    @ManyToMany(type => StarSegment, starSegment => starSegment.neighbourSegments)
    neighbourSegments: StarSystem[]
}

export class StarSegmentRepository {

    readonly repository: Repository<StarSegment>
    
    public constructor(connection: Connection) {
        this.repository = connection.getRepository(StarSegment)
    }

    splitToSegments(segment: StarSegment, amount: number): StarSegment[] {
        // How many stars we expect in each of the subsegments
        const subExpectedStars = segment.expectedStars / amount
        
        // How many links between different sub segments we expect
        const interExpectedLinks = segment.linkProbability * Math.pow(subExpectedStars, 2)

        let result: StarSegment[] = []

        // Create splitFactor segments
        const distances: number[] = pd.rexp(amount, 1 / segment.expectedRadius)
        for(let i = 0; i < amount; i++) {
            const newSegment = this.repository.create()
            newSegment.coord = Coord.randomUnitSphere().multiply(distances[i])
            newSegment.expectedLinks = (segment.expectedLinks - interExpectedLinks) / amount
            newSegment.expectedRadius = segment.expectedRadius * Math.cbrt(amount)
            newSegment.expectedStars = subExpectedStars
        }
    }
}