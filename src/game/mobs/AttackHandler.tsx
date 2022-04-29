import React, {useCallback, useEffect, useState} from "react"
import {useMobContext} from "./MobContext";
import {MobCollisionTypes} from "../data/collisions";
import {emitPlayerDamaged} from "../events/player";
import {mobsConfig} from "../data/mobs";
import {mobAttacksConfig} from "../data/attacks";
import {Goal, GoalType} from "./types";
import {lerp} from "three/src/math/MathUtils";

const CollidedDamageHandler: React.FC<{
    id: string,
    damagePlayer: any,
}> = ({id, damagePlayer}) => {

    useEffect(() => {
        damagePlayer()
    }, [])

    return null

}

const AttackDamageHandler: React.FC = () => {

    const {
        collisions,
        body,
    } = useMobContext()

    const damagePlayer = useCallback(() => {
        emitPlayerDamaged('', mobsConfig.basic.damage, body.getPosition())
    }, [body])

    const [collided, setCollided] = useState({} as Record<string, number>)

    useEffect(() => {

        const attackRange = collisions[MobCollisionTypes.ATTACK_BOX] ?? {}

        Object.keys(attackRange).forEach((id: string) => {
            setCollided(state => {
                const update = {
                    ...state,
                }
                if (!update[id]) {
                    update[id] = Date.now()
                }
                return update
            })
        })

    }, [collisions])

    return (
        <>
            {
                Object.keys(collided).map((id) => (
                    <CollidedDamageHandler id={id} damagePlayer={damagePlayer} key={id}/>
                ))
            }
        </>
    )
}

export const AttackHandler: React.FC<{
    goal: Goal,
}> = ({goal}) => {

    const {
        attackingState,
        setAttackingState,
        setDamageZoneActive,
        damageZoneActive,
        setMovementRestricted,
        damageCooldown,
        collisionStates,
    } = useMobContext()

    const [attackCooldown, setAttackCooldown] = useState(0)

    const canAttack = collisionStates.enemiesInAttackRange && goal.type === GoalType.ATTACK_ENTITY && !attackCooldown && !damageCooldown
    const movementRestricted = !!attackCooldown || !!damageCooldown

    const mayConsiderAttacking = (!canAttack && !attackCooldown && !attackingState)

    const considerAttacking = mayConsiderAttacking && goal.type === GoalType.ATTACK_ENTITY

    const [recentlyConsiderAttacking, setRecentlyConsiderAttacking] = useState(considerAttacking)

    const attackRegardless = recentlyConsiderAttacking && mayConsiderAttacking

    useEffect(() => {
        if (considerAttacking) {
            setRecentlyConsiderAttacking(true)
        } else {
            const timeout = setTimeout(() => {
                setRecentlyConsiderAttacking(false)
            }, 1500)
            return () => {
                clearTimeout(timeout)
            }
        }
    }, [considerAttacking])

    useEffect(() => {
        setMovementRestricted(movementRestricted)
    }, [movementRestricted])


    const beginAttack = useCallback(() => {
        setAttackCooldown(Date.now())
        setAttackingState({
            started: Date.now(),
        })
    }, [])

    useEffect(() => {
        if (!attackingState) {
            setDamageZoneActive(false)
            return
        }
        const timeout = setTimeout(() => {
            setDamageZoneActive(true)
        }, mobAttacksConfig.basic.damageDelay)
        return () => {
            clearTimeout(timeout)
        }
    }, [attackingState])

    useEffect(() => {
        if (!attackingState) return

        const clear = () => {
            setAttackingState(null)
        }

        const timeRemaining = attackingState.started + mobAttacksConfig.basic.attackDuration - Date.now()

        if (timeRemaining <= 0) {
            clear()
            return
        }

        const timeout = setTimeout(clear, timeRemaining)

        return () => {
            clearTimeout(timeout)
        }

    }, [attackingState])

    useEffect(() => {
        if (!attackCooldown) return

        const clear = () => {
            setAttackCooldown(0)
        }

        const timeRemaining = attackCooldown + mobAttacksConfig.basic.cooldown - Date.now()

        if (timeRemaining <= 0) {
            clear()
            return
        }

        const timeout = setTimeout(clear, timeRemaining)

        return () => {
            clearTimeout(timeout)
        }

    }, [attackCooldown])

    useEffect(() => {

        if (!canAttack) return

        const timeout = setTimeout(beginAttack, mobAttacksConfig.basic.warmupDuration)

        return () => {
            clearTimeout(timeout)
        }

    }, [canAttack, beginAttack])

    useEffect(() => {

        if (!attackRegardless) return

        const delay = lerp(4000, 10000, Math.random())

        const timeout = setTimeout(beginAttack, delay)

        return () => {
            clearTimeout(timeout)
        }

    }, [attackRegardless])

    return (
        <>
            {
                damageZoneActive && <AttackDamageHandler/>
            }
        </>
    )
}
