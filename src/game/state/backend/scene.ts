import {proxy, useSnapshot} from "valtio";

export const sceneStateProxy = proxy({
    occludedVisibilityZones: {} as Record<string, boolean>,
})

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
