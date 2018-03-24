import {Entity, Column, PrimaryGeneratedColumn, ManyToMany, Repository, Connection, TreeParent, TreeChildren, Transaction, TransactionManager, EntityManager, EntityRepository, ClosureEntity, OneToMany} from "typeorm"
import Coord from "./coord";
import { StarSystem, StarSystemRepository } from "./starSystem";
const pd = require("probability-distributions")

/**
 * Used as placeholder to delay world generation. Upon first travel through the link, the
 * segment is expanded into sub-segments recursively, until link is created with a concrete
 * star.
 */
@ClosureEntity()
export class StarSegment {

    @PrimaryGeneratedColumn()
    id?: number

    @TreeParent()
    parent?: StarSegment

    @TreeChildren()
    childrenSegments: StarSegment[] = []

    @OneToMany(type => StarSystem, starSystem => starSystem.parentSegment)
    childrenSystems: StarSystem[] = []

    @Column()
    generatedChildren: boolean = false

    @Column({type: "real"})
    expectedStars: number = 0

    @Column({type: "real"})
    expectedRadius: number = 0

    /**
     * How much links do we expect inside this segment
     */
    @Column()
    expectedLinks: number = 0

    public get linkProbability(): number {
        return this.expectedLinks / 
            Math.pow(this.expectedStars, 2)
    }

    @Column(type => Coord)
    position: Coord = new Coord()

    /*
    @ManyToMany(type => StarSystem, starSystem => starSystem.neighbourSegments)
    neighbourSystems: StarSystem[] = []

    @ManyToMany(type => StarSegment, starSegment => starSegment.neighbourSegments)
    neighbourSegments: StarSystem[] = []
    */

    /**
     * Generates random position for a child segment or a star
     */
    generateChildPosition(): Coord {
        const distance: number = pd.rexp(1, 1/this.expectedRadius)[0]
        const direction = Coord.randomUnitSphere()
        const delta = Coord.multiply(direction, distance)
        return Coord.add(this.position, delta)
    }

    @Transaction()
    public async tryGenerateChildren(@TransactionManager() manager: EntityManager) {

        const amount = 4
        if (this.generatedChildren)
            return

        // How many stars we expect in each of the subsegments
        const subExpectedStars = this.expectedStars / amount

        const segmentRepository = manager.getRepository(StarSegment)

        // Generate sub-segments
        if (subExpectedStars >= 2)
        {
            // How many links between different sub segments we expect
            const interExpectedLinks = this.linkProbability * Math.pow(subExpectedStars, 2)

            let children: StarSegment[] = []

            for(let i = 0; i < amount; i++) {
                const newSegment = await segmentRepository.create()
                newSegment.position = this.generateChildPosition()
                newSegment.expectedLinks = (this.expectedLinks - interExpectedLinks) / amount
                newSegment.expectedRadius = this.expectedRadius / Math.cbrt(amount)
                newSegment.expectedStars = subExpectedStars
                newSegment.parent = this
                await segmentRepository.save(newSegment)
                children.push(newSegment)
            }
            this.childrenSegments = children
        }
        // Generate stars
        else
        {
            const starRepository = manager.getCustomRepository(StarSystemRepository)
            const children: StarSystem[] = []

            for(let i = 0; i < this.expectedLinks; i++) {
                const position = this.generateChildPosition()
                const newStar = await starRepository.generateStarSystem(position)
                children.push(newStar)
            }
            this.childrenSystems = children
        }
        this.generatedChildren = true
        await segmentRepository.save(this)
        
  }
}