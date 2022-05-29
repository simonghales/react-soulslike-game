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
import {IdleGoalHandler} from "./IdleGoalHandler";
import {Vec2} from "planck";
import {normalize} from "../../../utils/numbers";

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

const AttackIdleGoalHandler: React.FC<{
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
                    <AttackIdleGoalHandler type={subGoal.type} setSubGoal={setSubGoal}/>
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

const v2 = new Vec2()

const useAggroHandler = () => {

    const {
        id,
        collisionsState,
        body,
        targetBody,
        damageRecentlyTaken,
        setGoal,
    } = useMobBrainContext()

    const playerInDangerZone = useIsPlayerInsideSensor('room')

    const outOfRange = !collisionsState.isInLargeCombatRange
    const inAwakeRange = collisionsState.isInMediumCombatRange
    const inCloseRange = collisionsState.isInSmallCombatRange

    const isAtHome = collisionsState.collidedSensors.includes('room')

    const [isAggro, setIsAggro] = useState(false)
    const [inAwakeRangeAwhile, setInAwakeRangeAwhile] = useState(false)
    const [recentlyBecameAggroCooldown, setRecentlyBecameAggroCooldown] = useState(0)
    const [recentlyLeftAggroCooldown, setRecentlyLeftAggroCooldown] = useState(0)

    const potentiallyAggro = ((inAwakeRangeAwhile && inAwakeRange) && !recentlyLeftAggroCooldown) || inCloseRange || damageRecentlyTaken || playerInDangerZone
    const shouldLeaveAggro = !potentiallyAggro && outOfRange && isAggro && !recentlyBecameAggroCooldown
    const shouldBecomeAggro = !isAggro && potentiallyAggro && !shouldLeaveAggro

    const enableInAwakeRangeAwhile = inAwakeRange && !inAwakeRangeAwhile

    useEffect(() => {
        if (!recentlyBecameAggroCooldown) return
        const timeLeft = Date.now() - recentlyBecameAggroCooldown + 5000
        const timeout = setTimeout(() => {
            setRecentlyBecameAggroCooldown(0)
        }, timeLeft)
        return () => {
            clearTimeout(timeout)
        }
    }, [recentlyBecameAggroCooldown])

    useEffect(() => {
        if (!recentlyLeftAggroCooldown) return
        const timeLeft = Date.now() - recentlyLeftAggroCooldown + 4000
        const timeout = setTimeout(() => {
            setRecentlyLeftAggroCooldown(0)
        }, timeLeft)
        return () => {
            clearTimeout(timeout)
        }
    }, [recentlyLeftAggroCooldown])

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
            console.log('setInAwakeRangeAwhile!')
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

    const [awayFromHome, setAwayFromHome] = useState(false)

    useEffect(() => {
        if (isAtHome) {
            const timeout = setTimeout(() => {
                console.log('setAwayFromHome !')
                setAwayFromHome(false)
            }, 500)
            return () => {
                clearTimeout(timeout)
            }
        } else {
            const timeout = setTimeout(() => {
                console.log('setAwayFromHome')
                setAwayFromHome(true)
            }, 1000)
            return () => {
                clearTimeout(timeout)
            }
        }
    }, [isAtHome])

    const world = useWorld()

    const [localState] = useState({
        intervalId: '' as any,
    })

    useEffect(() => {
        if (!shouldBecomeAggro) return
        if (!targetBody) return

        console.log('shouldBecomeAggro', id)

        v2.set(body.getPosition())
        v2.sub(targetBody.getPosition())

        const normalized = normalize(v2.lengthSquared(), 150, 20)
        const delay = lerp(250, 1500, normalized)

        console.log('delay', delay)


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

            // range 10 to 100

            return // todo - remove this line...

            console.log('setIsAggro++', id)

            setIsAggro(true)
            setRecentlyBecameAggroCooldown(Date.now())

        }

        check()

        localState.intervalId = setInterval(check, 1000)

        return () => {
            console.log('clearing interval...')
            clearInterval(localState.intervalId)
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

    const stopAggro = isAggro && (leaveAggroTimeout || awayFromHome) && !inCloseRange && !recentlyBecameAggroCooldown

    useEffect(() => {
        if (!stopAggro) return
        const timeout = setTimeout(() => {
            setIsAggro(false)
            setRecentlyLeftAggroCooldown(Date.now())
        }, 500)
        return () => {
            clearTimeout(timeout)
        }
    }, [stopAggro])

}

export const GoalHandler: React.FC = () => {

    const {
        goal,
    } = useMobBrainContext()

    useAggroHandler()

    switch (goal?.type) {
        case MainGoalTypes.IDLE:
            return <IdleGoalHandler/>
        case MainGoalTypes.ATTACK:
            return <AttackPlayerGoalHandler/>
    }

    return null
}
