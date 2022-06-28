import {proxy, ref, snapshot, useSnapshot} from "valtio";
import {Vec2} from "planck";
import {MiscData} from "../../scene/MiscDataHandler";
import {get, set} from "local-storage";
import {backendPlayerStateProxy, StoredPlayerState} from "./player";
import {merge} from "lodash";

export type HatchData = {
    position: [number, number],
    height?: number,
}

export const staticLevelData = {
    hatches: new Map<string, HatchData>()
}

export const setHatchPosition = (id: string, position: [number, number], height?: number) => {
    staticLevelData.hatches.set(id, {
        position,
        height,
    })
    return () => {
        staticLevelData.hatches.delete(id)
    }
}

export const getHatchPosition = (id: string) => {
    return staticLevelData.hatches.get(id)
}

export type SceneState = {
    sceneLoaded: boolean,
    occludedVisibilityZones: Record<string, boolean>,
    startingPosition: Vec2,
    destroyedWalls: Record<string, boolean>,
    stateFlags: Record<string, number>,
    dynamicStateFlags: Record<string, boolean>,
    disabledVisibilityZones: Record<string, boolean>,
    miscData: MiscData,
    collectedItems: string[],
    completedDialogue: Record<string, boolean>,
    disabledComponents: Record<string, boolean>,
}

export type StoredSceneState = Exclude<SceneState, "startingPosition" | "miscData">

const getInitialSceneState = (): SceneState => {
    return {
        sceneLoaded: false,
        occludedVisibilityZones: {} as Record<string, boolean>,
        startingPosition: ref(new Vec2(-15.5, 14)),
        destroyedWalls: {} as Record<string, boolean>,
        stateFlags: {} as Record<string, number>,
        dynamicStateFlags: {} as Record<string, boolean>,
        disabledVisibilityZones: {} as Record<string, boolean>,
        miscData: {
            spawnPoints: [],
            worldPositions: {},
        } as MiscData,
        collectedItems: [] as string[],
        completedDialogue: {} as Record<string, boolean>,
        disabledComponents: {} as Record<string, boolean>,
    }
}

export const sceneStateProxy = proxy(getInitialSceneState())

export const setSceneLoaded = () => {
    sceneStateProxy.sceneLoaded = true
}

export const useIsSceneLoaded = () => {
    return useSnapshot(sceneStateProxy).sceneLoaded
}

export const isDynamicStateFlagActive = (flag: string) => {
    return sceneStateProxy.dynamicStateFlags[flag]
}

export const setComponentDisabled = (id: string) => {
    sceneStateProxy.disabledComponents[id] = true
}

export const setDialogueCompleted = (id: string) => {
    sceneStateProxy.completedDialogue[id] = true
}

export const useIsFlag = (flag?: string) => {
    const flags = useSnapshot(sceneStateProxy).stateFlags
    return flag ? !!flags[flag] : true
}

export const setSceneState = (state: StoredSceneState & StoredPlayerState) => {

    merge(sceneStateProxy.occludedVisibilityZones, state.occludedVisibilityZones)
    merge(sceneStateProxy.destroyedWalls, state.destroyedWalls)
    merge(sceneStateProxy.disabledVisibilityZones, state.disabledVisibilityZones)
    merge(sceneStateProxy.completedDialogue, state.completedDialogue)
    merge(sceneStateProxy.disabledComponents, state.disabledComponents)
    merge(sceneStateProxy.stateFlags, state.stateFlags)

    // Object.keys(sceneStateProxy.stateFlags).forEach(key => {
    //     delete sceneStateProxy.stateFlags[key]
    // })
    // Object.entries(state.stateFlags).forEach(([key, value]) => {
    //     sceneStateProxy.stateFlags[key] = value
    // })

    console.log('sceneStateProxy.stateFlags', JSON.stringify(state.stateFlags))

    sceneStateProxy.collectedItems.length = 0
    sceneStateProxy.collectedItems.push(...state.collectedItems)
    Object.keys(backendPlayerStateProxy.inventory).forEach(key => {
        delete backendPlayerStateProxy.inventory[key]
    })
    Object.entries(state.inventory).forEach(([key, value]) => {
        backendPlayerStateProxy.inventory[key] = ref(value)
    })

    console.log('setSceneState...')

}

export const getSceneStateSnapshot = () => {
    const stateSnapshot: any = {
        occludedVisibilityZones: snapshot(sceneStateProxy.occludedVisibilityZones),
        destroyedWalls: snapshot(sceneStateProxy.destroyedWalls),
        stateFlags: snapshot(sceneStateProxy.stateFlags),
        disabledVisibilityZones: snapshot(sceneStateProxy.disabledVisibilityZones),
        collectedItems: snapshot(sceneStateProxy.collectedItems),
        completedDialogue: snapshot(sceneStateProxy.completedDialogue),
        disabledComponents: snapshot(sceneStateProxy.disabledComponents),
        inventory: snapshot(backendPlayerStateProxy.inventory),
    }
    return stateSnapshot
}

export const setItemCollected = (id: string) => {
    sceneStateProxy.collectedItems.push(id)
}

export const setMiscData = (data: MiscData) => {
    Object.entries(data).forEach(([key, value]) => {
        // @ts-ignore
        sceneStateProxy.miscData[key] = ref(value)
    })

    if (data.spawnPoints.length) {
        setStartingPosition(data.spawnPoints[0][0], data.spawnPoints[0][1])
    }

}

export const setStateFlag = (id: string) => {
    sceneStateProxy.stateFlags[id] = Date.now()
}

export const setDynamicStateFlag = (id: string, active: boolean) => {
    sceneStateProxy.dynamicStateFlags[id] = active
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
