import React, {useEffect, useState} from "react"
import {useWorld} from "../../../worker/WorldProvider";
import {Box, Vec2} from "planck";
import {halve} from "../../../utils/physics";
import {COLLISION_FILTER_GROUPS, CollisionTypes} from "../../data/collisions";
import uniqid from "uniqid";
import {SyncComponent} from "@simonghales/react-three-physics";
import {componentSyncKeys} from "../../data/keys";

const useSensorBody = (
    x: number,
    y: number,
    w: number,
    h: number,
    sensorId: string
) => {

    const world = useWorld()

    useEffect(() => {

        const body = world.createBody({
            type: "static",
            position: new Vec2(x, y),
            userData: {
                collisionType: CollisionTypes.SENSOR,
            },
        })

        body.createFixture({
            isSensor: true,
            shape: Box(halve(w), halve(h)),
            filterMaskBits: COLLISION_FILTER_GROUPS.player | COLLISION_FILTER_GROUPS.npcs,
            filterCategoryBits: COLLISION_FILTER_GROUPS.environment,
            userData: {
                collisionId: sensorId,
                collisionType: CollisionTypes.SENSOR,
            }
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

export const LgSensor: React.FC<{
    x: number,
    y: number,
    w: number,
    h: number,
    sensorId: string,
}> = ({x, y, w, h, sensorId}) => {

    const [id] = useState(() => uniqid())

    useSensorBody(x, y, w, h, sensorId)

    return (
        <SyncComponent data={{
            x,
            y,
            w,
            h,
        }} id={`sensor-${id}`} isSensor componentId={componentSyncKeys.wall}/>
    )

}
