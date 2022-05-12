import React, {useCallback, useEffect, useState} from "react"
import {useMobBrainContext} from "../mobBrainContext";
import {getPosition} from "./MoveGoalHandler";
import {Vec2} from "planck";
import {lerp} from "three/src/math/MathUtils";
import {AttackGoalSubGoalTypes, AttackState, AttackStateType} from "./types";
import {mobAttacksConfig} from "../../data/attacks";
import {SLOW_SPEED, SPRINT_SPEED} from "./MovementHandler";
import {angleToV2} from "../../../utils/angles";
import {useGoalHandlerContext} from "./GoalHandlerContext";
import {DamageHandler} from "./DamageHandler";

export const AttackStateHandler: React.FC<{
    attackState: AttackState,
    setAttackState: any,
}> = ({attackState, setAttackState}) => {

    const {
        body,
        movementStateRef,
        collisionsState,
    } = useMobBrainContext()

    const {
        setSubGoal,
    } = useGoalHandlerContext()

    const isCharging = attackState.type === AttackStateType.CHARGING
    const isAttacking = attackState.type === AttackStateType.ATTACKING
    const [timedOut, setTimedOut] = useState(false)

    const [damageActive, setDamageActive] = useState(false)

    useEffect(() => {
        if (!isAttacking) {
            setDamageActive(false)
        } else {
            const timeout = setTimeout(() => {
                setDamageActive(true)
            }, 250)
            return () => {
                clearTimeout(timeout)
            }
        }
    }, [isAttacking])

    useEffect(() => {
        if (!isCharging) return
        const delay = lerp(1000, 2000, Math.random())
        const timeout = setTimeout(() => {
            setTimedOut(true)
        }, delay)
        return () => {
            clearTimeout(timeout)
        }
    }, [isCharging])

    const inAttackRange = collisionsState.enemiesInAttackRange

    const [inAttackRangeAwhile, setInAttackRangeAwhile] = useState(false)

    useEffect(() => {
        if (!inAttackRange) {
            return
        }
        const delay = lerp(100, 500, Math.random())
        const timeout = setTimeout(() => {
            setInAttackRangeAwhile(true)
        }, delay)
        return () => {
            clearTimeout(timeout)
        }
    }, [inAttackRange])

    const shouldSwing = isCharging && (timedOut || inAttackRangeAwhile)

    useEffect(() => {
        if (!isAttacking) return
        const timeout = setTimeout(() => {
            movementStateRef.current.lockedTarget = true
        }, 10)
        return () => {
            clearTimeout(timeout)
            movementStateRef.current.lockedTarget = false
        }
    }, [isAttacking])

    useEffect(() => {
        if (!shouldSwing) return
        setAttackState({
            type: AttackStateType.ATTACKING,
            time: Date.now(),
        })
        const target = new Vec2(body.getPosition())
        const angle = body.getAngle()
        const angleVector = new Vec2()
        angleToV2(angle, angleVector)
        angleVector.mul(1.5)
        target.add(angleVector)
    }, [shouldSwing])

    useEffect(() => {

        const handleAttacking = () => {
            const end = attackState.time + mobAttacksConfig.basic.attackDuration
            const delay = end - Date.now()
            const update = () => {
                setAttackState({
                    type: AttackStateType.COOLDOWN,
                    time: Date.now(),
                })
            }
            if (delay <= 0) {
                update()
                return
            }
            const timeout = setTimeout(update, delay)
            return () => {
                clearTimeout(timeout)
            }
        }

        const handleCooldown = () => {
            const end = attackState.time + mobAttacksConfig.basic.cooldown
            const delay = end - Date.now()
            const update = () => {
                setAttackState(null)
                setSubGoal({
                    type: AttackGoalSubGoalTypes.IDLE,
                    time: Date.now(),
                })
            }
            if (delay <= 0) {
                update()
                return
            }
            const timeout = setTimeout(update, delay)
            return () => {
                clearTimeout(timeout)
            }
        }

        switch (attackState.type) {
            case AttackStateType.ATTACKING:
                return handleAttacking()
            case AttackStateType.COOLDOWN:
                return handleCooldown()
        }
    }, [attackState])

    useEffect(() => {
        return () => {
            movementStateRef.current.lockedTarget = null
        }
    }, [])

    return (
        <>
            {
                damageActive && (
                    <DamageHandler/>
                )
            }
        </>
    )

}

