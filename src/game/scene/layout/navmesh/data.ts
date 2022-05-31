
type PolygonDataPoint = {
    x: number,
    y: number,
}

export type PolygonData = [PolygonDataPoint, PolygonDataPoint, PolygonDataPoint, PolygonDataPoint]

const generatePolygon = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): PolygonData => {
    return [
        {
            x: x1,
            y: y1,
        },
        {
            x: x2,
            y: y2,
        },
        {
            x: x3,
            y: y3,
        },
        {
            x: x4,
            y: y4,
        },
    ]
}

const generatePolygonFromRectangle = (x: number, y: number, w: number, h: number) => {

    const left = x - (w / 2)
    const top = y + (h / 2)
    const right = x + (w / 2)
    const bottom = y - (h / 2)

    return generatePolygon(left, top, right, top, right, bottom, left, bottom)

}

export const navMeshData = {
    polygons: [
        // generatePolygon(-1, -1, -1, 1, 1, 1, 1, -1),
        generatePolygonFromRectangle(0, 1.25, 21, 1.5),
        // generatePolygonFromRectangle(6.5, 1.25, 9, 2),
        // generatePolygonFromRectangle(-6.5, 1.25, 9, 2),
        generatePolygonFromRectangle(0, -5, 3, 11),
        // generatePolygonFromRectangle(-1.5, -5.5, 1, 11),
        // generatePolygonFromRectangle(1.5, -5.5, 1, 11),
        generatePolygonFromRectangle(0, 7.75, 21, 11.5),
        // generatePolygonFromRectangle(-7, 0, 10, 0.5),
        // generatePolygonFromRectangle(7, 0, 10, 0.5),
    ],
}
