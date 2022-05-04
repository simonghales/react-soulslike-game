import React, {useEffect, useRef, useState} from "react"
import {useMobBrainContext} from "../mobBrainContext";
import {useEffectRef} from "../../../utils/hooks";
import {GoalHandlerProps} from "./GoalHandler";
import {Body, Vec2} from "planck";
import {degToRad, lerp} from "three/src/math/MathUtils";
import {angleToV2, roundAngleDegrees, v2ToAngleDegrees} from "../../../utils/angles";
import random from "canvas-sketch-util/random"
import {useGoalLimitReset} from "./misc";
import {AttackGoalSubGoalTypes} from "./types";

let v2 = new Vec2()

let currentDistance = 0
let targetDistance = 0
let difference = 0
let roundAmount = 45 / 2

export const getPosition = (
    body: Body,
    targetBody: Body,
    idealDistance: number,
    tryForDifferentAngle: boolean = false,
    conditionalRound: boolean = false,
    preventMoveBack: boolean = false,
    addTargetVelocity: boolean = false
) => {
    v2.set(body.getPosition())
    v2.sub(targetBody.getPosition())
    if (addTargetVelocity) {
        v2.sub(targetBody.getLinearVelocity())
    }
    currentDistance = v2.length()
    targetDistance = idealDistance


    if (currentDistance < idealDistance) {
        if (preventMoveBack) {
            targetDistance = currentDistance
        } else {
            targetDistance = lerp(currentDistance, idealDistance, 0.5)
        }
        if (targetDistance < 1.25) {
            targetDistance = 1.25
        }
    }

    difference = currentDistance - targetDistance

    const angle = v2ToAngleDegrees(v2.x, v2.y)
    let roundedAngle = angle
    if (!conditionalRound || currentDistance <= 3) {
        roundedAngle = roundAngleDegrees(angle, roundAmount)
    }

    if (tryForDifferentAngle && difference > 0.5) {
        const differentAngle = random.chance(0.2)
        if (differentAngle) {
            const odd = random.boolean()
            if (odd) {
                roundedAngle += roundAmount
            } else {
                roundedAngle -= roundAmount
            }
        }
    }

    angleToV2(degToRad(roundedAngle), v2)

    v2.mul(targetDistance)

    v2.add(targetBody.getPosition())

    return {
        v2,
        currentDistance,
        difference,
    }

}

export const MoveGoalHandler: React.FC<GoalHandlerProps> = ({subGoal, setSubGoal}) => {

    useGoalLimitReset(subGoal, setSubGoal)

    const {
        collisionsState,
        targetBodyRef,
        body,
        movementStateRef,
        setDebugData,
        setRunning,
    } = useMobBrainContext()

    const collisionsStateRef = useEffectRef(collisionsState)

    const localStateRef = useRef({
        previousTargetDistance: 0,
    })

    const [target, setTarget] = useState(null as null | Vec2)
    const [reachedTarget, setReachedTarget] = useState(false)

    useEffect(() => {

        localStateRef.current.previousTargetDistance = 0

        let tryForDifferentAngle = movementStateRef.current.lastMovementGoal < Date.now() - 2000
        movementStateRef.current.lastMovementGoal = Date.now()

        const update = () => {

            const targetBody = targetBodyRef.current
            if (!targetBody) return

            const collisionStates = collisionsStateRef.current
            let idealDistance = 5
            if (collisionStates.isInSmallCombatRange) {
                idealDistance = 2
            } else if (collisionStates.isInMediumCombatRange) {
                idealDistance = 3
            } else if (collisionStates.isInLargeCombatRange) {
                idealDistance = 4
            } else if (collisionStates.isInExtraLargeCombatRange) {
                idealDistance = 4.5
            }

            const {
                v2,
                currentDistance,
                difference,
            } = getPosition(body, targetBody, idealDistance, tryForDifferentAngle)

            const previousTargetDistance = localStateRef.current.previousTargetDistance
            if (currentDistance <= previousTargetDistance) {
                return
            }
            localStateRef.current.previousTargetDistance = currentDistance

            if (difference >= 2) {
                const odds = (difference / 8) * 2.5
                const shouldRun = random.chance(odds)
                setRunning(shouldRun)
            } else {
                setRunning(false)
            }

            if (!movementStateRef.current.targetPosition) {
                movementStateRef.current.targetPosition = new Vec2(v2)
            } else {
                movementStateRef.current.targetPosition.set(v2)
            }

            setTarget(new Vec2(v2))

            setDebugData((prevState: any) => ({
                ...prevState,
                targetPosition: [v2.x, v2.y]
            }))

        }

        update()

        const interval = setInterval(update, 2000)

        return () => {
            clearInterval(interval)
            setRunning(false)
        }



    }, [subGoal])

    useEffect(() => {
        setReachedTarget(false)
    }, [target])

    useEffect(() => {
        if (!target || reachedTarget) return

        const interval = setInterval(() => {

            v2.set(target)
            v2.sub(body.getPosition())

            const distanceSquared = v2.lengthSquared()

            if (distanceSquared < 0.1) {
                setReachedTarget(true)
            }

        }, 100)

        return () => {
            clearInterval(interval)
        }

    }, [target, reachedTarget])

    useEffect(() => {
        if (!reachedTarget) return
        const delay = lerp(500, 2000, Math.random())
        const timeout = setTimeout(() => {
            movementStateRef.current.targetPosition = null
            setSubGoal({
                type: AttackGoalSubGoalTypes.IDLE,
                time: Date.now(),
            })
        }, delay)
        return () => {
            clearTimeout(timeout)
        }
    }, [reachedTarget])

    return null
}