export const DamageGoalHandler: React.FC<{
    onAttack: any,
}> = ({onAttack}) => {

    const {
        collisionsState,
        targetBodyRef,
        body,
        movementStateRef,
        setDebugData,
        setRunning,
        setSpeedLimit,
        attackState,
        attackStateRef,
        setAttackState,
        damageRecentlyTaken,
        setSubGoal,
    } = useMobBrainContext()


    useEffect(() => {
        if (!damageRecentlyTaken) return
        const attackState = attackStateRef.current
        if (attackState) {
            if (attackState.type === AttackStateType.ATTACKING) {
                return
            }
        }
        setSubGoal({
            type: AttackGoalSubGoalTypes.IDLE,
            time: Date.now(),
        })
    }, [damageRecentlyTaken])

    const [pendingAttack, setPendingAttack] = useState(true)

    const [shouldSprint, setShouldSprint] = useState(false)

    useEffect(() => {
        if (shouldSprint) return
        const delay = lerp(3000, 5000, Math.random())
        const timeout = setTimeout(() => {
            setShouldSprint(true)
        }, delay)
        return () => {
            clearTimeout(timeout)
        }
    }, [shouldSprint])

    useEffect(() => {
        if (attackState?.type === AttackStateType.ATTACKING || attackState?.type === AttackStateType.COOLDOWN) {
            setSpeedLimit(0)
            return
        }
        if (shouldSprint) {
            setSpeedLimit(SPRINT_SPEED)
            return
        }
        if (!attackState) {
            setSpeedLimit(null)
            return
        }
        setSpeedLimit(SLOW_SPEED)
        return
    }, [attackState, shouldSprint])

    useEffect(() => {
        return () => {
            setSpeedLimit(null)
        }
    }, [])

    const attack = useCallback(() => {
        setPendingAttack(false)
        setAttackState({
            type: AttackStateType.CHARGING,
            time: Date.now(),
        })
        onAttack()
    }, [])

    const [inExtraSmallRangeAwhile, setInExtraSmallRangeAwhile] = useState(false)

    const inExtraSmallRange = collisionsState.isInExtraSmallCombatRange

    useEffect(() => {
        if (inExtraSmallRange) {
            const delay = lerp(50, 200, Math.random())
            const timeout = setTimeout(() => {
                setInExtraSmallRangeAwhile(true)
            }, delay)
            return () => {
                clearTimeout(timeout)
            }
        } else {
            const delay = 100
            const timeout = setTimeout(() => {
                setInExtraSmallRangeAwhile(false)
            }, delay)
            return () => {
                clearTimeout(timeout)
            }
        }
    }, [inExtraSmallRange])

    const [timedOut, setTimedOut] = useState(false)

    const shouldAttack = pendingAttack && (inExtraSmallRangeAwhile || timedOut)

    useEffect(() => {
        if (!shouldAttack) return
        attack()
    }, [shouldAttack])

    const isAttacking = attackState?.type === AttackStateType.ATTACKING
    const isCharging = attackState?.type === AttackStateType.CHARGING

    useEffect(() => {

        let timeout: any
        let unmounted = false
        let delay = 100

        setRunning(true)

        const update = () => {
            if (unmounted) return
            const targetBody = targetBodyRef.current
            if (!targetBody) return

            let idealDistance = isAttacking ? 1 : 1.5

            const {
                v2,
                currentDistance,
                difference,
            } = getPosition(body, targetBody, idealDistance, false, true, true, true, isAttacking ? 4 : 2)

            if (!movementStateRef.current.targetPosition) {
                movementStateRef.current.targetPosition = new Vec2(v2)
            } else {
                movementStateRef.current.targetPosition.set(v2)
            }

            timeout = setTimeout(update, delay)
        }

        update()

        return () => {
            unmounted = true
            setRunning(false)
            if (timeout) {
                clearTimeout(timeout)
            }
        }

    }, [isAttacking])

    useEffect(() => {

        if (!pendingAttack) return

        const delay = lerp(3000, 6000, Math.random())

        const timeout = setTimeout(() => {
            setTimedOut(true)
        }, delay)

        return () => {
            clearTimeout(timeout)
        }

    }, [pendingAttack])

    useEffect(() => {
        return () => {
            setAttackState(null)
        }
    }, [])

    return (
        <>
            {
                attackState && (
                    <AttackStateHandler attackState={attackState} setAttackState={setAttackState}/>
                )
            }
        </>
    )
}
