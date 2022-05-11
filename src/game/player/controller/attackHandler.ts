import {PlayerAttackType} from "../config";
import {useCallback, useEffect, useRef} from "react";

export type AttackData = {
    time: number,
    type: PlayerAttackType,
}

export const useAttackHandler = (currentAttack: null | AttackData) => {

    const localStateRef = useRef({
        processedIds: [] as string[],
    })

    const handleCollisions = useCallback(() => {
        if (!currentAttack) return null
        console.log('handleCollisions')
    }, [currentAttack])

    useEffect(() => {
        localStateRef.current.processedIds.length = 0
        console.log('currentAttack', currentAttack)
    }, [currentAttack])

    useEffect(() => {
        handleCollisions()
    }, [handleCollisions])


}
