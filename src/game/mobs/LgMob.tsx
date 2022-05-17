import React, {useEffect, useMemo, useState} from "react"
import {useWorld} from "../../worker/WorldProvider";
import {SyncComponent, useAddBody, useTransmitData} from "@simonghales/react-three-physics";
import {Body, Box, Circle, Vec2} from "planck";
import {COLLISION_FILTER_GROUPS, MobCollisionTypes} from "../data/collisions";
import {halve} from "../../utils/physics";
import {mobsConfig} from "../data/mobs";
import {componentSyncKeys, getMobSyncKey} from "../data/keys";
import {MobBrain} from "./MobBrain";
import {useMobStatusState} from "./brain/StatusHandler";
import {LgMobContext, useLgMobContext} from "./LgMobContext";
import {MobDeadBody} from "./backend/MobDeadBody";

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

        const circleShape = Circle(0.6)

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

const MobBody: React.FC<{
    id: string,
    x: number,
    y: number,
}> = ({id, x, y}) => {

    const body = useMobBody(id, x, y)

    const {
        setReady,
    } = useLgMobContext()

    const hasBody = !!body

    useEffect(() => {
        if (hasBody) {
            setReady(true)
        }
    }, [hasBody])

    if (!body) return null

    return (
        <>
            <MobBrain id={id} body={body}/>
        </>
    )

}

export const LgMob: React.FC<{
    id: string,
    x: number,
    y: number,
}> = ({id, x, y}) => {

    const {
        damageTaken,
        damageRecentlyTaken,
        onDamage,
        stunned,
        isAlive,
        healthRemaining,
        onDeath,
        deathPosition,
        ready,
        setReady,
    } = useMobStatusState()

    const removeBody = !isAlive && !!deathPosition

    useTransmitData(getMobSyncKey(id), useMemo(() => ({
        isAlive,
        deathPosition: deathPosition ? [deathPosition.x, deathPosition.y] : null,
    }), [isAlive, deathPosition]))

    return (
        <LgMobContext.Provider value={{
            damageTaken,
            damageRecentlyTaken,
            onDamage,
            stunned,
            isAlive,
            healthRemaining,
            onDeath,
            setReady,
        }}>
            {
                !removeBody ? (
                    <MobBody id={id} x={x} y={y}/>
                ) : (
                    <MobDeadBody id={id} x={deathPosition.x} y={deathPosition.y}/>
                )
            }
            {
                ready && (
                    <>
                        <SyncComponent id={id} componentId={componentSyncKeys.basicMob} x={x} y={y}/>
                    </>
                )
            }
        </LgMobContext.Provider>
    )
}
