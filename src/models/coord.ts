import {Column} from "typeorm"
const pd = require("probability-distributions")

export default class Coord {

    public constructor(x?: number, y?: number, z?: number) {
        x = x && x || 0
        y = y && y || 0
        z = z && z || 0

        this.x = x, this.y = y, this.z = z
    }

    @Column("real")
    x: number

    @Column("real")
    y: number

    @Column("real")
    z: number

    public static multiply(coord: Coord, factor: number): Coord {
        return new Coord(coord.x * factor, coord.y * factor, coord.z * factor)
    }

    public static add(a: Coord, b: Coord): Coord {
        return new Coord(a.x + b.x, a.y + b.y, a.z + b.z)
    }

    public static randomUnitSphere(): Coord {
        const base = pd.rnorm(3)
        const m = 1 / Math.sqrt(Math.pow(base[0], 2) + Math.pow(base[1], 2) + Math.pow(base[2], 2))
        const result = new Coord(base[0] * m, base[1] * m, base[2] * m)
        return result
    }
}