import {Entity, Column, PrimaryGeneratedColumn, ManyToMany, Repository, Connection, TreeParent, TreeChildren, Transaction, TransactionManager, EntityManager, EntityRepository, ClosureEntity, OneToMany, JoinTable} from "typeorm"
import Coord from "./coord";
import { StarSystem, StarSystemRepository } from "./starSystem";
import { StarLink } from "./starLink";
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

    @Column("real")
    expectedStars: number = 0

    @Column("real")
    expectedRadius: number = 0

    @Column(type => Coord)
    position: Coord = new Coord()

    /**
     * Links where this segment is side A
     */
    @OneToMany(type => StarLink, link => link.segmentA, { eager: true})
    linksA?: StarLink[]

    /**
     * Links where this segment is side B
     */
    @OneToMany(type => StarLink, link => link.segmentB, { eager: true})
    linksB?: StarLink[]

    /**
     * Generates random position for a child segment or a star
     */
    generateChildPosition(): Coord {
        const distance: number = pd.rexp(1, 1/this.expectedRadius)[0]
        const direction = Coord.randomUnitSphere()
        const delta = Coord.multiply(direction, distance)
        return Coord.add(this.position, delta)
    }

    /**
     * Generates self-referential array of array of links. Array memebrs are self-referential ids, starting
     * with 0. Generated graph is guaranteed to be linked.
     * @param elements amount of elements
     * @param linkAmount required links, from elements-1 to elements*(elemenets-1)
     * @param weights relative weight of each element
     * @param unique whether to enforce unique constraint
     */
    generateLinks<T>(
        elements: T[], 
        linkAmount: number, 
        weights: number[],
        unique: boolean = false
    ): [T, T][] {

        const links: [T, T][] = []

        // Required links (so that graph is linked)
        const minLinks = elements.length - 1
        const requiredSequence = pd.sample(elements)
        for(let i = 0; i < minLinks; i++) {
            links.push([requiredSequence[i], requiredSequence[i + 1]])
        }

        // Extra links
        const maxLinks = elements.length * (elements.length - 1)
        const extraLinks = Math.floor(Math.max(linkAmount - minLinks, maxLinks))
        const isValidLink = function(x: T, y: T): boolean {
            if (x === y)
                return false
            return !unique ||
                (links.indexOf([x, y]) == -1 && 
                links.indexOf([y, x]) == -1)
        }
        if (extraLinks > 0)
        {
            const from: T[] = pd.sample(elements, extraLinks, true, weights)
            fromLoop: for(const x of from) {
                let y: T
                let attempts = 0
                do {
                    y = pd.sample(elements, 1, true, weights)[0]
                    attempts ++
                    if (attempts > 100) {
                        console.log("Can't generate unique neighbour!")
                        continue fromLoop
                    }
                } while (!isValidLink(x, y))
                links.push([x, y])
            }
        }
        
        return links

    }

    @Transaction()
    public async tryGenerateChildren(@TransactionManager() manager: EntityManager) {

        const childAmount = 10
        if (this.generatedChildren)
            return

        // How many stars we expect in each of the subsegments
        const childStars = this.expectedStars / childAmount

        const segmentRepository = manager.getRepository(StarSegment)

        // Generate sub-segments
        if (childStars >= 2)
        {
            // How many links between different sub segments we expect
            const childRadius = this.expectedRadius / Math.cbrt(childAmount)
            const expectedLinks = Math.min(100, this.expectedStars * 4)

            let children: StarSegment[] = []

            for(let i = 0; i < childAmount; i++) {
                const newSegment = await segmentRepository.create()
                newSegment.position = this.generateChildPosition()
                newSegment.expectedRadius = childRadius
                newSegment.expectedStars = childStars
                newSegment.parent = this
                children.push(newSegment)
            }
            this.childrenSegments = children

            // Save child segments
            await Promise.all(children.map(s => segmentRepository.save(s)))

            // We want our children connectivity NOT to follow Gauss' distribution
            const childWeights = pd.rexp(childAmount)
            const pairs = this.generateLinks(children, expectedLinks, childWeights)
            const linkRepository = manager.getRepository(StarLink)
            const links: StarLink[] = []
            for (const p of pairs) {
                const newLink = linkRepository.create()
                newLink.segmentA = Promise.resolve(p[0])
                newLink.segmentB = Promise.resolve(p[1])
                p[0].linksA = p[0].linksA || []
                p[1].linksB = p[1].linksB || []
                p[0].linksA!.push(newLink)
                p[1].linksB!.push(newLink)
                links.push(newLink)
            }

            // Save all generated links
            await Promise.all(links.map(l => linkRepository.save(l)))
            
            // Re-delegate all links from parent to children
            let subLinks: StarLink[] = []
            if (this.linksA)
            {
                const linkASubs: StarSegment[] = pd.sample(children, this.linksA!.length, true, childWeights)
                for(let i = 0; i < this.linksA!.length; i++) {
                    const link: StarLink = this.linksA![i]
                    const sub = linkASubs[i]
                    link.segmentA = Promise.resolve(sub)
                    sub.linksA = sub.linksA || []
                    sub.linksA!.push(link)
                }
                subLinks = subLinks.concat(this.linksA!)
            }

            if (this.linksB)
            {
                const linkBSubs: StarSegment[] = pd.sample(children, this.linksB!.length, true, childWeights)
                for(let i = 0; i < this.linksB!.length; i++) {
                    const link: StarLink = this.linksB![i]
                    const sub = linkBSubs[i]
                    link.segmentB = Promise.resolve(sub)
                    sub.linksB = sub.linksB || []
                    sub.linksB!.push(link)
                }
                subLinks = subLinks.concat(this.linksB!)
            }
            this.linksA = []
            this.linksB = []

            // Save substitbuted links
            await Promise.all(subLinks.map(l => linkRepository.save(l)))

            // Save child segments
            await Promise.all(children.map(s => segmentRepository.save(s)))

        }
        // Generate stars
        else
        {
            const starRepository = manager.getCustomRepository(StarSystemRepository)
            const children: StarSystem[] = []

            for(let i = 0; i < this.expectedStars; i++) {
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