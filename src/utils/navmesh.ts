type PointLike = any

export default class NavmeshVector2 {
    public x: number;
    public y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    public equals(v: PointLike) {
        return this.x === v.x && this.y === v.y;
    }

    public angle(v: PointLike) {
        return Math.atan2(v.y - this.y, v.x - this.x);
    }

    public distance(v: PointLike) {
        const dx = v.x - this.x;
        const dy = v.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    public add(v: PointLike) {
        this.x += v.x;
        this.y += v.y;
    }

    public subtract(v: PointLike) {
        this.x -= v.x;
        this.y -= v.y;
    }

    public clone() {
        return new NavmeshVector2(this.x, this.y);
    }
}
