import React, {useCallback, useEffect, useRef, useState} from "react"
import {AttackGoalSubGoal, AttackGoalSubGoalTypes, CollisionsState, MainGoal, MainGoalTypes} from "./types";
import {useMobBrainContext} from "../mobBrainContext";
import {lerp} from "three/src/math/MathUtils";
import random from "canvas-sketch-util/random";
import {MoveGoalHandler} from "./MoveGoalHandler";
import {CollisionTypes, PlayerRangeCollisionTypes} from "../../data/collisions";
import {FollowGoalHandler} from "./FollowGoalHandler";
import {CombatHandler} from "./CombatHandler";
import {GoalHandlerContext} from "./GoalHandlerContext";
import {useLgMobContext} from "../LgMobContext";
import {useWorld} from "../../../worker/WorldProvider";
import {GoalType} from "../types";
import {useIsPlayerInsideSensor} from "../../state/backend/player";

export const useMobBrainGoalHandler = () => {

    const [goal, setGoal] = useState({
        type: MainGoalTypes.IDLE,
        time: Date.now()
    } as MainGoal)
    const [subGoal, setSubGoal] = useState({
        type: AttackGoalSubGoalTypes.IDLE_INITIAL,
        time: Date.now()
    } as AttackGoalSubGoal)

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
    type: string,
    setSubGoal: any,
}> = ({type, setSubGoal}) => {

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
            let delay = lerp(delayRange[0], delayRange[1], randomSeed)
            if (type === AttackGoalSubGoalTypes.IDLE_INITIAL) {
                delay = delay / 2
            }
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

    const {subGoal, setSubGoal} = useMobBrainContext()

    return (
        <GoalHandlerContext.Provider value={{
            subGoal,
            setSubGoal,
        }}>
            {
                (subGoal.type === AttackGoalSubGoalTypes.IDLE || subGoal.type === AttackGoalSubGoalTypes.IDLE_INITIAL) && (
                    <IdleGoalHandler type={subGoal.type} setSubGoal={setSubGoal}/>
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

const useAggroHandler = () => {

    const {
        collisionsState,
        body,
        targetBody,
        damageRecentlyTaken,
        setGoal,
    } = useMobBrainContext()

    const playerInDangerZone = useIsPlayerInsideSensor('room')

    const outOfRange = !collisionsState.isInExtraLargeCombatRange
    const inAwakeRange = collisionsState.isInMediumCombatRange
    const inCloseRange = collisionsState.isInSmallCombatRange

    const [isAggro, setIsAggro] = useState(false)
    const [inAwakeRangeAwhile, setInAwakeRangeAwhile] = useState(false)
    const potentiallyAggro = inAwakeRangeAwhile || damageRecentlyTaken || playerInDangerZone

    const enableInAwakeRangeAwhile = inAwakeRange && !inAwakeRangeAwhile

    useEffect(() => {
        if (!isAggro) return
        setGoal({
            type: MainGoalTypes.ATTACK,
            time: Date.now(),
        })
        return () => {
            setGoal({
                type: MainGoalTypes.IDLE,
                time: Date.now(),
            })
        }
    }, [isAggro])

    useEffect(() => {
        if (inAwakeRange) return
        const timeout = setTimeout(() => {
            setInAwakeRangeAwhile(false)
        }, 500)
        return () => {
            clearTimeout(timeout)
        }
    }, [inAwakeRange])

    useEffect(() => {
        if (!enableInAwakeRangeAwhile) return
        const timeout = setTimeout(() => {
            setInAwakeRangeAwhile(true)
        }, 500)
        return () => {
            clearTimeout(timeout)
        }
    }, [enableInAwakeRangeAwhile])

    const shouldLeaveAggro = !potentiallyAggro && outOfRange && isAggro
    const shouldBecomeAggro = potentiallyAggro && !isAggro

    const world = useWorld()

    useEffect(() => {
        if (!shouldBecomeAggro) return

        const check = () => {

            if (!targetBody) return

            let barrierHit = false

            world.rayCast(body.getPosition(), targetBody.getPosition(), (fixture, point, normal, fraction) => {

                if ((fixture.getUserData() as any)?.collisionType === CollisionTypes.BARRIER) {
                    barrierHit = true
                    return 0
                }

                return 1
            })

            if (barrierHit) {
                return
            }

            setIsAggro(true)

        }

        check()

        const interval = setInterval(check, 1000)

        return () => {
            clearInterval(interval)
        }

    }, [shouldBecomeAggro])

    const [leaveAggroTimeout, setLeaveAggroTimeout] = useState(false)

    useEffect(() => {
        if (!shouldLeaveAggro) {
            setLeaveAggroTimeout(false)
            return
        }

        const timeout = setTimeout(() => {
            setLeaveAggroTimeout(true)
        }, lerp(5000, 10000, Math.random()))

        return () => {
            clearTimeout(timeout)
            setLeaveAggroTimeout(false)
        }
    }, [shouldLeaveAggro])

    const stopAggro = isAggro && leaveAggroTimeout && !inCloseRange

    useEffect(() => {
        if (!stopAggro) return
        setIsAggro(false)
    }, [stopAggro])

}

export const GoalHandler: React.FC = () => {

    const {
        goal,
    } = useMobBrainContext()

    useAggroHandler()

    switch (goal?.type) {
        case MainGoalTypes.IDLE:
            return null
        case MainGoalTypes.ATTACK:
            return <AttackPlayerGoalHandler/>
    }

    return null
}
