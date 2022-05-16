import {proxy, ref, useSnapshot} from "valtio";
import {playerConfig} from "../../player/config";
import {MutableRefObject, useEffect} from "react";
import {Object3D} from "three";

export const playerStateProxy = proxy({
    energyUsage: 0,
    healthRemaining: playerConfig.defaultHealth,
})

export type RecentHitData = [xVel: number, yVel: number, time: number]

export const playerMiscProxy = proxy({
    targetRef: null as null | MutableRefObject<Object3D>,
    recentHits: ref([]) as RecentHitData[],
})

export const addRecentHit = (xVel: number, yVel: number) => {
    playerMiscProxy.recentHits.push([xVel, yVel, Date.now()])
}

export const useTargetRef = () => {
    return useSnapshot(playerMiscProxy).targetRef
}

export const setPlayerTargetRef = (targetRef: MutableRefObject<Object3D>) => {
    playerMiscProxy.targetRef = ref(targetRef)
    return () => {
        playerMiscProxy.targetRef = null
    }
}

export const useSetPlayerTargetRef = (active: boolean, ref: MutableRefObject<Object3D>) => {
    useEffect(() => {
        if (!active) return
        return setPlayerTargetRef(ref)
    }, [active])
}

export const setPlayerHealthRemaining = (healthRemaining: number) => {
    playerStateProxy.healthRemaining = healthRemaining
}

export const setPlayerEnergyUsage = (energyUsage: number) => {
    playerStateProxy.energyUsage = energyUsage
}
