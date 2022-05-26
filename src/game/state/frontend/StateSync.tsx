import React, {useCallback, useEffect} from "react"
import {useOnCustomMessage, useSyncData} from "@simonghales/react-three-physics";
import {messageKeys, syncKeys} from "../../data/keys";
import {updatePlayerInventory} from "./player";
import {emitPlayerInventoryItemReceived} from "../../events/player";

export const StateSync: React.FC = () => {

    const state = useSyncData(syncKeys.backendStateSync, null)

    useEffect(() => {
        if (!state) return
        updatePlayerInventory(state.inventory ?? {})
    }, [state])

    useOnCustomMessage(messageKeys.playerInventoryChange, useCallback((data: any) => {
        emitPlayerInventoryItemReceived(data.data.type, data.data.count)
    }, []))

    return null
}
