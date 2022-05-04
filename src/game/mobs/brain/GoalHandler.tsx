import React, {useCallback, useEffect, useRef, useState} from "react"
import {AttackGoalSubGoal, AttackGoalSubGoalTypes, CollisionsState} from "./types";
import {useMobBrainContext} from "../mobBrainContext";
import {lerp} from "three/src/math/MathUtils";
import random from "canvas-sketch-util/random";
import {MoveGoalHandler} from "./MoveGoalHandler";
import {PlayerRangeCollisionTypes} from "../../data/collisions";
import {FollowGoalHandler} from "./FollowGoalHandler";
import {CombatHandler} from "./CombatHandler";
import {GoalHandlerContext} from "./GoalHandlerContext";

export const useMobBrainGoalHandler = () => {

    const [goal, setGoal] = useState(null)
    const [subGoal, setSubGoal] = useState(null)

    return {
        goal,
        setGoal,
        subGoal,
        setSubGoal
    }

}

const getClosestDistance = (collisionsState: CollisionsState) => {
    if (collisionsState.isInSmallCombatRange) {
        return PlayerRangeCollisionTypes.PLAYER_SMALL_COMBAT_RANGE
    }
    if (collisionsState.isInMediumCombatRange) {
        return PlayerRangeCollisionTypes.PLAYER_MEDIUM_COMBAT_RANGE
    }
    if (collisionsState.isInLargeCombatRange) {
        return PlayerRangeCollisionTypes.PLAYER_MEDIUM_COMBAT_RANGE
    }
    if (collisionsState.isInExtraLargeCombatRange) {
        return PlayerRangeCollisionTypes.PLAYER_EXTRA_LARGE_COMBAT_RANGE
    }
    return ''
}

const getClosestDistanceDelayRange = (distance: string) => {
    switch (distance) {
        case PlayerRangeCollisionTypes.PLAYER_SMALL_COMBAT_RANGE:
            return [100, 500]
        case PlayerRangeCollisionTypes.PLAYER_MEDIUM_COMBAT_RANGE:
            return [300, 1000]
        case PlayerRangeCollisionTypes.PLAYER_LARGE_COMBAT_RANGE:
            return [800, 2000]
        case PlayerRangeCollisionTypes.PLAYER_EXTRA_LARGE_COMBAT_RANGE:
            return [1500, 3000]
        default:
            return [2000, 4000]
    }
}

const IdleGoalHandler: React.FC<{
    setSubGoal: any,
}> = ({setSubGoal}) => {

    const {
        collisionsState,
        collisionsStateRef,
    } = useMobBrainContext()

    const localStateRef = useRef({
        randomSeed: 0,
        closestDistance: '',
    })

    const updateSubGoal = useCallback(() => {
        const collisionsState = collisionsStateRef.current as CollisionsState
        const chase = random.chance(collisionsState.isInSmallCombatRange ? 0 : 0.25)
        if (chase) {
            setSubGoal({
                type: AttackGoalSubGoalTypes.FOLLOW,
                time: Date.now(),
            })
        } else {
            setSubGoal({
                type: AttackGoalSubGoalTypes.MOVE,
                time: Date.now(),
            })
        }
    }, [])

    useEffect(() => {

        let timeout: any
        let unmounted = false

        const loop = () => {
            const closestDistance = getClosestDistance(collisionsStateRef.current)
            const delayRange = getClosestDistanceDelayRange(closestDistance)
            const randomSeed = Math.random()
            const delay = lerp(delayRange[0], delayRange[1], randomSeed)
            timeout = setTimeout(() => {
                if (unmounted) return
                updateSubGoal()
                loop()
            }, delay)
        }

        loop()

        return () => {
            unmounted = true
            if (timeout) {
                clearTimeout(timeout)
            }
        }

    }, [])

    return null

}

export type GoalHandlerProps = {
    subGoal: AttackGoalSubGoal,
    setSubGoal: any,
}

const AttackPlayerGoalHandler: React.FC = () => {

    const context = useMobBrainContext()
    const [subGoal, setSubGoal] = useState({
        type: AttackGoalSubGoalTypes.IDLE,
        time: Date.now()
    } as AttackGoalSubGoal)

    useEffect(() => {
        context.setSubGoal(subGoal)
    }, [subGoal])

    return (
        <GoalHandlerContext.Provider value={{
            subGoal,
            setSubGoal,
        }}>
            {
                (subGoal.type === AttackGoalSubGoalTypes.IDLE) && (
                    <IdleGoalHandler setSubGoal={setSubGoal}/>
                )
            }
            {
                (subGoal.type === AttackGoalSubGoalTypes.MOVE) && (
                    <MoveGoalHandler subGoal={subGoal} setSubGoal={setSubGoal}/>
                )
            }
            {
                (subGoal.type === AttackGoalSubGoalTypes.FOLLOW) && (
                    <FollowGoalHandler subGoal={subGoal} setSubGoal={setSubGoal}/>
                )
            }
            <CombatHandler subGoal={subGoal} setSubGoal={setSubGoal}/>
        </GoalHandlerContext.Provider>
    )
}

export const GoalHandler: React.FC = () => {

    return (
        <>
            <AttackPlayerGoalHandler/>
        </>
    )
}
