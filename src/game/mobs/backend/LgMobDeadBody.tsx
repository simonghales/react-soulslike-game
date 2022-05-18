import React, {useEffect, useState} from "react"
import {componentSyncKeys} from "../../data/keys";
import {SyncComponent, useAddBody} from "@simonghales/react-three-physics";
import {useWorld} from "../../../worker/WorldProvider";
import {Body, Circle, Vec2} from "planck";
import {COLLISION_FILTER_GROUPS, MobCollisionTypes} from "../../data/collisions";

const useMobDeadBody = (id: string, x: number, y: number) => {

    const world = useWorld()
    const addBody = useAddBody()

    const [body, setBody] = useState(null as null | Body)

    useEffect(() => {

        const body = world.createBody({
            type: "dynamic",
            linearDamping: 160,
            angularDamping: 0.1,
            allowSleep: true,
            fixedRotation: true,
        })

        body.setPosition(new Vec2(x, y))

        const circleShape = Circle(0.025)

        const fixture = body.createFixture({
            shape: circleShape,
            density: 200,
            filterMaskBits: COLLISION_FILTER_GROUPS.player | COLLISION_FILTER_GROUPS.npcs,
        })

        setBody(body)

        const unsub = addBody(id, body)

        return () => {
            unsub()
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

    return body

}

export const LgMobDeadBody: React.FC<{
    id: string,
    x: number,
    y: number,
}> = ({id, x, y}) => {

    const body = useMobDeadBody(id, x, y)

    if (!body) return null

    return (
        <>
            <SyncComponent id={id} componentId={componentSyncKeys.basicMobDead} x={x} y={y}/>
        </>
    )
}
