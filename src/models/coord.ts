import {Column} from "typeorm"
const pd = require("probability-distributions")

export default class Coord {

    public constructor(x?: number, y?: number, z?: number) {
        x = x && x || 0
        y = y && y || 0
        z = z && z || 0

        this.x = 0, this.y = 0, this.z = 0
    }

    @Column()
    x: number

    @Column()
    y: number

    @Column()
    z: number

    public multiply(factor: number): Coord {
        return new Coord(this.x * factor, this.y * factor, this.z * factor)
    }

    public static randomUnitSphere(): Coord {
        const base = pd.rnorm(3)
        const m = 1 / Math.sqrt(Math.pow(base[0], 2) + Math.pow(base[1], 2) + Math.pow(base[2], 2))
        return new Coord(base[0] * m, base[1] * m, base[2] * m)
    }
}