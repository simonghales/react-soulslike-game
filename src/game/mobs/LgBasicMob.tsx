import React, {useCallback, useEffect, useState} from "react"
import {SyncComponent, useAddBody, useTransmitData} from "react-three-physics";
import {componentSyncKeys, getMobSyncKey} from "../data/keys";
import {useWorld} from "../../worker/WorldProvider";
import {Body, Box, Circle, Vec2} from "planck";
import {COLLISION_FILTER_GROUPS, MobCollisionTypes} from "../data/collisions";
import {MobEvent, MobEventType, useOnMobEvents} from "../events/mobs";
import {setMobDead} from "../state/game";
import {mobsConfig} from "../data/mobs";
import {lerp} from "three/src/math/MathUtils";
import {normalize} from "../../utils/numbers";
import {MobBrain} from "./MobBrain";
import {MobContext} from "./MobContext";
import {halve} from "../../utils/physics";
import {useCollisionsHandler, useCollisionStates} from "./CollisionsHandler";
import {Goal, GoalType} from "./types";

const v2 = new Vec2()

let mobCount = 0

export const LgBasicMob: React.FC<{
    id: string,
    x?: number,
    y?: number,
}> = ({id, x, y}) => {

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
                mobCount: mobCount++,
            }
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

    const [damageTaken, setDamageTaken] = useState(0)

    const [damageCooldown, setDamageCooldown] = useState(0)

    useEffect(() => {
        if (!damageCooldown) return

        const clear = () => {
            setDamageCooldown(0)
        }

        const timeRemaining = damageCooldown - Date.now()

        if (timeRemaining > 0) {
            const timeout = setTimeout(clear, timeRemaining)
            return () => {
                clearTimeout(timeout)
            }
        } else {
            clear()
        }

    }, [damageCooldown])

    const handleDamaged = useCallback((damage: number, currentPosition: Vec2) => {
        setDamageTaken(prev => prev + damage)
        if (!body) return
        v2.set(body.getPosition())
        const xVel = v2.x - currentPosition.x
        const yVel = v2.y - currentPosition.y
        v2.set(xVel, yVel)
        v2.normalize()
        const power = lerp(50, 100, normalize(damage, 12, 2))
        v2.mul(power)
        body.applyLinearImpulse(v2, new Vec2())
        setDamageCooldown(Date.now() + mobsConfig.basic.damageCooldownDuration)
    }, [body])

    const damageLimitReached = damageTaken >= mobsConfig.basic.health

    const healthRemaining = mobsConfig.basic.health - damageTaken

    useEffect(() => {
        if (!damageLimitReached) return
        setMobDead(id)
    }, [damageLimitReached])

    const onMobEvents = useCallback((data: MobEvent) => {
        switch (data.type) {
            case MobEventType.DAMAGED:
                handleDamaged(data.data.damage as number, data.data.currentPosition)
                break;
        }
    }, [handleDamaged])

    const collisions = useCollisionsHandler(id)

    const collisionStates = useCollisionStates(collisions)

    const [attackingState, setAttackingState] = useState(null as null | {
        started: number,
    })

    const [hasAttackToken, setHasAttackToken] = useState(false)

    const [damageZoneActive, setDamageZoneActive] = useState(false)

    const [movementRestricted, setMovementRestricted] = useState(false)

    const [goal, setGoal] = useState({
        type: GoalType.IDLE,
    } as Goal)

    useOnMobEvents(id, onMobEvents)

    useTransmitData(getMobSyncKey(id), {
        healthRemaining,
        attackingState,
        hasAttackToken,
        goal,
    })

    if (!body) {
        return null
    }


    return (
        <MobContext.Provider value={{
            id,
            body,
            collisions,
            collisionStates,
            attackingState,
            setAttackingState,
            damageZoneActive,
            setDamageZoneActive,
            movementRestricted,
            setMovementRestricted,
            damageCooldown,
            setHasAttackToken,
            goal,
            setGoal,
        }}>
            <SyncComponent id={id} componentId={componentSyncKeys.basicMob}/>
            <MobBrain id={id} body={body}/>
        </MobContext.Provider>
    )
}
