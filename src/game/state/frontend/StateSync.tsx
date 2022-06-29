import React, {useCallback, useEffect, useLayoutEffect, useState} from "react"
import {useOnCustomMessage, useSendCustomMessage, useSyncData} from "@simonghales/react-three-physics";
import {messageKeys, syncKeys} from "../../data/keys";
import {updatePlayerInventory} from "./player";
import {emitPlayerInventoryItemReceived} from "../../events/player";
import {getSceneData, setInstancesData} from "@simonghales/react-three-scene-editor";
import {gameScenes, SceneIds} from "../../data/scenes";

export const StateSync: React.FC = () => {

    const state = useSyncData(syncKeys.backendStateSync, null)

    const sendCustomMessage = useSendCustomMessage()

    useEffect(() => {
        if (!state) return
        updatePlayerInventory(state.inventory ?? {})
    }, [state])

    useOnCustomMessage(messageKeys.playerInventoryChange, useCallback((data: any) => {
        emitPlayerInventoryItemReceived(data.data.type, data.data.count)
    }, []))

    const [sceneDataReady, setSceneDataReady] = useState(false)

    useOnCustomMessage(messageKeys.sceneDataReady, () => {
        setSceneDataReady(true)
    })

    // useLayoutEffect(() => {
    //     Object.values(gameScenes).forEach((scene) => {
    //         setInstancesData(scene.id, scene.data)
    //         console.log('setInstancesData', scene.data)
    //     })
    // }, [])

    useEffect(() => {
        if (!sceneDataReady) return
        const scenes: Record<string, any> = {}
        Object.entries(gameScenes).forEach(([id, data]) => {
            const scene = getSceneData(id, data.data)
            scenes[id] = scene
            if (id === SceneIds.l0) {
                sendCustomMessage(messageKeys.sceneData, scene)
            }
        })
    }, [sceneDataReady])

    return null
}
