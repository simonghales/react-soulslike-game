import React, {useEffect} from "react"
import {GameWorldDynamicStateIds, ItemType} from "../../data/ids";
import {backendPlayerStateProxy} from "./player";
import {setDynamicStateFlag} from "./scene";
import {subscribe} from "valtio";

const checkInventory = () => {
    const inventory = backendPlayerStateProxy.inventory
    let hasBattery = false
    let hasWeapon = false
    Object.values(inventory).forEach(item => {
        if (item.type === ItemType.MELEE_WEAPON) {
            hasWeapon = true
        } else if (item.type === ItemType.SPARE_BATTERY) {
            hasBattery = true
        }
    })
    return hasBattery && hasWeapon
}

export type StateWatchFunction = (flag: string) => () => void

const StateWatcher: React.FC<{
    flag: string,
    watchFunction: StateWatchFunction,
}> = ({flag, watchFunction}) => {

    useEffect(() => {
        return watchFunction(flag)
    }, [])

    return null
}

const sceneStateHandlers: Record<GameWorldDynamicStateIds, StateWatchFunction> = {
    [GameWorldDynamicStateIds.L0_AI_ITEMS_OBTAINED]: (flag: string) => {

        const update = () => {
            setDynamicStateFlag(flag as GameWorldDynamicStateIds, checkInventory())
        }

        update()

        return subscribe(backendPlayerStateProxy.inventory, update)

    },
}

export const LgDynamicStateHandler: React.FC = () => {
    return (
        <>
            {
                Object.entries(sceneStateHandlers).map(([key, fun]) => {
                    return (
                        <StateWatcher flag={key} watchFunction={fun} key={key}/>
                    )
                })
            }
        </>
    )
}
