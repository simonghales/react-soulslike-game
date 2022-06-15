import React, {useEffect, useMemo, useState} from "react"
import {useWorld} from "../../worker/WorldProvider";
import {SyncComponent, useAddBody, useTransmitData} from "@simonghales/react-three-physics";
import {Body, Box, Circle, Vec2} from "planck";
import {COLLISION_FILTER_GROUPS, MobCollisionTypes} from "../data/collisions";
import {halve} from "../../utils/physics";
import {getMobConfig} from "../data/mobs";
import {componentSyncKeys, getMobSyncKey} from "../data/keys";
import {MobBrain} from "./MobBrain";
import {useMobStatusState} from "./brain/StatusHandler";
import {LgMobContext, useLgMobContext} from "./LgMobContext";
import {MobType} from "../state/game";

const mobBodyConfig = {
    [MobType.BASIC_RAT]: {
        bodyShape: Circle(0.6),
        attackRangeShape: Box(halve(getMobConfig(MobType.BASIC_RAT).sensors.attackRange.w),halve(getMobConfig(MobType.BASIC_RAT).sensors.attackRange.h), new Vec2(getMobConfig(MobType.BASIC_RAT).sensors.attackRange.x, 0)),
        attackBoxShape: Box(halve(getMobConfig(MobType.BASIC_RAT).sensors.attack.w),halve(getMobConfig(MobType.BASIC_RAT).sensors.attack.h), new Vec2(getMobConfig(MobType.BASIC_RAT).sensors.attack.x, 0)),
    },
    [MobType.LARGE_RAT]: {
        bodyShape: Circle(1),
        attackRangeShape: Box(halve(getMobConfig(MobType.LARGE_RAT).sensors.attackRange.w),halve(getMobConfig(MobType.LARGE_RAT).sensors.attackRange.h), new Vec2(getMobConfig(MobType.LARGE_RAT).sensors.attackRange.x, 0)),
        attackBoxShape: Box(halve(getMobConfig(MobType.LARGE_RAT).sensors.attack.w),halve(getMobConfig(MobType.LARGE_RAT).sensors.attack.h), new Vec2(getMobConfig(MobType.LARGE_RAT).sensors.attack.x, 0)),
    },
}

export const useMobBody = (id: string, x: number, y: number, type: MobType) => {

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
            userData: {
                mobType: type,
            }
        })

        body.setPosition(new Vec2(x, y))

        const config = mobBodyConfig[type]

        if (!config) {
            throw new Error(`No mob config found for type ${type}`)
        }

        const fixture = body.createFixture({
            shape: config.bodyShape,
            filterCategoryBits: COLLISION_FILTER_GROUPS.npcs,
            filterMaskBits: COLLISION_FILTER_GROUPS.player | COLLISION_FILTER_GROUPS.playerRange | COLLISION_FILTER_GROUPS.npcs | COLLISION_FILTER_GROUPS.environment,
            density: 10,
            userData: {
                collisionId: id,
                collisionType: MobCollisionTypes.BODY,
            }
        })

        const attackRangeFixture = body.createFixture({
            shape: config.attackRangeShape,
            isSensor: true,
            filterCategoryBits: COLLISION_FILTER_GROUPS.npcs,
            filterMaskBits: COLLISION_FILTER_GROUPS.player,
            userData: {
                collisionId: id,
                collisionType: MobCollisionTypes.ATTACK_RANGE,
            },
        })

        const attackBoxFixture = body.createFixture({
            shape: config.attackBoxShape,
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


    const {
        setReady,
        type,
    } = useLgMobContext()

    const body = useMobBody(id, x, y, type)

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

const MobCore: React.FC<{
    id: string,
    x: number,
    y: number,
    type?: MobType,
}> = ({id, x, y, type = MobType.BASIC_RAT}) => {

    const [startingPosition] = useState({
        x,
        y,
    })

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
    } = useMobStatusState(id, type)

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
            type,
            startingPosition,
        }}>
            {
                !removeBody && (
                    <MobBody id={id} x={x} y={y}/>
                )
            }
            {
                ready && (
                    <>
                        <SyncComponent id={id} componentId={componentSyncKeys.basicMob} type={type} x={x} y={y}/>
                    </>
                )
            }
        </LgMobContext.Provider>
    )

}

const BasicMob: React.FC<{
    id: string,
    x: number,
    y: number,
}> = ({id, x, y}) => {

    return <MobCore id={id} x={x} y={y}/>

}

const LargeMob: React.FC<{
    id: string,
    x: number,
    y: number,
}> = ({id, x, y}) => {

    return <MobCore id={id} x={x} y={y} type={MobType.LARGE_RAT}/>

}

export const LgMob: React.FC<{
    id: string,
    x: number,
    y: number,
    type: MobType,
}> = ({id, x, y, type}) => {

    switch (type) {
        case MobType.BASIC_RAT:
            return <BasicMob id={id} x={x} y={y}/>
        case MobType.LARGE_RAT:
            return <LargeMob id={id} x={x} y={y}/>
    }

    return null

}
