import React, {useEffect} from "react"
import {useLgMobContext} from "../LgMobContext";
import {useMobBrainContext} from "../mobBrainContext";
import {Vec2} from "planck";
import {lerp} from "three/src/math/MathUtils";

const v2 = new Vec2()

export const IdleGoalHandler: React.FC = () => {

    const {
        startingPosition,
    } = useLgMobContext()

    const {
        updateTargetPosition,
    } = useMobBrainContext()

    useEffect(() => {

        const timeout = setTimeout(() => {
            v2.set(startingPosition.x, startingPosition.y)
            updateTargetPosition(v2)
        }, lerp(2000, 3000, Math.random()))

        return () => {
            clearTimeout(timeout)
        }
    }, [])

    return null
}
