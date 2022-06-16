import {proxy, ref, useSnapshot} from "valtio";
import {Vec2} from "planck";

export const sceneStateProxy = proxy({
    occludedVisibilityZones: {} as Record<string, boolean>,
    startingPosition: ref(new Vec2(-15.5, 14)),
    destroyedWalls: {} as Record<string, boolean>,
    stateFlags: {} as Record<string, number>,
    disabledVisibilityZones: {} as Record<string, boolean>,
})

export const setStateFlag = (id: string) => {
    sceneStateProxy.stateFlags[id] = Date.now()
}

export const setVisibilityZoneDisabled = (id: string, disabled: boolean = true) => {
    sceneStateProxy.disabledVisibilityZones[id] = disabled
}

export const setWallDestroyed = (id: string) => {
    sceneStateProxy.destroyedWalls[id] = true
}

export const setStartingPosition = (x: number, y: number) => {
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
