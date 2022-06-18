import React, {useEffect, useState} from "react"
import {usePlayerContext} from "../PlayerContext";
import {emitMobDamaged} from "../../events/mobs";
import {Vec2} from "planck";
import {playerAttacksConfig, PlayerAttackType} from "../config";
import {playerBodyConfig} from "./types";

const v2 = new Vec2()

export const RollingHandler: React.FC<{
    constant?: boolean,
}> = ({constant = false}) => {

    const {
        collisionsState,
        body,
        fixtures,
    } = usePlayerContext()

    const [localState] = useState({
        collidedIds: [] as string[],
        previousCollidedIds: [] as string[],
    })

    useEffect(() => {
        if (!constant) return
        console.log('set to bouncy settings...', fixtures.default.isSensor())
        fixtures.default.setSensor(false)
        fixtures.medium.setSensor(true)
        fixtures.small.setSensor(true)
        fixtures.default.setRestitution(1)
        fixtures.default.setDensity(15)
        body.setLinearDamping(playerBodyConfig.linearDampingRolling)
        body.resetMassData();
        return () => {
            console.log('reset bounce...')
            fixtures.default.setSensor(false)
            fixtures.medium.setSensor(true)
            fixtures.small.setSensor(true)
            fixtures.default.setRestitution(0)
            fixtures.default.setDensity(1.5)
            body.setLinearDamping(playerBodyConfig.linearDamping)
            body.resetMassData();
        }
    }, [])

    useEffect(() => {
        const breakable = collisionsState.breakableCollisions
        breakable.forEach(id => {
            if (!constant && localState.collidedIds.includes(id)) {
                return
            }
            if (constant) {
                if (localState.previousCollidedIds.includes(id)) return
            } else {
                localState.collidedIds.push(id)
            }
            emitMobDamaged(id, playerAttacksConfig[PlayerAttackType.SHORT].baseDamage, v2)
        })
        if (constant) {
            localState.previousCollidedIds.length = 0
            localState.previousCollidedIds.push(...breakable)
        }
    }, [collisionsState])

    return null
}
