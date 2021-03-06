import React, {useCallback, useEffect, useState} from "react"
import {Body, Vec2} from "planck";
import {addDeadBody, MobType} from "../../state/game";
import {getMobConfig} from "../../data/mobs";

export const useMobStatusState = (id: string, type: MobType) => {

    const [ready, setReady] = useState(false)
    const [damageTaken, setDamageTaken] = useState(0)
    const [damageLastTaken, setDamageLastTaken] = useState(0)
    const [damageRecentlyTaken, setDamageRecentlyTaken] = useState(false)
    const [stunned, setStunned] = useState(false)
    const [deathPosition, setDeathPosition] = useState(null as null | Vec2)

    const onDamage = useCallback((damage: number) => {
        setDamageTaken(prevState => prevState + damage)
        setDamageLastTaken(performance.now())
    }, [])

    useEffect(() => {
        if (!damageLastTaken) return
        setDamageRecentlyTaken(true)
    }, [damageLastTaken])

    useEffect(() => {
        if (!stunned) return
        const timeout = setTimeout(() => {
            setStunned(false)
        }, getMobConfig(type).damageCooldownDuration)
        return () => {
            clearTimeout(timeout)
        }
    }, [stunned])

    useEffect(() => {
        if (!damageRecentlyTaken) return
        setStunned(true)
        const timeout = setTimeout(() => {
            setDamageRecentlyTaken(false)
        }, 1500)
        return () => {
            clearTimeout(timeout)
        }
    }, [damageRecentlyTaken])

    const healthRemaining = getMobConfig(type).health - damageTaken

    const isAlive = healthRemaining > 0

    const onDeath = useCallback((body: Body) => {
        setDeathPosition(body.getPosition().clone())
        addDeadBody(id, body.getPosition().x, body.getPosition().y, type)
    }, [])

    return {
        damageTaken,
        damageRecentlyTaken,
        onDamage,
        stunned,
        isAlive,
        healthRemaining,
        onDeath,
        deathPosition,
        ready,
        setReady,
    }

}

export const StatusHandler: React.FC = () => {
    return null
}
