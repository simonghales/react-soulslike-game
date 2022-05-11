import React, {useCallback, useEffect, useState} from "react"
import {mobsConfig} from "../../data/mobs";
import {Body, Vec2} from "planck";

export const useMobStatusState = () => {

    const [damageTaken, setDamageTaken] = useState(0)
    const [damageLastTaken, setDamageLastTaken] = useState(0)
    const [damageRecentlyTaken, setDamageRecentlyTaken] = useState(false)
    const [stunned, setStunned] = useState(false)
    const [deathPosition, setDeathPosition] = useState(null as null | Vec2)

    const onDamage = useCallback((damage: number) => {
        setDamageTaken(prevState => prevState + damage)
        setDamageLastTaken(Date.now())
    }, [])

    useEffect(() => {
        if (!damageLastTaken) return
        setDamageRecentlyTaken(true)
    }, [damageLastTaken])

    useEffect(() => {
        if (!stunned) return
        const timeout = setTimeout(() => {
            setStunned(false)
        }, mobsConfig.basic.damageCooldownDuration)
        return () => {
            clearTimeout(timeout)
        }
    }, [stunned])

    useEffect(() => {
        if (!damageRecentlyTaken) return
        setStunned(true)
        const timeout = setTimeout(() => {
            setDamageRecentlyTaken(false)
        }, 750)
        return () => {
            clearTimeout(timeout)
        }
    }, [damageRecentlyTaken])

    const healthRemaining = mobsConfig.basic.health - damageTaken

    const isAlive = healthRemaining > 0

    const onDeath = useCallback((body: Body) => {
        setDeathPosition(body.getPosition().clone())
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
    }

}

export const StatusHandler: React.FC = () => {
    return null
}
