import {getAttackDamage, PlayerAttackType} from "../config";
import {useCallback, useEffect, useRef} from "react";
import {usePlayerContext} from "../PlayerContext";
import {PlayerCollisionsState} from "../types";
import {emitMobDamaged} from "../../events/mobs";

export type AttackData = {
    time: number,
    type: PlayerAttackType,
}

export const useAttackHandler = (currentAttack: null | AttackData) => {

    const {
        collisionsState,
        body,
    } = usePlayerContext()

    const localStateRef = useRef({
        processedIds: [] as string[],
    })

    const handleCollisions = useCallback((collisionsState: PlayerCollisionsState) => {
        if (!currentAttack) return null

        let sensor: string[]

        if (currentAttack.type === PlayerAttackType.SHORT) {
            sensor = collisionsState.enemiesInShortAttackSensor
        } else {
            sensor = collisionsState.enemiesInLongAttackSensor
        }
        if (sensor) {
            sensor.forEach(id => {
                if (!localStateRef.current.processedIds.includes(id)) {
                    localStateRef.current.processedIds.push(id)
                    emitMobDamaged(id, getAttackDamage(currentAttack.type), body.getPosition().clone())
                }
            })
        }
    }, [currentAttack])

    useEffect(() => {
        localStateRef.current.processedIds.length = 0
    }, [currentAttack])

    useEffect(() => {
        handleCollisions(collisionsState)
    }, [handleCollisions, collisionsState])


}
