import {useOnCollisionBegin, useOnCollisionEnd} from "@simonghales/react-three-physics";
import {playerConfig} from "./config";
import {Fixture} from "planck/dist/planck-with-testbed";
import {getFixtureCollisionId, getFixtureCollisionType} from "../../utils/physics";
import {useEffect, useRef, useState} from "react";
import {PlayerAttackCollisionTypes} from "../data/collisions";
import {useEffectRef} from "../../utils/hooks";
import {AttackType} from "./LgPlayer";
import {attacksConfig, LONG_ATTACK_DURATION, SHORT_ATTACK_DURATION} from "../data/attacks";
import {emitMobDamaged} from "../events/mobs";
import {Vec2} from "planck";

export const useAttackCollisionsHandler = (attackState: {
    type: string,
    time: number,
}, getCurrentPosition: () => Vec2) => {

    const [collisions, setCollisions] = useState({} as {
        [PlayerAttackCollisionTypes.QUICK_ATTACK]?: Record<string, Body>,
        [PlayerAttackCollisionTypes.LONG_ATTACK]?: Record<string, Body>,
    })

    const currentAttackRef = useRef({
        collisions: {} as Record<string, number>,
    })

    const collisionsRef = useEffectRef(collisions)

    const [damageZoneActive, setDamageZoneActive] = useState(false)

    const damageZoneActiveRef = useEffectRef(damageZoneActive)

    useEffect(() => {
        setDamageZoneActive(false)
        console.log('reset collisions...')
        currentAttackRef.current.collisions = {}
        if (attackState.type !== AttackType.SHORT && attackState.type !== AttackType.LONG) return
        let timeout: any
        let inactiveTimeout: any

        const activeTime = attackState.time + (attackState.type === AttackType.SHORT ? 150 : 250) - 25
        const inactiveTime = activeTime + (attackState.type === AttackType.SHORT ? attacksConfig.short.duration + 25 : attacksConfig.long.duration + 25)

        const setActive = () => {
            setDamageZoneActive(true)
        }

        const setInActive = () => {
            setDamageZoneActive(false)
        }

        const timeUntilActive = activeTime - performance.now()
        const timeUntilInactive = inactiveTime - performance.now()

        if (timeUntilActive > 0) {
            timeout = setTimeout(setActive, timeUntilActive)
        } else {
            setActive()
        }

        if (timeUntilInactive > 0) {
            inactiveTimeout = setTimeout(setInActive, timeUntilInactive)
        } else {
            setInActive()
        }

        return () => {
            if (timeout) {
                clearTimeout(timeout)
            }
            if (inactiveTimeout) {
                clearTimeout(inactiveTimeout)
            }
        }

    }, [attackState])

    const attackStateRef = useEffectRef(attackState)

    useEffect(() => {
        if (!damageZoneActive) return
        const attackState = attackStateRef.current
        if (attackState.type === AttackType.SHORT) {
            Object.keys(collisionsRef.current?.[PlayerAttackCollisionTypes.QUICK_ATTACK] ?? {}).forEach((id) => {
                currentAttackRef.current.collisions[id] = performance.now()
                emitMobDamaged(id, attacksConfig.short.baseDamage, getCurrentPosition())
            })
        }
        if (attackState.type === AttackType.LONG) {
            Object.keys(collisionsRef.current?.[PlayerAttackCollisionTypes.LONG_ATTACK] ?? {}).forEach((id) => {
                currentAttackRef.current.collisions[id] = performance.now()
                emitMobDamaged(id, attacksConfig.long.baseDamage, getCurrentPosition())
            })
        }
    }, [damageZoneActive])

    useEffect(() => {
        if (!damageZoneActiveRef.current) {
            return
        }
        if (attackStateRef.current.type !== AttackType.SHORT && attackStateRef.current.type !== AttackType.LONG) return
        if (attackStateRef.current.type === AttackType.SHORT) {
            Object.keys(collisions?.[PlayerAttackCollisionTypes.QUICK_ATTACK] ?? {}).forEach((id) => {
                if (!currentAttackRef.current.collisions[id]) {
                    currentAttackRef.current.collisions[id] = performance.now()
                    emitMobDamaged(id, attacksConfig.short.baseDamage, getCurrentPosition())
                }
            })
            return
        }
        if (attackStateRef.current.type === AttackType.LONG) {
            Object.keys(collisions?.[PlayerAttackCollisionTypes.LONG_ATTACK] ?? {}).forEach((id) => {
                if (!currentAttackRef.current.collisions[id]) {
                    currentAttackRef.current.collisions[id] = performance.now()
                    emitMobDamaged(id, attacksConfig.long.baseDamage, getCurrentPosition())
                }
            })
            return
        }
    }, [collisions])

    useOnCollisionBegin(playerConfig.collisionIds.attack, (fixture: Fixture, currentFixture: Fixture) => {
        const collidedId = getFixtureCollisionId(fixture)
        if (!collidedId) return
        const collisionType = getFixtureCollisionType(currentFixture)
        setCollisions(prev => {
            const update: any = {
                ...prev
            }
            if (!update[collisionType]) {
                update[collisionType] = {}
            }
            update[collisionType][collidedId] = fixture.getBody()
            return update
        })
    })

    useOnCollisionEnd(playerConfig.collisionIds.attack, (fixture: Fixture, currentFixture: Fixture) => {
        const collidedId = getFixtureCollisionId(fixture)
        if (!collidedId) return
        const collisionType = getFixtureCollisionType(currentFixture)
        setCollisions(prev => {
            const update: any = {
                ...prev
            }
            if (!update[collisionType]) {
                return update
            }
            delete update[collisionType][collidedId]
            return update
        })
    })

}
