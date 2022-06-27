import React from "react"
import {ItemType} from "../../data/ids";
import {LgItem} from "./LgItem";
import {useSnapshot} from "valtio";
import {sceneStateProxy} from "../../state/backend/scene";

export type ItemData = {
    id: string,
    itemType: ItemType,
    position: [number, number],
}

export type ItemsData = ItemData[]

export const ItemsManager: React.FC<{
    items: ItemsData,
}> = ({items}) => {

    const collectedItems = useSnapshot(sceneStateProxy.collectedItems)

    return (
        <>
            {items.map(item => {
                if (collectedItems.includes(item.id)) return null
                return (
                    <LgItem data={item} key={item.id}/>
                )
            })}
        </>
    )
}
