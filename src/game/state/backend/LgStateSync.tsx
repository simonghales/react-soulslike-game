import React, {useMemo} from "react"
import {useSnapshot} from "valtio";
import {backendPlayerStateProxy} from "./player";
import {useTransmitData} from "@simonghales/react-three-physics";
import {syncKeys} from "../../data/keys";

export const LgStateSync: React.FC = () => {

    const inventory = useSnapshot(backendPlayerStateProxy.inventory)

    useTransmitData(syncKeys.backendStateSync, useMemo(() => {
        return {
            inventory: {
                ...inventory,
            },
        }
    }, [inventory]))

    return null
}
