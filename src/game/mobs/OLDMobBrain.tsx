import React, {useCallback, useEffect, useMemo, useRef, useState} from "react"
import {useGetBody} from "../state/bodies";
import {useOnPrePhysicsUpdate} from "@simonghales/react-three-physics";
import {Body, Vec2} from "planck";
import {AttackingState, useMobContext, useMobId} from "./MobContext";
import {angleToV2, calculateAngleBetweenVectors, lerpRadians} from "../../utils/angles";
import {useEffectRef} from "../../utils/hooks";
import {calculateVectorsDistance} from "../../utils/vectors";
import {normalize} from "../../utils/numbers";
import {useMobsManagerContext} from "./MobsManagerContext";
import {Goal, GoalType} from "./types";
import {AttackHandler} from "./AttackHandler";
import {lerp} from "three/src/math/MathUtils";
import {mobAttacksConfig} from "../data/attacks";

let v2 = new Vec2()
let v2b = new Vec2()
let temp = new Vec2()

let bodyX = 0
let bodyY = 0
let shouldMove = false
let distance = 0
let adjustedDistance = 0
let angle = 0
let weight = 0
let prevAngle = 0
let xDir = 0
let yDir = 0
let power = 0
let clamp = 0
let targetAngle = 0
let targetX = 0
let targetY = 0
let pos = 0
let currentPos = 0
let xDiff = 0
let yDiff = 0
let now = 0
let progress = 0
let keepBack = 0
let distanceToTargetPosition = 0
let idealDistance = 0
let timeElapsed = 0
let shouldUpdate = false

const getAttackingStateMovementClampMultiplier = (attackingState: null | AttackingState, movementRestricted: boolean) => {
    if (!attackingState) {
        if (movementRestricted) {
            return 0
        }
        return 1
    }
    now = Date.now()
    timeElapsed = now - attackingState.started
    if (timeElapsed > mobAttacksConfig.basic.damageDuration) {
        return 0
    }
    progress = normalize(now, attackingState.started + mobAttacksConfig.basic.damageDuration, attackingState.started + mobAttacksConfig.basic.damageDelay)
    return Math.pow(progress * 2, 4) * 2
}

