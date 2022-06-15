import React, {useEffect, useState} from "react"
import {SyncComponent} from "@simonghales/react-three-physics";
import {componentSyncKeys} from "../../data/keys";
import {useIsPlayerInsideSensors} from "../../state/backend/player";
import {useWorld} from "../../../worker/WorldProvider";
import decomp from "poly-decomp";
import {Polygon, Vec2} from "planck";
import {COLLISION_FILTER_GROUPS, CollisionTypes} from "../../data/collisions";
import {setVisibilityZoneOccluded} from "../../state/backend/scene";

export type PolygonData = {
    x: number,
    y: number,
}

export type VisibilityZoneData = {
    id: string,
    hiddenZones: string[],
    polygons: PolygonData[],
    x: number,
    y: number,
}

const useVisibilityZoneBody = (sensorId: string, data: VisibilityZoneData) => {

    const world = useWorld()

    useEffect(() => {

        const points: [number, number][] = data.polygons.map(point => ([point.x, point.y]))

        decomp.makeCCW(points)

        const convexPolygons = decomp.quickDecomp(points);

        const body = world.createBody({
            type: "static",
            position: new Vec2(data.x, data.y),
            userData: {
                sensorId: sensorId,
                collisionType: CollisionTypes.VISIBILITY_SENSOR,
            },
        })

        convexPolygons.forEach((polygon: [number, number][], index: number) => {
            const shape = Polygon(polygon.map(vertix => Vec2(vertix[0], vertix[1])))
            body.createFixture({
                isSensor: true,
                shape: shape,
                filterMaskBits: COLLISION_FILTER_GROUPS.npcs,
                filterCategoryBits: COLLISION_FILTER_GROUPS.environment,
                userData: {
                    collisionId: `${sensorId}--${index}`,
                    collisionType: CollisionTypes.VISIBILITY_SENSOR,
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

const LgVisibilityZone: React.FC<{
    data: VisibilityZoneData,
}> = ({data}) => {

    const sensorId = data.id

    useVisibilityZoneBody(sensorId, data)

    const isHidden = useIsPlayerInsideSensors(data.hiddenZones)
    const occluded = !isHidden

    const [previouslyVisible, setPreviouslyVisible] = useState(isHidden)

    useEffect(() => {
        setVisibilityZoneOccluded(sensorId, occluded)
        if (!occluded) {
            setPreviouslyVisible(true)
        }
    }, [occluded])

    const partiallyVisible = previouslyVisible && occluded

    return (
        <SyncComponent partiallyVisible={partiallyVisible} isHidden={isHidden} data={data} id={data.id} componentId={componentSyncKeys.visibilityZone}/>
    )
}

export const LgVisibilityZonesHandler: React.FC<{
    data: VisibilityZoneData[],
}> = ({data}) => {

    return (
        <>
            {
                data.map(zone => (
                    <LgVisibilityZone data={zone} key={zone.id}/>
                ))
            }
        </>
    )
}
