import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, BaseEntity, Connection, Repository, ManyToMany, EntityRepository} from "typeorm"
import {User} from "./user";
import { StartPollingOptions } from "node-telegram-bot-api";
import Coord from "./coord";
import { StarSegment } from "./starSegment";
const pd = require("probability-distributions")

@Entity()
class StarSystemProfile {

    public constructor() {
        this.expectedNeighbours = 3
    }

    @PrimaryGeneratedColumn()
    id?: number

    @Column()
    expectedNeighbours: number
}

@Entity()
export class StarSystem {

    public constructor() {
        this.name = ""
        this.neigboursGenerated = false
        this.position = new Coord()
        this.occupants = []
        this.neighbourSegments = []
    }

    @PrimaryGeneratedColumn()
    id?: number

    @Column()
    name: string

    @Column(type => Coord)
    position: Coord

    @ManyToOne(type => StarSegment, starSegment => starSegment.childrenSystems)
    parentSegment?: StarSegment

    @OneToMany(type => User, user => user.system)
    occupants: User[]

    /*
    @ManyToMany(type => StarSegment, starSegment => starSegment.neighbourSegments)
    neighbourSegments: StarSegment[]
    */

}

@EntityRepository(StarSystem)
export class StarSystemRepository extends Repository<StarSystem> {

