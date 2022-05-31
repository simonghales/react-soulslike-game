import React, {useCallback, useEffect, useState} from "react"
import {useMobBrainContext} from "../mobBrainContext";
import {getPosition} from "./MoveGoalHandler";
import {Vec2} from "planck";
import {lerp} from "three/src/math/MathUtils";
import {AttackGoalSubGoalTypes, AttackState, AttackStateType} from "./types";
import {mobAttacksConfig} from "../../data/attacks";
import {angleToV2} from "../../../utils/angles";
import {useGoalHandlerContext} from "./GoalHandlerContext";
import {DamageHandler} from "./DamageHandler";
import {useLgMobContext} from "../LgMobContext";
import {getMobConfig} from "../../data/mobs";

export const AttackStateHandler: React.FC<{
    attackState: AttackState,
    setAttackState: any,
}> = ({attackState, setAttackState}) => {

    const {
        body,
        movementStateRef,
        collisionsState,
        damageRecentlyTaken,
    } = useMobBrainContext()

    const {
        setSubGoal,
    } = useGoalHandlerContext()

    const isCharging = attackState.type === AttackStateType.CHARGING
    const isAttacking = attackState.type === AttackStateType.ATTACKING
    const [timedOut, setTimedOut] = useState(false)

    const isAggressive = damageRecentlyTaken && collisionsState.enemiesInAttackRange

    const [damageActive, setDamageActive] = useState(false)

    useEffect(() => {
        if (!isAttacking) {
            setDamageActive(false)
        } else {
            const timeout = setTimeout(() => {
                setDamageActive(true)
            }, 500)
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

    const shouldSwing = isCharging && (timedOut || inAttackRangeAwhile || isAggressive)

    useEffect(() => {
        if (!isAttacking) {
            movementStateRef.current.lockedTarget = false
            return
        }
        const timeout = setTimeout(() => {
            movementStateRef.current.lockedTarget = true
        }, 200)
        return () => {
            clearTimeout(timeout)
            movementStateRef.current.lockedTarget = false
        }
    }, [isAttacking])

    useEffect(() => {
        if (!shouldSwing) return
        setAttackState({
            type: AttackStateType.ATTACKING,
            time: performance.now(),
        })
        // const target = new Vec2(body.getPosition())
        // const angle = body.getAngle()
        // const angleVector = new Vec2()
        // angleToV2(angle, angleVector)
        // angleVector.mul(1.5)
        // target.add(angleVector)
    }, [shouldSwing])

    useEffect(() => {

        const handleAttacking = () => {
            const end = attackState.time + mobAttacksConfig.basic.attackDuration
            const delay = end - performance.now()
            const update = () => {
                setAttackState({
                    type: AttackStateType.COOLDOWN,
                    time: performance.now(),
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
            const delay = end - performance.now()
            const update = () => {
                setAttackState(null)
                setSubGoal({
                    type: AttackGoalSubGoalTypes.IDLE,
                    time: performance.now(),
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
        type,
    } = useLgMobContext()

    const config = getMobConfig(type)

    const {
        collisionsState,
        targetBodyRef,
        body,
        updateTargetPosition,
        setDebugData,
        setRunning,
        setSpeedLimit,
        attackState,
        attackStateRef,
        setAttackState,
        damageRecentlyTaken,
        setSubGoal,
        stunned,
    } = useMobBrainContext()

    useEffect(() => {
        if (!stunned) return
        const attackState = attackStateRef.current
        if (attackState) {
            if (attackState.type === AttackStateType.ATTACKING) {
                return
            }
        }
        setSubGoal({
            type: AttackGoalSubGoalTypes.IDLE,
            time: performance.now(),
        })
    }, [stunned])

    const [pendingAttack, setPendingAttack] = useState(true)

    const [shouldSprint, setShouldSprint] = useState(false)

    useEffect(() => {
        if (!damageRecentlyTaken) return
        setShouldSprint(true)
    }, [damageRecentlyTaken])

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
            setSpeedLimit(config.movement.sprintSpeed)
            return
        }
        if (!attackState) {
            setSpeedLimit(null)
            return
        }
        setSpeedLimit(config.movement.slowSpeed)
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
            time: performance.now(),
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

            updateTargetPosition(v2)

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
