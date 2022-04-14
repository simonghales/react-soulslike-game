import {useOnCollisionBegin, useOnCollisionEnd} from "react-three-physics";
import {playerConfig} from "./config";
import {Fixture} from "planck/dist/planck-with-testbed";
import {getFixtureCollisionId, getFixtureCollisionType} from "../../utils/physics";
import {useEffect, useRef, useState} from "react";
import {PlayerAttackCollisionTypes} from "../data/collisions";
import {useEffectRef} from "../../utils/hooks";
import {AttackType} from "./LgPlayer";
import {LONG_ATTACK_DURATION, SHORT_ATTACK_DURATION} from "../data/attacks";

export const useAttackCollisionsHandler = (attackState: {
    type: string,
    time: number,
}) => {

    const [collisions, setCollisions] = useState({} as {
        [PlayerAttackCollisionTypes.QUICK_ATTACK]?: Record<string, Body>,
        [PlayerAttackCollisionTypes.LONG_ATTACK]?: Record<string, Body>,
    })

    const currentAttackRef = useRef({
        collisions: {} as Record<string, number>,
    })

    const collisionsRef = useEffectRef(collisions)

    useEffect(() => {
        currentAttackRef.current.collisions = {}
        if (attackState.type !== AttackType.SHORT && attackState.type !== AttackType.LONG) return
        if (attackState.type === AttackType.SHORT) {
            Object.keys(collisionsRef.current?.[PlayerAttackCollisionTypes.QUICK_ATTACK] ?? {}).forEach((id) => {
                console.log('initial short', id)
                currentAttackRef.current.collisions[id] = Date.now()
            })
        }
        if (attackState.type === AttackType.LONG) {
            Object.keys(collisionsRef.current?.[PlayerAttackCollisionTypes.LONG_ATTACK] ?? {}).forEach((id) => {
                console.log('initial long', id)
                currentAttackRef.current.collisions[id] = Date.now()
            })
        }
    }, [attackState])

    const attackStateRef = useEffectRef(attackState)

    useEffect(() => {
        if (attackStateRef.current.type !== AttackType.SHORT && attackStateRef.current.type !== AttackType.LONG) return
        const timeSinceAttack = Date.now() - attackStateRef.current.time
        if (attackStateRef.current.type === AttackType.SHORT) {
            if (timeSinceAttack > SHORT_ATTACK_DURATION) return
            Object.keys(collisions?.[PlayerAttackCollisionTypes.QUICK_ATTACK] ?? {}).forEach((id) => {
                if (!currentAttackRef.current.collisions[id]) {
                    currentAttackRef.current.collisions[id] = Date.now()
                }
            })
            return
        }
        if (attackStateRef.current.type === AttackType.LONG) {
            if (timeSinceAttack > LONG_ATTACK_DURATION) return
            Object.keys(collisions?.[PlayerAttackCollisionTypes.LONG_ATTACK] ?? {}).forEach((id) => {
                if (!currentAttackRef.current.collisions[id]) {
                    currentAttackRef.current.collisions[id] = Date.now()
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
