import React, {useEffect, useRef} from "react"
import {useMobBrainContext} from "../mobBrainContext";
import {emitPlayerDamaged} from "../../events/player";
import {Vec2} from "planck";
import {getMobConfig} from "../../data/mobs";
import {useLgMobContext} from "../LgMobContext";

let v2 = new Vec2()

export const DamageHandler: React.FC = () => {

    const {
        type,
    } = useLgMobContext()

    const {
        collisionsState,
        body,
    } = useMobBrainContext()

    const localStateRef = useRef({
        attacked: {} as Record<string, boolean>,
    })

    useEffect(() => {
        v2.set(body.getPosition())
        Object.keys(collisionsState.attackRangeEnemies).forEach(id => {
            if (!localStateRef.current.attacked[id]) {
                localStateRef.current.attacked[id] = true
                emitPlayerDamaged(id, getMobConfig(type).damage, v2)
            }
        })

    }, [collisionsState])

    return null
}
