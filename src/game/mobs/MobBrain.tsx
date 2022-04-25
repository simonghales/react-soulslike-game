import React, {useCallback, useEffect, useMemo, useRef, useState} from "react"
import {useGetBody} from "../state/bodies";
import {useOnPrePhysicsUpdate, useTransmitData} from "react-three-physics";
import {Body, Vec2} from "planck";
import {AttackingState, useMobCollisions, useMobContext, useMobId} from "./MobContext";
import {calculateAngleBetweenVectors, lerpRadians} from "../../utils/angles";
import {lerp} from "three/src/math/MathUtils";
import {useEffectRef} from "../../utils/hooks";
import {calculateCheapVectorsDistance, calculateVectorsDistance} from "../../utils/vectors";
import {MobCollisionTypes} from "../data/collisions";
import {AttackHandler} from "./AttackHandler";
import {normalize} from "../../utils/numbers";

export enum GoalType {
    ATTACK_ENTITY = 'ATTACK_ENTITY',
    CHASE_ENTITY = 'CHASE_ENTITY',
}

export type Goal = {
    type: GoalType,
    data?: any,
}

export const useSelectGoal = (enemiesInAttackRange: boolean): Goal => {

    if (enemiesInAttackRange) {
        return {
            type: GoalType.ATTACK_ENTITY,
            data: {
                id: 'player',
            },
        }
    }

    return {
        type: GoalType.CHASE_ENTITY,
        data: {
            id: 'player',
        },
    }

}

let v2 = new Vec2()
let temp = new Vec2()

let bodyX = 0
let bodyY = 0
let distance = 0
let adjustedDistance = 0
let angle = 0
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

const getAttackingStateMovementClampMultiplier = (attackingState: null | AttackingState, movementRestricted: boolean) => {
    if (!attackingState) {
        if (movementRestricted) {
            return 0
        }
        return 1
    }
    now = Date.now()
    progress = normalize(now, attackingState.started + 500, attackingState.started + 350)
    return Math.pow(progress * 2, 4) * 1.5
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
    } = useMobContext()

    const localStateRef = useRef({
        targetPosition: null as null | {
            x: number,
            y: number,
        }
    })

    const targetBody = useGetBody(id)

    const targetBodyRef = useEffectRef(targetBody)

    const goalRef = useEffectRef(goal)

    const attackingStateRef = useEffectRef(attackingState)

    const damageZoneActiveRef = useEffectRef(damageZoneActive)

    const movementRestrictedRef = useEffectRef(movementRestricted)

    // useTransmitData(`mob-${mobId}-targetPosition`, targetPosition)

    const isAttacking = !!attackingState

    useEffect(() => {

        const calculate = () => {

            if (!targetBody || !body) {
                localStateRef.current.targetPosition = null
                return
            }

            const pos = targetBody.getPosition()

            v2.set(body.getPosition())

            temp.set(pos).sub(v2)

            distance = calculateVectorsDistance(pos.x, v2.x, pos.y, v2.y)
            keepBack = distance < 3 ? distance : 3

            xDiff = v2.x - pos.x
            yDiff = v2.y - pos.y

            v2.set(xDiff, yDiff)
            v2.normalize()

            // v2.mul(isAttacking ? 0.33 : 1.5)
            v2.mul(isAttacking ? 0.33 : keepBack)

            if (!localStateRef.current.targetPosition) {
                localStateRef.current.targetPosition = {
                    x: 0,
                    y: 0,
                }
            }

            localStateRef.current.targetPosition.x = pos.x + v2.x
            localStateRef.current.targetPosition.y = pos.y + v2.y

        }

        calculate()

        const interval = setInterval(calculate, isAttacking ? 150 : 75)

        return () => {
            clearInterval(interval)
        }

    }, [targetBody, body, isAttacking])

    useOnPrePhysicsUpdate(useCallback((delta) => {
        if (!body) return
        const targetPosition = localStateRef.current.targetPosition
        if (!targetPosition) return

        v2.set(body.getPosition())

        bodyX = v2.x
        bodyY = v2.y

        distance = calculateVectorsDistance(v2.x, targetPosition.x, v2.y, targetPosition.y)
        adjustedDistance = distance * 100 * delta

        angle = body.getAngle()
        prevAngle = angle

        if (adjustedDistance > 1) {
            xDir = targetPosition.x - v2.x
            yDir = targetPosition.y - v2.y
            v2.set(xDir, yDir)
            power = v2.length()
            v2.normalize()
            v2.mul(power)
            v2.mul(12)

            clamp = 12

            clamp = clamp * getAttackingStateMovementClampMultiplier(attackingStateRef.current, movementRestrictedRef.current)

            v2.clamp(delta * clamp)
            body.applyLinearImpulse(v2, new Vec2(0, 0))

        }

        if (targetBodyRef.current) {
            targetAngle = calculateAngleBetweenVectors(bodyX, targetBodyRef.current.getPosition().x, targetBodyRef.current.getPosition().y, bodyY)
            targetAngle += Math.PI / 2
            angle = lerpRadians(angle, targetAngle, 0.33)
            angle = lerpRadians(angle, prevAngle, damageZoneActiveRef.current ? 1 : 0.8)
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

export const MobBrain: React.FC<{
    body: Body | null,
}> = ({body}) => {

    const collisions = useMobCollisions()

    const enemiesInAttackRange = useMemo(() => {
        return Object.keys(collisions[MobCollisionTypes.ATTACK_RANGE] ?? {}).length > 0
    }, [collisions])

    const goal = useSelectGoal(enemiesInAttackRange)

    return (
        <>
            <MovementHandler body={body} goal={goal}/>
            {/*<AttackHandler goal={goal} enemiesInAttackRange={enemiesInAttackRange} />*/}
        </>
    )
}
