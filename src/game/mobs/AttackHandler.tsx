import React, {useCallback, useEffect, useState} from "react"
import {Goal, GoalType} from "./MobBrain";
import {useMobContext} from "./MobContext";
import {MobCollisionTypes} from "../data/collisions";
import {emitPlayerDamaged} from "../events/player";
import {mobsConfig} from "../data/mobs";
import {mobAttacksConfig} from "../data/attacks";

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
    enemiesInAttackRange: boolean,
}> = ({goal, enemiesInAttackRange}) => {

    const {
        attackingState,
        setAttackingState,
        setDamageZoneActive,
        damageZoneActive,
        setMovementRestricted,
        damageCooldown,
    } = useMobContext()

    const [attackCooldown, setAttackCooldown] = useState(0)

    const canAttack = enemiesInAttackRange && goal.type === GoalType.ATTACK_ENTITY && !attackCooldown && !damageCooldown
    const movementRestricted = !!attackCooldown || !!damageCooldown

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
        }, 400)
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

    return (
        <>
            {
                damageZoneActive && <AttackDamageHandler/>
            }
        </>
    )
}
