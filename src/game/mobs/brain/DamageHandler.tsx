import React, {useEffect, useRef} from "react"
import {useMobBrainContext} from "../mobBrainContext";
import {emitPlayerDamaged} from "../../events/player";
import {mobsConfig} from "../../data/mobs";
import {Vec2} from "planck";

let v2 = new Vec2()

export const DamageHandler: React.FC = () => {

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
                emitPlayerDamaged(id, mobsConfig.basic.damage, v2)
            }
        })

    }, [collisionsState])

    return null
}
