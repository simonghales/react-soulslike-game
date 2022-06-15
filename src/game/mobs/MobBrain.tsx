import React, {useCallback, useEffect, useMemo, useRef, useState} from "react"
import {Body, Vec2} from "planck";
import {MobBrainContext} from "./mobBrainContext";
import {MovementHandler} from "./brain/MovementHandler";
import {GoalHandler, useMobBrainGoalHandler} from "./brain/GoalHandler";
import {CollisionsHandler} from "./brain/CollisionsHandler";
import {AttackState, CollisionsState} from "./brain/types";
import {useGetBody} from "../state/bodies";
import {useEffectRef} from "../../utils/hooks";
import {useTransmitData} from "@simonghales/react-three-physics";
import {useMobsGroupContext} from "./MobsGroupHandler";
import {EventsHandler} from "./brain/EventsHandler";
import {StatusHandler, useMobStatusState} from "./brain/StatusHandler";
import {useLgMobContext} from "./LgMobContext";
import {DamageHandler} from "./brain/DamageHandler";
import {useIsSelectedTarget} from "../state/backend/player";
import {getMobDebugSyncKey, getMobStateSyncKey} from "../data/keys";
import {getNavMeshPath} from "../scene/layout/navmesh/handler";
import {useIsEntityVisible} from "../state/backend/scene";

const useMovementControls = (body: Body) => {

    const movementStateRef = useRef({
        targetPosition: null as null | Vec2,
        finalDestination: null as null | Vec2,
        remainingMovementPath: [] as any[],
        lastMovementGoal: 0,
        lockedTarget: false,
    })

    // const [movementPath, setMovementPath] = useState([] as any[])
    // const [currentTargetPosition, setCurrentTargetPosition] = useState(null as null | Vec2)

    const setTargetPosition = useCallback((position: Vec2) => {
        if (!movementStateRef.current.targetPosition) {
            movementStateRef.current.targetPosition = new Vec2(position)
            return
        }
        movementStateRef.current.targetPosition.set(position)
    }, [])

    const updateTargetPosition = useCallback((position: null | Vec2) => {

        // setCurrentTargetPosition(position)

        movementStateRef.current.remainingMovementPath.length = 0
        if (!position) {
            movementStateRef.current.targetPosition = null
            movementStateRef.current.finalDestination = null
            // setMovementPath([])
            return null
        }

        if (!movementStateRef.current.finalDestination) {
            movementStateRef.current.finalDestination = new Vec2(position)
        } else {
            movementStateRef.current.finalDestination.set(position)
        }

        const path = getNavMeshPath(body.getPosition().x, body.getPosition().y, position.x, position.y)

        if (path) {
            // console.log('setMovementPath', path)
            // setMovementPath(path)
        } else {
            // setMovementPath([])
        }

        if (!path || path.length <= 2) {
            if (!path) {
                console.warn('no path returned')
                return null
            }
            setTargetPosition(position)
            return path[path.length - 1]
        }

        const firstStep = path.shift()

        if (!firstStep) return null


        setTargetPosition(new Vec2(firstStep.x, firstStep.y))

        // console.log('remainingMovementPath', path)

        movementStateRef.current.remainingMovementPath = path

        return path[path.length - 1]

    }, [])

    const nextStepInPath = useCallback(() => {
        // console.log('go to next step!')
        const nextStep = movementStateRef.current.remainingMovementPath.shift()
        if (!nextStep) return
        setTargetPosition(new Vec2(nextStep.x, nextStep.y))
    }, [])

    return {
        movementStateRef,
        updateTargetPosition,
        nextStepInPath,
        // currentTargetPosition,
        // movementPath,
    }

}

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
        collidedSensors: [],
        visibilitySensors: [],
    })

    const collisionsStateRef = useEffectRef(collisionsState)

    const [attackState, setAttackState] = useState(null as null | AttackState)

    const attackStateRef = useEffectRef(attackState)

    const {
        movementStateRef,
        updateTargetPosition,
        nextStepInPath,
        // currentTargetPosition,
        // movementPath,
    } = useMovementControls(body)

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

    useTransmitData(getMobDebugSyncKey(id), debugData)

    const {
        goal,
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

    const isSelectedTarget = useIsSelectedTarget(id)

    const visible = useIsEntityVisible(collisionsState.visibilitySensors)

    useTransmitData(getMobStateSyncKey(id), useMemo(() => {
        return {
            attackState,
            goal,
            subGoal,
            healthRemaining,
            isAlive,
            isSelectedTarget,
            visible,
            // currentTargetPosition: currentTargetPosition ? [currentTargetPosition.x, currentTargetPosition.y] : null,
            // movementPath,
        }
    }, [attackState, goal, subGoal, healthRemaining, isAlive, isSelectedTarget, visible]))

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
            updateTargetPosition,
            nextStepInPath,
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
                                <>
                                    <MovementHandler/>
                                </>
                            )
                        }
                    </>
                )
            }
        </MobBrainContext.Provider>
    )
}
