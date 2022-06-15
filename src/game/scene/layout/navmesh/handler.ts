import {NavMesh} from "navmesh";
import {generatePolygonFromRectangle, navMeshData, PolygonData} from "./data";
import {Vec2} from "planck";
import NavmeshVector2 from "../../../../utils/navmesh";
import {PolyPoints} from "navmesh/src/common-types";
import uniqid from "uniqid";

export type NavMeshPath = {
    x: number,
    y: number,
}[]

class NavMeshHandler {

    navMesh: NavMesh

    polygons: Record<string, PolygonData> = {}

    getPolygonMeshPoints() {
        return Object.values(this.polygons)
    }

    constructor() {
        this.navMesh = new NavMesh(this.getPolygonMeshPoints())
    }

    updateNavMesh() {
        this.navMesh = new NavMesh(this.getPolygonMeshPoints())
    }

    setPolygons(data: any[]) {
        const polygons: Record<string, PolygonData> = {}
        data.forEach((entry) => {
            polygons[entry.id] = generatePolygonFromRectangle(entry.x, entry.y, entry.w, entry.h)
        })
        this.polygons = polygons
        this.updateNavMesh()
    }

    addPolygon(x: number, y: number, w: number, h: number) {
        const id = uniqid()
        this.polygons[id] = generatePolygonFromRectangle(x, y, w, h)
        this.updateNavMesh()
        return id
    }

    removePolygon(id: string) {
        delete this.polygons[id]
        this.updateNavMesh()
    }

    getPath(fromX: number, fromY: number, toX: number, toY: number): null | NavMeshPath {
        return this.navMesh.findPath({x: fromX, y: fromY}, {x: toX, y: toY});
    }

}

export const globalNavMeshHandler = new NavMeshHandler()

const DIAGONAL = 0.7071067811865475

const directionalOffsets = [
    [0, 1], // north
    [DIAGONAL, DIAGONAL], // north-east
    [1, 0], // east
    [DIAGONAL, -DIAGONAL], // south-east
    [0, -1], // south
    [-DIAGONAL, -DIAGONAL], // south-west
    [-1, 0], // west
    [-DIAGONAL, DIAGONAL], // north-west
]

const distanceOffsets = [
    0.5,
    1,
    2.5,
]

const v2 = new Vec2()
const toV2 = new Vec2()

const tryNavMeshPath = (fromX: number, fromY: number, toX: number, toY: number) => {

    for (let distanceI = 0, distanceLen = distanceOffsets.length; distanceI < distanceLen; distanceI++) {

        const distance = distanceOffsets[distanceI]

        for (let directionI = 0, directionLen = directionalOffsets.length; directionI < directionLen; directionI++) {

            const direction = directionalOffsets[directionI]

            v2.set(direction[0], direction[1])
            v2.mul(distance)
            toV2.set(toX, toY)
            toV2.add(v2)

            // todo ... use findClosestMeshPoint

            const path = globalNavMeshHandler.getPath(fromX, fromY, toV2.x, toV2.y)

            if (path) {
                console.log('valid path found...')
                return path
            }

        }

    }

    return null

}

const startPoint = new NavmeshVector2()

const endPoint = new NavmeshVector2()

export const isNavMeshPointValid = (x: number, y: number) =>{
    startPoint.x = x
    startPoint.y = y
    return globalNavMeshHandler.navMesh.isPointInMesh(startPoint)
}

export const getNavMeshPath = (fromX: number, fromY: number, toX: number, toY: number) => {

    startPoint.x = fromX
    startPoint.y = fromY
    endPoint.x = toX
    endPoint.y = toY

    const startingPoint = globalNavMeshHandler.navMesh.findClosestMeshPoint(startPoint as any, 3)
    const endingPoint = globalNavMeshHandler.navMesh.findClosestMeshPoint(endPoint as any, 3)

    if (!startingPoint.point || !endingPoint.point) {
        console.log('no starting point or ending point')
        return null
    }

    const path = globalNavMeshHandler.getPath(startingPoint.point.x, startingPoint.point.y, endingPoint.point.x, endingPoint.point.y)

    if (path && (fromX !== startingPoint.point.x || fromY !== startingPoint.point.y)) {
        path.unshift({
            x: fromX,
            y: fromY,
        })
    }

    // console.log('generated path...', path)

    return path

}

