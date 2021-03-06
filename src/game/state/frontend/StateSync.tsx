import React, {useCallback, useEffect, useLayoutEffect, useState} from "react"
import {useOnCustomMessage, useSendCustomMessage, useSyncData} from "@simonghales/react-three-physics";
import {messageKeys, syncKeys} from "../../data/keys";
import {updatePlayerInventory} from "./player";
import {emitPlayerInventoryItemReceived} from "../../events/player";
import data from "../../scene/data.json"
import {getSceneData, setInstancesData} from "@simonghales/react-three-scene-editor";

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

    useLayoutEffect(() => {
        setInstancesData(data)
    }, [])

    useEffect(() => {
        if (!sceneDataReady) return
        const scene = getSceneData()
        sendCustomMessage(messageKeys.sceneData, scene)
    }, [sceneDataReady])

    return null
}
