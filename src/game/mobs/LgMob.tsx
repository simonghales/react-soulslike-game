import React, {useEffect, useState} from "react"
import {useWorld} from "../../worker/WorldProvider";
import {SyncComponent, useAddBody} from "react-three-physics";
import {Body, Box, Circle, Vec2} from "planck";
import {COLLISION_FILTER_GROUPS, MobCollisionTypes} from "../data/collisions";
import {halve} from "../../utils/physics";
import {mobsConfig} from "../data/mobs";
import {componentSyncKeys} from "../data/keys";
import {MobBrain} from "./MobBrain";

export const useMobBody = (id: string, x: number, y: number) => {

    const world = useWorld()

    const addBody = useAddBody()
    const [body, setBody] = useState<null | Body>(null)

    useEffect(() => {
        const body = world.createBody({
            type: "dynamic",
            linearDamping: 40,
            angularDamping: 0.1,
            allowSleep: false,
            fixedRotation: true,
        })

        body.setPosition(new Vec2(x ?? 2, y ?? 2))

        const circleShape = Circle(0.5)

        const fixture = body.createFixture({
            shape: circleShape,
            filterCategoryBits: COLLISION_FILTER_GROUPS.npcs,
            filterMaskBits: COLLISION_FILTER_GROUPS.player | COLLISION_FILTER_GROUPS.playerRange | COLLISION_FILTER_GROUPS.npcs,
            density: 10,
            userData: {
                collisionId: id,
                collisionType: MobCollisionTypes.BODY,
            }
        })

        const attackRangeFixture = body.createFixture({
            shape: Box(halve(mobsConfig.basic.sensors.attackRange.w),halve(mobsConfig.basic.sensors.attackRange.h), new Vec2(mobsConfig.basic.sensors.attackRange.x, 0)),
            isSensor: true,
            filterCategoryBits: COLLISION_FILTER_GROUPS.npcs,
            filterMaskBits: COLLISION_FILTER_GROUPS.player,
            userData: {
                collisionId: id,
                collisionType: MobCollisionTypes.ATTACK_RANGE,
            },
        })

        const attackBoxFixture = body.createFixture({
            shape: Box(halve(mobsConfig.basic.sensors.attack.w),halve(mobsConfig.basic.sensors.attack.h), new Vec2(mobsConfig.basic.sensors.attack.x, 0)),
            isSensor: true,
            filterCategoryBits: COLLISION_FILTER_GROUPS.npcs,
            filterMaskBits: COLLISION_FILTER_GROUPS.player,
            userData: {
                collisionId: id,
                collisionType: MobCollisionTypes.ATTACK_BOX,
            },
        })

        setBody(body)

        const unsub = addBody(id, body)

        return () => {
            world.destroyBody(body)
            unsub()
        }
    }, [])

    return body

}

export const LgMob: React.FC<{
    id: string,
    x: number,
    y: number,
}> = ({id, x, y}) => {

    const body = useMobBody(id, x, y)

    if (!body) return null

    return (
        <>
            <SyncComponent id={id} componentId={componentSyncKeys.basicMob}/>
            <MobBrain id={id} body={body}/>
        </>
    )
}
