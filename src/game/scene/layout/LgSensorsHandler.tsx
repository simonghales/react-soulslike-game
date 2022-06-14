import React, {useEffect, useState} from "react"
import uniqid from "uniqid";
import {useWorld} from "../../../worker/WorldProvider";
import {Box, Vec2} from "planck";
import {COLLISION_FILTER_GROUPS, CollisionTypes} from "../../data/collisions";
import {halve} from "../../../utils/physics";

export type SensorData = {
    id: string,
    sensorId: string,
    x: number,
    y: number,
    w: number,
    h: number,
}

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
                sensorId: sensorId,
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

const LgSensor: React.FC<{
    sensorId: string,
    x: number,
    y: number,
    w: number,
    h: number,
}> = ({sensorId, x, y, w, h}) => {

    const [id] = useState(() => uniqid())

    useSensorBody(x, y, w, h, sensorId)

    return null
}

export const LgSensorsHandler: React.FC<{
    sensors: SensorData[],
}> = ({sensors}) => {
    return (
        <>
            {
                sensors.map(sensor => (
                    <LgSensor {...sensor} key={sensor.id}/>
                ))
            }
        </>
    )
}
