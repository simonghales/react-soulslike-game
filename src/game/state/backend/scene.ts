import {proxy, ref, useSnapshot} from "valtio";
import {Vec2} from "planck";

export const sceneStateProxy = proxy({
    occludedVisibilityZones: {} as Record<string, boolean>,
    startingPosition: ref(new Vec2(-15.5, 14)),
})

export const setStartingPosition = (x: number, y: number) => {
    console.log('set starting position?')
    sceneStateProxy.startingPosition.set(x, y)
}

export const getStartingPosition = () => {
    return sceneStateProxy.startingPosition
}

export const setVisibilityZoneOccluded = (id: string, occluded: boolean) => {
    if (!occluded) {
        delete sceneStateProxy.occludedVisibilityZones[id]
        return
    }
    sceneStateProxy.occludedVisibilityZones[id] = true
}

export const useIsEntityVisible = (currentZones: string[]) => {
    const occludedVisibilityZones = useSnapshot(sceneStateProxy.occludedVisibilityZones)
    const hidden = Object.keys(occludedVisibilityZones).some(id => currentZones.includes(id))
    return !hidden
}
