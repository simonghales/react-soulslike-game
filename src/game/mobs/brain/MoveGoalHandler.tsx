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
import {PositionDistance} from "../MobsGroupHandler";
import {isNavMeshPointValid} from "../../scene/layout/navmesh/handler";

let v2 = new Vec2()
let initialV2 = new Vec2()
let tempV2 = new Vec2()
const spareV2 = new Vec2()

let currentDistance = 0
let targetDistance = 0
let difference = 0
let roundAmount = 45 / 2

const DEFAULT_ANGLE_ORDER = [0, 1, -1]
const CLOCKWISE_ANGLE_ORDER = [1, 0, -1]
const ANTI_CLOCKWISE_ANGLE_ORDER = [-1, 0, 1]

const getAngleOrder = (tryForDifferentAngle: boolean) => {
    if (tryForDifferentAngle) {
        const differentAngle = random.chance(0.2)
        if (differentAngle) {
            const odd = random.boolean()
            return odd ? CLOCKWISE_ANGLE_ORDER : ANTI_CLOCKWISE_ANGLE_ORDER
        }
    }
    return DEFAULT_ANGLE_ORDER
}

export const getPosition = (
    body: Body,
    targetBody: Body,
    idealDistance: number,
    tryForDifferentAngle: boolean = false,
    conditionalRound: boolean = false,
    preventMoveBack: boolean = false,
    addTargetVelocity: boolean = false,
    velocityMultiplier: number = 2
) => {
    v2.set(body.getPosition())
    v2.sub(targetBody.getPosition())
    if (addTargetVelocity) {
        spareV2.set(targetBody.getLinearVelocity())
        spareV2.mul(velocityMultiplier)
        v2.sub(spareV2)
    }
    currentDistance = v2.length()
    targetDistance = idealDistance


    if (currentDistance < idealDistance) {
        if (preventMoveBack) {
            targetDistance = currentDistance
        } else {
            targetDistance = lerp(currentDistance, idealDistance, 0.25)
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

    let originalAngle = roundedAngle

    const angleOrder = getAngleOrder(tryForDifferentAngle && difference > 0.5)

    tempV2.set(v2)

    for (let i = 0, len = angleOrder.length; i < len; i++) {
        const angleMultiplier = angleOrder[i]
        roundedAngle = originalAngle + (angleMultiplier * roundAmount)
        v2.set(tempV2)
        angleToV2(degToRad(roundedAngle), v2)
        v2.mul(targetDistance)
        v2.add(targetBody.getPosition())
        if (isNavMeshPointValid(v2.x, v2.y)) {
            return {
                v2,
                currentDistance,
                difference,
            }
        } else if (i === 0) {
            initialV2.set(v2)
        }
    }

    return {
        v2: initialV2, // return initial angle
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
        updateTargetPosition,
        setDebugData,
        setRunning,
        positionToken,
    } = useMobBrainContext()

    const positionTokenRef = useEffectRef(positionToken)

    const collisionsStateRef = useEffectRef(collisionsState)

    const localStateRef = useRef({
        previousTargetDistance: 0,
    })

    const [target, setTarget] = useState(null as null | Vec2)
    const [reachedTarget, setReachedTarget] = useState(false)

    useEffect(() => {

        localStateRef.current.previousTargetDistance = 0

        let tryForDifferentAngle = movementStateRef.current.lastMovementGoal < performance.now() - 2000
        movementStateRef.current.lastMovementGoal = performance.now()

        const update = () => {

            const positionToken = positionTokenRef.current

            const targetBody = targetBodyRef.current
            if (!targetBody) return

            const collisionStates = collisionsStateRef.current
            let idealDistance = 8
            if (collisionStates.isInSmallCombatRange) {
                idealDistance = 3
            } else if (positionToken === PositionDistance.CLOSE) {
                idealDistance = 3
            } else if (positionToken === PositionDistance.MEDIUM) {
                idealDistance = 6
            } else if (positionToken === PositionDistance.LONG) {
                idealDistance = 7
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

            updateTargetPosition(v2)

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
            updateTargetPosition(null)
            setSubGoal({
                type: AttackGoalSubGoalTypes.IDLE,
                time: performance.now(),
            })
        }, delay)
        return () => {
            clearTimeout(timeout)
        }
    }, [reachedTarget])

    return null
}