export const MovementHandler: React.FC<{
    goal: Goal,
    body: Body | null,
}> = ({goal, body}) => {

    const id = goal?.data?.id
    const mobId = useMobId()

    const {
        attackingState,
        damageZoneActive,
        movementRestricted,
        collisionStates,
    } = useMobContext()

    const localStateRef = useRef({
        atRestCount: 0,
        targetPosition: null as null | {
            x: number,
            y: number,
        },
        prevTargetPositionSet: false,
        prevTargetPosition: new Vec2(),
        lastUpdated: 0,
    })

    const targetBody = useGetBody(id)

    const targetBodyRef = useEffectRef(targetBody)

    useEffect(() => {
        localStateRef.current.prevTargetPositionSet = false
    }, [targetBody])

    const goalRef = useEffectRef(goal)

    const attackingStateRef = useEffectRef(attackingState)

    const damageZoneActiveRef = useEffectRef(damageZoneActive)

    const movementRestrictedRef = useEffectRef(movementRestricted)

    // useTransmitData(`mob-${mobId}-targetPosition`, targetPosition)

    const isAttacking = !!attackingState

    const [atRest, setAtRest] = useState(false)

    const [speedBoost, setSpeedBoost] = useState(false)

    const [wantToFollowClosely, setWantToFollowClosely] = useState(false)

    const considerFollowCloselyExtraLarge = collisionStates.isInExtraLargeCombatRange && !wantToFollowClosely
    const isClose = collisionStates.isInMediumCombatRange

    const followClosely = isClose || wantToFollowClosely

    useEffect(() => {
        if (!isClose) return
        const timeout = setTimeout(() => {
            setWantToFollowClosely(false)
        }, 500)
        return () => {
            clearTimeout(timeout)
        }
    }, [isClose])

    useEffect(() => {

        if (!considerFollowCloselyExtraLarge) return

        const timeout = setTimeout(() => {
            setWantToFollowClosely(true)
        }, lerp(2000, 8000, Math.random()))

        return () => {
            clearTimeout(timeout)
        }

    }, [considerFollowCloselyExtraLarge])

    const speedBoostRef = useEffectRef(speedBoost)

    useEffect(() => {
        if (atRest) {
            const timeout = setTimeout(() => {
                setSpeedBoost(false)
            }, 1500)
            return () => {
                clearTimeout(timeout)
            }
        } else {
            const delay = lerp(1000, 5000, Math.random())
            const timeout = setTimeout(() => {
                setSpeedBoost(true)
            }, delay)
            return () => {
                clearTimeout(timeout)
            }
        }
    }, [atRest])

    const [longAttackState, setLongAttackState] = useState(false)

    const isAttackGoal = goal.type === GoalType.ATTACK_ENTITY

    const notAttackGoal = longAttackState && !isAttackGoal

    const [recentlyWantedToAttack, setRecentlyWantedToAttack] = useState(false)

    useEffect(() => {
        if (isAttackGoal) {
            setRecentlyWantedToAttack(true)
        } else {
            const timeout = setTimeout(() => {
                setRecentlyWantedToAttack(false)
            }, 500)
            return () => {
                clearTimeout(timeout)
            }
        }
    }, [isAttackGoal])

    const [outOfBoundsAwhile, setOutOfBoundsAwhile] = useState(false)

    const inBounds = collisionStates.isInExtraLargeCombatRange

    useEffect(() => {
        if (!inBounds) {
            const timeout = setTimeout(() => {
                setOutOfBoundsAwhile(true)
            }, 1000)
            return () => {
                clearTimeout(timeout)
            }
        } else {
            const timeout = setTimeout(() => {
                setOutOfBoundsAwhile(false)
            }, 500)
            return () => {
                clearTimeout(timeout)
            }
        }
    }, [inBounds])

    const [stopFollowing, setStopFollowing] = useState(false)

    const stopFollowingRef = useEffectRef(stopFollowing)

    useEffect(() => {
        if (!stopFollowing) return
        const delay = lerp(3000, 9000, Math.random())
        const timeout = setTimeout(() => {
            setStopFollowing(false)
        }, delay)
        return () => {
            clearTimeout(timeout)
        }
    }, [stopFollowing])

    useEffect(() => {
        if (!outOfBoundsAwhile) {
            setStopFollowing(false)
        } else {
            const delay = lerp(500, 1500, Math.random())
            const timeout = setTimeout(() => {
                setStopFollowing(true)
            }, delay)
            return () => {
                clearTimeout(timeout)
            }
        }
    }, [outOfBoundsAwhile])

    const intervalUpdateTiming = useMemo(() => {
        if (stopFollowing || !followClosely) {
            return lerp(5000, 10000, Math.random())
        }
        if (isAttacking || speedBoost) {
            return 150
        }
        if (isAttackGoal && collisionStates.isInMediumCombatRange) {
            return 100
        }
        // if (!collisionStates.isInLargeCombatRange) {
        //     if (atRest && !isAttackGoal && !recentlyWantedToAttack) {
        //         return lerp(3000, 5000, Math.random())
        //     }
        //     return lerp(1500, 2500, Math.random())
        // }
        if (atRest && !isAttackGoal && !recentlyWantedToAttack) {
            return lerp(1500, 2500, Math.random())
        }
        return lerp(750, 1500, Math.random())
    }, [isAttacking, collisionStates, atRest, isAttackGoal, recentlyWantedToAttack, speedBoost, stopFollowing, followClosely])

    useEffect(() => {
        if (notAttackGoal) {
            setLongAttackState(false)
        }
    }, [notAttackGoal])

    useEffect(() => {
        const timeout = setTimeout(() => {
            setLongAttackState(true)
        }, 250)
        return () => {
            clearTimeout(timeout)
        }
    }, [isAttackGoal])

    const [mediumDistanceAwhile, setMediumDistanceAwhile] = useState(false)

    const {
        isInMediumCombatRange,
    } = collisionStates

    useEffect(() => {
        if (isInMediumCombatRange) {
            const timeout = setTimeout(() => {
                setMediumDistanceAwhile(true)
            }, lerp(1000, 2500, Math.random()))
            return () => {
                clearTimeout(timeout)
            }
        } else {
            setMediumDistanceAwhile(false)
        }
    }, [isInMediumCombatRange])

    const updateMovementTarget = useCallback(() => {

        if (!targetBody || !body) {
            localStateRef.current.targetPosition = null
            return
        }

        const pos = targetBody.getPosition()

        v2.set(body.getPosition())

        shouldUpdate = true

        if (localStateRef.current.prevTargetPositionSet) {
            v2b.set(pos).sub(localStateRef.current.prevTargetPosition)
            distance = v2b.lengthSquared() * 1000

            if (localStateRef.current.lastUpdated > Date.now() - 4000) {
                if (!collisionStates.isInSmallCombatRange) {
                    if (collisionStates.isInMediumCombatRange) {
                        if (distance < 10) {
                            shouldUpdate = false
                        }
                    } else {
                        if (collisionStates.isInLargeCombatRange) {
                            if (distance < 50) {
                                shouldUpdate = false
                            }
                        } else {
                            if (collisionStates.isInExtraLargeCombatRange) {
                                if (distance < 750) {
                                    shouldUpdate = false
                                }
                            } else {

                                if (distance < 1500) {
                                    shouldUpdate = false
                                }
                            }
                        }
                    }

                }
            }
        } else {
            localStateRef.current.prevTargetPositionSet = true
        }

        if (shouldUpdate) {
            localStateRef.current.prevTargetPosition.set(pos)
            localStateRef.current.lastUpdated = Date.now()
        } else {
            // console.log('skip update...')
        }

        v2b.set(targetBody.getLinearVelocity())
        if (!collisionStates.isInMediumCombatRange) {
            v2b.mul(3)
        }

        temp.set(pos).add(v2b).sub(v2)

        idealDistance = 5.5

        if (goal.type === GoalType.ATTACK_ENTITY || recentlyWantedToAttack) {
            if (longAttackState) {
                idealDistance = 2.25
                if (mediumDistanceAwhile) {
                    idealDistance = 1.25
                }
            } else {
                idealDistance = 3.25
            }
        } else if (stopFollowing) {
            idealDistance = 12
        } else {
            if (goal.data.hasStandbyToken) {
                idealDistance = 3.25
                if (mediumDistanceAwhile) {
                    idealDistance = 2.75
                }
            }
        }

        distance = calculateVectorsDistance(pos.x, v2.x, pos.y, v2.y)
        keepBack = distance < idealDistance ? distance : idealDistance

        if (keepBack < 1.2) {
            keepBack = 1.2
        }

        xDiff = v2.x - pos.x
        yDiff = v2.y - pos.y

        v2.set(xDiff, yDiff)
        v2.normalize()

        v2.mul(isAttacking ? 0.33 : keepBack)

        if (!localStateRef.current.targetPosition) {
            localStateRef.current.targetPosition = {
                x: 0,
                y: 0,
            }
        }

        localStateRef.current.targetPosition.x = pos.x + v2.x
        localStateRef.current.targetPosition.y = pos.y + v2.y

        v2.set(localStateRef.current.targetPosition.x, localStateRef.current.targetPosition.y)
        v2.sub(body.getPosition())

        distanceToTargetPosition = v2.lengthSquared()

        if (distanceToTargetPosition < 0.5) {
            if (!atRest) {
                localStateRef.current.atRestCount += 1

                if (localStateRef.current.atRestCount >= 2 && !recentlyWantedToAttack) {
                    setAtRest(true)
                }
            }
        } else {
            localStateRef.current.atRestCount = 0
            if (atRest) {
                setAtRest(false)
            }
        }


    }, [targetBody, body, isAttacking, goal, longAttackState, atRest, recentlyWantedToAttack, mediumDistanceAwhile, stopFollowing, collisionStates])

    const updateMovementTargetRef = useEffectRef(updateMovementTarget)

    useEffect(() => {

        updateMovementTargetRef.current()

        const interval = setInterval(() => {
            updateMovementTargetRef.current()
        }, intervalUpdateTiming)

        return () => {
            clearInterval(interval)
        }

    }, [intervalUpdateTiming])

    const collisionsStateRef = useEffectRef(collisionStates)

    const idealMovementSpeed = useMemo(() => {
        if (stopFollowing) {
            return 4
        }
        if (collisionStates.isInSmallCombatRange) {
            return 14
        }
        if (collisionStates.isInMediumCombatRange) {
            if (speedBoost || followClosely) {
                return 13
            }
            return 8
        }
        if (collisionStates.isInLargeCombatRange) {
            if (speedBoost || followClosely) {
                return 12
            }
            return 7
        }
        if (speedBoost) {
            return 7
        }
        return 6
    }, [stopFollowing, collisionStates, speedBoost, followClosely])

    const [movementSpeed, setMovementSpeed] = useState(idealMovementSpeed)
    const [pendingMovementSpeed, setPendingMovementSpeed] = useState(0)
    const movementSpeedRef = useEffectRef(movementSpeed)
    const pendingMovementSpeedRef = useEffectRef(pendingMovementSpeed)

    useEffect(() => {
        if (idealMovementSpeed >= movementSpeedRef.current) {
            setMovementSpeed(idealMovementSpeed)
        } else {
            setPendingMovementSpeed(idealMovementSpeed)
        }
    }, [idealMovementSpeed])

    const hasPendingMovementSpeed = !!pendingMovementSpeed

    useEffect(() => {
        if (!hasPendingMovementSpeed) return
        const timeout = setTimeout(() => {
            if (pendingMovementSpeedRef.current) {
                setMovementSpeed(pendingMovementSpeedRef.current)
                setPendingMovementSpeed(0)
            }
        }, 1000)
        return () => {
            clearTimeout(timeout)
        }
    }, [hasPendingMovementSpeed])

    useOnPrePhysicsUpdate(useCallback((delta) => {
        if (!body) return
        const targetPosition = localStateRef.current.targetPosition
        if (!targetPosition) return

        v2.set(body.getPosition())
        v2b.set(targetPosition.x, targetPosition.y)
        v2b.sub(v2)

        bodyX = v2.x
        bodyY = v2.y

        distance = (v2b.lengthSquared() * delta) * 1000

        shouldMove = distance > 0.05

        angle = body.getAngle()
        prevAngle = angle

        if (attackingStateRef.current) {
            angleToV2(prevAngle, v2b)
        }

        xDir = v2b.x
        yDir = v2b.y

        if (shouldMove) {
            v2.set(xDir, yDir)
            power = v2.length()
            v2.normalize()
            v2.mul(power)
            let speed = 6
            if (stopFollowingRef.current) {
                speed = 4
            } else if (collisionsStateRef.current.isInSmallCombatRange) {
                if (collisionsStateRef.current.enemiesInAttackRange) {
                    speed = 16
                } else {
                    speed = 14
                }
            } else if (collisionsStateRef.current.isInMediumCombatRange) {
                if (speedBoostRef.current) {
                    speed = 13
                } else {
                    speed = 8
                }
            } else if (collisionsStateRef.current.isInLargeCombatRange) {
                if (speedBoostRef.current) {
                    speed = 12
                } else {
                    speed = 7
                }
            } else if (speedBoostRef.current) {
                speed = 7
            }
            v2.mul(speed)

            clamp = speed

            clamp = clamp * getAttackingStateMovementClampMultiplier(attackingStateRef.current, movementRestrictedRef.current)

            v2.clamp(delta * clamp)
            body.applyLinearImpulse(v2, new Vec2(0, 0))

        }

        if (targetBodyRef.current) {
            targetAngle = calculateAngleBetweenVectors(bodyX, targetBodyRef.current.getPosition().x, targetBodyRef.current.getPosition().y, bodyY)
            targetAngle += Math.PI / 2
            angle = lerpRadians(angle, targetAngle, 0.33)
            weight = damageZoneActiveRef.current ? 1 : movementRestrictedRef.current ? 0.8 : 0.7
            angle = lerpRadians(angle, prevAngle, weight)
        } else {
            targetX = targetPosition.x
            targetY = targetPosition.y
            angle = calculateAngleBetweenVectors(bodyX, targetX, targetY, bodyY)
            angle += Math.PI / 2
            angle = lerpRadians(prevAngle, angle, 0.33)
        }

        if (movementRestrictedRef.current && !attackingStateRef.current) {
            angle = prevAngle
        }

        body.setAngle(angle)

        // body.applyLinearImpulse(v2, new Vec2(0, 0))
        // body.setLinearVelocity(v2)
    }, [body]))

    return null

}