    static readonly greekPrefixes: string[] = ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "ϑ", "ι", "κ", "λ"]
    static readonly constellations: string[] = [
        "Andromeda",
        "Antlia",
        "Apus",
        "Aquarius",
        "Aquila",
        "Ara",
        "Aries",
        "Auriga",
        "Bootes",
        "Caelum",
        "Camelopardalis",
        "Cancer",
        "Canes Venatici",
        "Canis Major",
        "Canis Minor",
        "Capricornus",
        "Carina",
        "Cassiopeia",
        "Centaurus",
        "Cepheus",
        "Cetus",
        "Chamaeleon",
        "Circinus",
        "Columba",
        "Coma Berenices",
        "Corona Austrina",
        "Corona Borealis",
        "Corvus",
        "Crater",
        "Crux",
        "Cygnus",
        "Delphinus",
        "Dorado",
        "Draco",
        "Equuleus",
        "Eridanus",
        "Fornax",
        "Gemini",
        "Grus",
        "Hercules",
        "Horologium",
        "Hydra",
        "Hydrus",
        "Indus",
        "Lacerta",
        "Leo",
        "Leo Minor",
        "Lepus",
        "Libra",
        "Lupus",
        "Lynx",
        "Lyra",
        "Mensa",
        "Microscopium",
        "Monoceros",
        "Musca",
        "Norma",
        "Octans",
        "Ophiuchus",
        "Orion",
        "Pavo",
        "Pegasus",
        "Perseus",
        "Phoenix",
        "Pictor",
        "Pisces",
        "Piscis Austrinus",
        "Puppis",
        "Pyxis",
        "Reticulum",
        "Sagitta",
        "Sagittarius",
        "Scorpius",
        "Sculptor",
        "Scutum",
        "Serpens",
        "Sextans",
        "Taurus",
        "Telescopium",
        "Triangulum",
        "Triangulum Australe",
        "Tucana",
        "Ursa Major",
        "Ursa Minor",
        "Vela",
        "Virgo",
        "Volans",
        "Vulpecula"
    ]

    private static intersect(str1: string, str2: string): boolean {
        let i1 = str1.length
        while(i1--) {
            const c1 = str1.charAt(i1)

            let i2 = str2.length
            while(i2--)
            {
                const c2 = str2.charAt(i2)
                if (c1 === c2)
                    return true
            }
        }
        return false
    }

    static readonly vowels: string = "aeiou"
    static readonly consonants: string = "bcdfghjklmnpqrstvwxyz"

    private static validSyllable(syllable: string): boolean {

        return this.intersect(syllable, this.vowels) 
            && this.intersect(syllable, this.consonants)
    }

    private static splitSyllables(word: string): string[] {
        for(let i = 0; i < word.length - 1; i++) {
            const prefix = word.substring(0, i)
            const suffix = word.substring(i)
            if (this.validSyllable(prefix))
                return [prefix].concat(this.splitSyllables(suffix))
        }
        return [word]
    }

    private static generateNameGenerator(): () => string {
        // Total words in all constellations
        let sumWordAmount = 0

        // Total syllables in all constellations
        let sumSullableAmount = 0
        
        let syllableCounts:{ [index: string]: number} = {}

        for (const constellation of this.constellations) {
            const words = constellation.split(" ")
            sumWordAmount += words.length
            for (let w of words) {
                w = w.toLowerCase()

                const syllables = this.splitSyllables(w)
                sumSullableAmount += syllables.length

                for (let s of syllables) {
                    if (s in syllableCounts) {
                        syllableCounts[s] = syllableCounts[s] + 1
                    } else {
                        syllableCounts[s] = 1
                    }
                }
            }
        }

        // Average words per constellation
        const avgWordsAmount = sumWordAmount / this.constellations.length

        // Average syllables per word
        const avgSyllableAmount = sumSullableAmount / sumWordAmount

        let syllableProbabilities: { [index: string]: number } = {}

        for (const syllable in syllableCounts) {
            syllableProbabilities[syllable] = syllableCounts[syllable] / sumSullableAmount
        }

        const randomSyllable = (): string => {
            let mass = 1
            for(const syllable in syllableProbabilities) {
                const p = syllableProbabilities[syllable]
                if (Math.random() < (p / mass))
                    return syllable
                mass = mass - p
            }
            return ""
        }

        const randomWord = (): string => {
            const syllableAmount = this.poisson1based(avgSyllableAmount)
            let result = "";
            for(let i = 0; i < syllableAmount; i++) {
                result += randomSyllable()
            }
            return result;
        }

        return (): string => {
            const wordsAmount = this.poisson1based(avgWordsAmount)
            let words: string[] = []
            for(let i = 0; i < wordsAmount; i++) {
                let word = randomWord()
                // capitalize
                word = word.charAt(0).toUpperCase() + word.slice(1)
                words.push(word)
            }
            return words.join(" ")
        }
    }

    private static poisson1based(expectation: number): number {
        return pd.rpois(1, expectation - 1)[0] + 1
    }

    readonly generateName: () => string
    
    public constructor(connection: Connection) {
        super()
        this.generateName = StarSystemRepository.generateNameGenerator()
    }

    /**
     * Generates a new random star system
     * @param position position of the star system
     */
    public async generateStarSystem(position: Coord): Promise<StarSystem> {
        const starSystem = this.create()
        starSystem.position = position
        starSystem.name = this.generateName()
        return this.save(starSystem)
    }

    public async seed(x: number, y: number, z: number) {

    }

    segment(coord: number): [number, number] {
        const low = Math.floor(coord)
        let high = Math.ceil(coord)
        if (high == low)
            high++
        return [low, high]
    }

    /*
    sector(x: number, y:number , z: number): Promise<StarSystem[]> {
        const xSegment = this.segment(x)
        const ySegment = this.segment(y)
        const zSegment = this.segment(z)
        
        return this.repository
            .createQueryBuilder("starSystem")
            .select()
            .andWhere("user.xCoord >= :xMin AND user.xCoord < :xMax", 
                { xMin: xSegment["0"], xMax: xSegment["1"]})
            .andWhere("user.yCoord >= :yMin AND user.yCoord < :yMay", 
                { yMin: ySegment["0"], yMay: ySegment["1"]})
            .andWhere("user.zCoord >= :zMin AND user.zCoord < :zMaz", 
                { zMin: zSegment["0"], zMaz: zSegment["1"]})
            .getMany()
    }
    */

}