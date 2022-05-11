import React, {useCallback, useMemo, useRef} from "react"
import {useMobBrainContext} from "../mobBrainContext";
import {useOnPhysicsUpdate} from "react-three-physics";
import {Vec2} from "planck";
import {useEffectRef} from "../../../utils/hooks";
import {angleToV2, calculateAngleBetweenVectors, lerpRadians} from "../../../utils/angles";
import {AttackState, AttackStateType} from "./types";
import {mobAttacksConfig} from "../../data/attacks";
import {lerp} from "three/src/math/MathUtils";

const v2 = new Vec2()
const blankV2 = new Vec2()
let sqrLength = 0
let speed = 0
let angle = 0
let prevAngle = 0
let targetAngle = 0
let weight = 0

const WALK_SPEED = 4
export const SLOW_SPEED = WALK_SPEED
const RUNNING_SPEED = WALK_SPEED * 2.75
export const SPRINT_SPEED = RUNNING_SPEED * 1.25

const angleV2 = new Vec2()
const targetV2 = new Vec2()

const MAX_ATTACK_SPEED = 10

let progress = 0

export const getAttackSpeed = (attackState: AttackState) => {

    progress = (Date.now() - attackState.time) / (mobAttacksConfig.basic.attackDuration - 300)

    if (progress > 1) {
        progress = 1
    }

    progress = Math.pow(progress, 2)

    return lerp(0, MAX_ATTACK_SPEED, progress)

}

let isAttacking = false

export const MovementHandler: React.FC = () => {

    const {
        body,
        movementStateRef,
        running,
        speedLimit,
        targetBodyRef,
        attackState,
        attackStateRef,
    } = useMobBrainContext()

    const movementSpeed = useMemo(() => {
        if (speedLimit !== null) {
            return speedLimit
        }
        if (running) {
            return RUNNING_SPEED
        }
        return WALK_SPEED
    }, [running, speedLimit])

    const movementSpeedRef = useEffectRef(movementSpeed)

    const localStateRef = useRef({})

    const limitedMovement = (attackState?.type === AttackStateType.ATTACKING || attackState?.type === AttackStateType.COOLDOWN)

    const limitedMovementRef = useEffectRef(limitedMovement)

    useOnPhysicsUpdate(useCallback((delta) => {

        const targetBody = targetBodyRef.current
        const targetPosition = movementStateRef.current.targetPosition
        if (movementStateRef.current.lockedTarget) {
            v2.set(body.getPosition())
            angleToV2(body.getAngle(), angleV2)
            v2.add(angleV2)
        } else if (targetPosition) {
            v2.set(targetPosition)
        } else {
            v2.set(body.getPosition())
        }

        v2.sub(body.getPosition())
        sqrLength = v2.lengthSquared()
        if (sqrLength > 1) {
            v2.normalize()
        }
        speed = movementSpeedRef.current

        isAttacking = attackStateRef.current?.type === AttackStateType.ATTACKING

        if (isAttacking) {
            speed = getAttackSpeed(attackStateRef.current)
        }

        v2.mul((speed * 2) * delta)
        v2.clamp(speed * delta)
        body.applyLinearImpulse(v2, blankV2)

        angleV2.set(body.getPosition())

        if (limitedMovementRef.current) {
            if (movementStateRef.current.lockedTarget) {
                // targetAngle = calculateAngleBetweenVectors(angleV2.x, movementStateRef.current.lockedTarget.x, movementStateRef.current.lockedTarget.y, angleV2.y)
                // targetAngle += Math.PI / 2
                // targetAngle = lerpRadians(movementStateRef.current.lockedAngle, targetAngle, 0.25)
                // body.setAngle(targetAngle)
            }
        } else if (targetBody) {
            prevAngle = body.getAngle()
            targetV2.set(targetBody.getPosition())
            targetAngle = calculateAngleBetweenVectors(angleV2.x, targetV2.x, targetV2.y, angleV2.y)
            targetAngle += Math.PI / 2
            weight = delta * 0.1
            if (isAttacking) {
                weight = weight * 2
            }
            angle = lerpRadians(prevAngle, targetAngle, weight)
            body.setAngle(angle)
        } else {
            // todo - rotate in movement direction...
        }

    }, [body]))

    return null
}
