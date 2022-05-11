import React, {useEffect, useMemo, useRef, useState} from "react"
import {Body, Vec2} from "planck";
import {MobBrainContext} from "./mobBrainContext";
import {MovementHandler} from "./brain/MovementHandler";
import {GoalHandler, useMobBrainGoalHandler} from "./brain/GoalHandler";
import {CollisionsHandler} from "./brain/CollisionsHandler";
import {AttackState, CollisionsState} from "./brain/types";
import {useGetBody} from "../state/bodies";
import {useEffectRef} from "../../utils/hooks";
import {useTransmitData} from "react-three-physics";
import {useMobsGroupContext} from "./MobsGroupHandler";
import {EventsHandler} from "./brain/EventsHandler";
import {StatusHandler, useMobStatusState} from "./brain/StatusHandler";
import {useLgMobContext} from "./LgMobContext";
import {DamageHandler} from "./brain/DamageHandler";

export const MobBrain: React.FC<{
    id: string,
    body: Body,
}> = ({id, body}) => {

    const goalHandler = useMobBrainGoalHandler()
    const [collisionsState, setCollisionsState] = useState<CollisionsState>({
        enemiesInAttackRange: false,
        isInExtraLargeCombatRange: false,
        isInLargeCombatRange: false,
        isInSmallCombatRange: false,
        isInExtraSmallCombatRange: false,
        isInMediumCombatRange: false,
        attackRangeEnemies: [],
    })

    const collisionsStateRef = useEffectRef(collisionsState)

    const [attackState, setAttackState] = useState(null as null | AttackState)

    const attackStateRef = useEffectRef(attackState)

    const movementStateRef = useRef({
        targetPosition: null as null | Vec2,
        lastMovementGoal: 0,
        lockedTarget: false,
    })

    const targetBody = useGetBody('player')
    const targetBodyRef = useEffectRef(targetBody)
    const [debugData, setDebugData] = useState({} as any)
    const [running, setRunning] = useState(false)
    const [preventMovement, setPreventMovement] = useState(false)
    const [speedLimit, setSpeedLimit] = useState(null as null | number)

    const {
        positionTokens,
    } = useMobsGroupContext()

    const positionToken = positionTokens[id] ?? ''

    useTransmitData(`mob--${id}`, debugData)

    const {
        subGoal,
    } = goalHandler

    const {
        damageTaken,
        damageRecentlyTaken,
        onDamage,
        stunned,
        isAlive,
        healthRemaining,
        onDeath,
    } = useLgMobContext()

    useTransmitData(`mob--${id}-state`, useMemo(() => {
        return {
            attackState,
            subGoal,
            healthRemaining,
            isAlive,
        }
    }, [attackState, subGoal, healthRemaining, isAlive]))

    const bodyRef = useEffectRef(body)

    useEffect(() => {
        if (!isAlive) {
            return
        }
        return () => {
            onDeath(bodyRef.current)
        }
    }, [isAlive])

    return (
        <MobBrainContext.Provider value={{
            id,
            body,
            collisionsState,
            setCollisionsState,
            targetBody,
            targetBodyRef,
            movementStateRef,
            setDebugData,
            running,
            setRunning,
            collisionsStateRef,
            preventMovement,
            setPreventMovement,
            speedLimit,
            setSpeedLimit,
            setAttackState,
            attackState,
            attackStateRef,
            positionToken,
            onDamage,
            damageRecentlyTaken,
            stunned,
            ...goalHandler,
        }}>
            {
                isAlive && (
                    <>
                        <CollisionsHandler/>
                        <GoalHandler/>
                        <EventsHandler/>
                        <StatusHandler/>
                        {
                            !stunned && (
                                <MovementHandler/>
                            )
                        }
                    </>
                )
            }
        </MobBrainContext.Provider>
    )
}