export const GoalHandler: React.FC<{
    id: string,
}> = ({id}) => {

    const {
        collisionStates,
        body,
        setHasAttackToken,
        goal,
        setGoal,
        movementRestricted,
    } = useMobContext()

    const targetId = goal?.data?.id

    const targetBody = useGetBody(targetId)

    const {
        requestAttackToken,
        addManualToken,
        grantedTokens,
        updateAttackTokenWeight,
        requestStandbyToken,
        standbyTokens,
        setHasManualAttackToken,
    } = useMobsManagerContext()

    const hasStandbyToken = useMemo(() => {
        return !!standbyTokens[id]
    }, [standbyTokens])

    const hasAttackToken = useMemo(() => {
        return !!grantedTokens[id]
    }, [grantedTokens])

    useEffect(() => {
        setHasAttackToken(hasAttackToken)
    }, [hasAttackToken])

    const [hasRecentAttackToken, setHasRecentAttackToken] = useState(hasAttackToken)

    const canAttack = hasAttackToken || hasRecentAttackToken || collisionStates.enemiesInAttackRange

    const hasManualAttackToken = !hasAttackToken && canAttack

    const {
        wantsToAttack,
        wantsToStandby,
    } = useMemo(() => {
        const wantsToAttack = collisionStates.isInMediumCombatRange && !movementRestricted && !hasManualAttackToken
        const wantsToStandby = !hasManualAttackToken && !hasAttackToken && collisionStates.isInLargeCombatRange
        return {
            wantsToAttack,
            wantsToStandby,
        }
    }, [collisionStates, hasAttackToken, movementRestricted, hasManualAttackToken])

    const calculateTargetDistance = useCallback(() => {

        let targetDistance = 0

        if (targetBody) {
            v2.set(body.getPosition())
            v2.sub(targetBody.getPosition())
            targetDistance = v2.lengthSquared()
            targetDistance = 20 - targetDistance
            if (targetDistance < 0) {
                targetDistance = 0
            }
        }

        return targetDistance

    }, [targetBody])

    const [wantsToStandbyAwhile, setWantsToStandbyAwhile] = useState(wantsToStandby)

    useEffect(() => {
        if (!wantsToStandby) {
            setWantsToStandbyAwhile(false)
        } else {
            const delay = lerp(500, 3000, Math.random())
            const timeout = setTimeout(() => {
               setWantsToStandbyAwhile(true)
            }, delay)
            return () => {
                clearTimeout(timeout)
            }
        }
    }, [wantsToStandby])

    useEffect(() => {
        if (!wantsToStandbyAwhile) return
        return requestStandbyToken(id, calculateTargetDistance)
    }, [wantsToStandbyAwhile, calculateTargetDistance])

    const {
        isInSmallCombatRange,
    } = collisionStates

    const calculateAttackWeight = useCallback(() => {

        let weight = 0
        let targetDistance = 0

        if (isInSmallCombatRange) {
            weight += 20
        }

        if (targetBody) {
            v2.set(body.getPosition())
            v2.sub(targetBody.getPosition())
            targetDistance = v2.lengthSquared()
            targetDistance = 20 - targetDistance
            if (targetDistance < 0) {
                targetDistance = 0
            }
            weight += targetDistance
        }

        return weight
    }, [targetBody, isInSmallCombatRange])

    const calculateAttackWeightRef = useEffectRef(calculateAttackWeight)

    useEffect(() => {
        if (!wantsToAttack) return

        const interval = setInterval(() => {
            updateAttackTokenWeight(id, calculateAttackWeightRef.current())
        }, 500)

        const unsub = requestAttackToken(id, calculateAttackWeightRef.current())

        return () => {
            unsub()
            clearInterval(interval)
        }

    }, [wantsToAttack])

    useEffect(() => {
        if (hasAttackToken) {

            const timeout = setTimeout(() => {
                setHasRecentAttackToken(true)
            }, 500)

            return () => {
                clearTimeout(timeout)
            }

        }
    }, [hasAttackToken])

    useEffect(() => {

        if (!hasRecentAttackToken) return

        const timeout = setTimeout(() => {
            setHasRecentAttackToken(false)
        }, 2000)

        return () => {
            clearTimeout(timeout)
        }

    }, [hasRecentAttackToken])

    useEffect(() => {
        if (!hasManualAttackToken) return
        return setHasManualAttackToken(id)
    }, [hasManualAttackToken])

    useEffect(() => {
        const goal = (() => {
            if (canAttack) {
                return {
                    type: GoalType.ATTACK_ENTITY,
                    data: {
                        id: 'player',
                    },
                }
            }
            return {
                type: GoalType.FOLLOW_ENTITY,
                data: {
                    id: 'player',
                    hasStandbyToken,
                },
            }
        })()

        setGoal(goal)

    }, [canAttack, hasStandbyToken])

    return null

}

export const OLDMobBrain: React.FC<{
    id: string,
    body: Body | null,
}> = ({id, body}) => {

    const {
        goal,
    } = useMobContext()

    return (
        <>
            <GoalHandler id={id}/>
            <MovementHandler body={body} goal={goal}/>
            <AttackHandler goal={goal} />
        </>
    )
}
