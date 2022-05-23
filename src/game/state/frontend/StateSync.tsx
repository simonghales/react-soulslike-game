import React, {useEffect} from "react"
import {useSyncData} from "@simonghales/react-three-physics";
import {syncKeys} from "../../data/keys";
import {updatePlayerInventory} from "./player";

export const StateSync: React.FC = () => {

    const state = useSyncData(syncKeys.backendStateSync, null)

    useEffect(() => {
        if (!state) return
        updatePlayerInventory(state.inventory ?? {})
    }, [state])

    return null
}
