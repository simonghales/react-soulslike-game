import React, {useEffect} from "react"
import decomp from "poly-decomp"
import {PolygonData} from "./LgVisibilityZonesHandler";
import {useWorld} from "../../../worker/WorldProvider";
import {Box, Polygon, Vec2} from "planck";
import {COLLISION_FILTER_GROUPS, CollisionTypes} from "../../data/collisions";
import {halve} from "../../../utils/physics";

export type SensorZoneData = {
    id: string,
    sensorId: string,
    polygons: PolygonData[],
    x: number,
    y: number,
}

export const useSensorZoneBody = (data: SensorZoneData) => {

    const world = useWorld()

    useEffect(() => {

        const points: [number, number][] = data.polygons.map(point => ([point.x, point.y]))

        decomp.makeCCW(points)

        const convexPolygons = decomp.quickDecomp(points);

        const body = world.createBody({
            type: "static",
            position: new Vec2(data.x, data.y),
            userData: {
                sensorId: data.sensorId,
                collisionType: CollisionTypes.SENSOR,
            },
        })

        convexPolygons.forEach((polygon: [number, number][], index: number) => {
            const shape = Polygon(polygon.map(vertix => Vec2(vertix[0], vertix[1])))
            body.createFixture({
                isSensor: true,
                shape: shape,
                filterMaskBits: COLLISION_FILTER_GROUPS.player | COLLISION_FILTER_GROUPS.npcs,
                filterCategoryBits: COLLISION_FILTER_GROUPS.environment,
                userData: {
                    collisionId: `${data.sensorId}--${index}`,
                    collisionType: CollisionTypes.SENSOR,
                }
            })
        })



        return () => {
            const cleanup = () => {
                if (world.isLocked()) {
                    throw new Error('World is still locked, failed to remove body.')
                }
                world.destroyBody(body)
            }
            if (world.isLocked()) {
                setTimeout(cleanup, 0)
            } else {
                cleanup()
            }

        }
    }, [])

}

export const LgSensorZone: React.FC<{
    data: SensorZoneData,
}> = ({data}) => {

    useSensorZoneBody(data)

    return null
}

export const LgSensorZonesHandler: React.FC<{
    zones: SensorZoneData[],
}> = ({zones}) => {
    return (
        <>
            {
                zones.map(zone => (
                    <LgSensorZone data={zone} key={zone.id}/>
                ))
            }
        </>
    )
}
